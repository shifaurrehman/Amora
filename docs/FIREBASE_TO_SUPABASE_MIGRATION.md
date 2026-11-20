# Firebase → Supabase Migration Guide

This guide documents the Amora mobile app's migration from Firebase (Auth, Firestore, ImgBB-hosted images) to Supabase, as executed on branch `migrate/firebase-to-supabase` (draft PR #24). It is aimed at maintainers resuming the project after the cutover: it explains what moved where, the setup the app now requires, intentional behavior changes, and what still needs an owner decision.

## Current state

| Concern | Provider | Notes |
|---|---|---|
| Email/password auth, sessions | Supabase Auth | Email confirmation enforced client-side |
| Profiles, discovery, filters | Supabase Postgres (`profiles` etc.) | RLS-scoped queries |
| Profile images | Supabase Storage, private `profile-media` bucket | Signed URLs for display |
| Favorites | Supabase Postgres (`favorites`) | Per-account, optimistic UI |
| Chat + realtime | Supabase Postgres + Realtime (`conversations`, `messages`) | Realtime limited to `public.messages` inserts |
| Push notifications (FCM) | **Firebase (retained)** | `@react-native-firebase/app` + `messaging`, `google-services.json`, gradle plugin |
| Google Sign-In | Skipped intentionally | Not migrated; can be added via Supabase OAuth later |

No Firebase data was copied — the Supabase project started empty (there were no real users). The old ImgBB image host is fully removed from source.

## Phase history

- **Phase 3** — Supabase schema, RLS policies, and the private `profile-media` bucket were created in `supabase/migrations/20261120142000_initial_schema.sql` and applied to the project, empty. Local Supabase CLI config lives in `supabase/config.toml`.
- **Phase 4** — Email/password signup, login, email-confirmation checks, session persistence/refresh, and logout moved to Supabase (`src/lib/supabase.ts`, `src/screens/{Login,Signup,Splash}`, logout in `src/screens/Profile/Profile.tsx`).
- **Phase 5** — Profile creation/editing, discovery + filters, favorites, chat, and image upload/display moved to Supabase behind a service layer in `src/services/supabase/`. ImgBB removed; unused Firebase packages (`auth`, `firestore`, `storage`) uninstalled.
- **Phase 6** — This guide plus the security review in [supabase_security_review.md](supabase_security_review.md).

## Environment setup

The app reads two public environment variables from the root `.env` (see `.env.example`):

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<public anon key>
```

- The **anon key is public by design**; access control is enforced by RLS.
- **Never** put a `service_role` key in mobile code or `.env` — it bypasses RLS.
- The single shared client is created in `src/lib/supabase.ts` (AsyncStorage session persistence, auto token refresh gated on app state in `src/App.tsx`). All data access goes through it.
- The key is allow-listed for `react-native-dotenv` in `babel.config.js`; TypeScript declarations are in `src/types/env.d.ts`.

## What moved where

### Authentication

| Firebase (old) | Supabase (new) |
|---|---|
| `firebase.auth().createUserWithEmailAndPassword` | `supabase.auth.signUp` (stores `display_name` metadata) |
| Email-verification state on the user object | `user.email_confirmed_at` checked after sign-in; unconfirmed users are signed out with an alert |
| ID token / persistence | Supabase session in AsyncStorage; `startAutoRefresh`/`stopAutoRefresh` driven by `AppState` |
| `signOut` | `supabase.auth.signOut` + clearing `USERUID` (MMKV) and the `userProfile` cache |

Navigation after login decides `Home` vs `CreateProfile` by checking for a `profiles` row for the user id.

### Profiles (Firestore `usersProfiles` collection → normalized tables)

| Firestore field | Supabase column(s) |
|---|---|
| `userId` | `profiles.user_id` (PK, FK to `auth.users`) |
| `age` (string) | `profiles.age_years` (smallint) |
| `employmentStatus` / `maritalStatus` | `profiles.employment_status` / `profiles.marital_status` |
| `languages: [{id, name}]` | `profile_languages` rows → `languages` lookup table (ids 1–20 seeded, matching the old dropdown data) |
| `dateOfBirth` (in the public doc!) | `profile_private.date_of_birth` — **owner-readable only** |
| `profileImage: {uri}` | `profile_media` row (`kind='avatar'`, `position=0`) + object in the private bucket |
| `extraimages: [{uri}]` | `profile_media` rows (`kind='gallery'`, `position` 1–3) + bucket objects |
| `createdAt` | `created_at` (server default) |
| — | `profiles.is_discoverable` (new: gates whether other users can see the profile) |

Saving a profile (`saveProfile` in `src/services/supabase/profiles.ts`) is idempotent: it inserts or updates `profiles`, upserts `profile_private`, replaces `profile_languages`, and replaces media (old rows + objects deleted, new rows inserted, then files uploaded).

### Images (ImgBB → private Supabase Storage)

- Bucket: `profile-media`, **private**, 5 MiB limit, `image/jpeg` / `image/png` / `image/webp` only. Enforced by the bucket config *and* validated client-side (`validatePickedImage` in `src/services/supabase/media.ts`).
- Object paths are `<user_id>/{avatar|gallery}-<position>.<ext>`. The storage RLS policies require the first path segment to equal the caller's uid.
- Upload order matters: the `profile_media` **row is inserted before the object is uploaded** (the storage insert policy requires a matching row). If the upload fails, the row is deleted again.
- Display uses **signed URLs** (default 1-hour expiry) generated in bulk per screen. Nothing is publicly accessible.
- The device-gallery copy behavior (RNFS + CameraRoll) was unchanged by the migration.

### Chat (Firestore nested docs → `conversations` + `messages` + Realtime)

- A conversation row is the pair with `participant_a < participant_b` (uuid order, unique constraint). `getOrCreateConversation` selects first, inserts on miss, and recovers from the unique-violation race (SQLSTATE 23505).
- `onSnapshot` listeners were replaced by a Realtime channel subscribed **only to `INSERT` events on `public.messages`** filtered by `conversation_id` (the only table added to the `supabase_realtime` publication).
- `ActiveChatScreen` resolves the caller's own id from the session (`getCurrentUserId`), not from navigation params.
- Sends are optimistic; the stored row replaces the local bubble, with id-based dedupe against realtime.

### Favorites (Redux persistence → `favorites` table)

- `favorites(user_id, favorite_user_id)` rows; toggling is optimistic with revert + alert on failure (`src/redux/favoriteThunks.ts`).
- Redux-persist no longer stores favorites (empty whitelist in `src/redux/store.ts`); the list is loaded from Supabase when Home/Favorites mount.

### Kept local storage keys

- MMKV `USERUID` — cached user id (written at login/splash).
- AsyncStorage `userProfile` — offline fallback cache of the signed-in user's own profile (Profile screen prefers a fresh fetch because signed URLs expire).

## Intentional behavior changes

1. **Favorites are per-account server state**, reloaded per session, not a local persisted list.
2. **Discovery filters run server-side** on the indexed discoverable columns (`gender`, `age_years`, `religion`) instead of fetching everything and filtering on-device.
3. **Profile screen fetches fresh data first** (signed URLs expire after ~1 h); the local cache is only an offline fallback.
4. **Chat identity comes from the session**, fixing a pre-existing bug where the Details screen passed the other user's id as your own.
5. **Non-discoverable profiles are invisible** to other users (list, details media, chat creation, favoriting) — a new privacy property enforced by RLS, not just UI.

## Security model (summary)

- Row Level Security is enabled on every public table with least-privilege grants; `anon` has no table grants, and `authenticated` grants are per-command.
- `profile_private` (DOB) is readable/writable only by its owner.
- Storage: the bucket is private; reads of another user's object require a registered `profile_media` row whose profile is discoverable; writes/deletes require path ownership.
- Realtime: only `public.messages` is published, and RLS applies to delivery.
- Full review, probe queries, and the advisor checklist: [supabase_security_review.md](supabase_security_review.md).

## FCM (retained Firebase)

Push messaging intentionally stays on Firebase Cloud Messaging for now:

- npm: `@react-native-firebase/app`, `@react-native-firebase/messaging`
- Android: `android/app/google-services.json` + the `com.google.gms.google-services` gradle plugin

If push is moved off Firebase later, the typical path is Supabase Edge Functions + FCM/APNs HTTP APIs or a provider (e.g., Expo push/OneSignal); that work is **not** part of this migration.

## Firebase project decommission checklist (owner actions — not done yet)

> No real users exist and no data was migrated, so nothing must be preserved from Firestore/Firebase Auth.

1. Confirm no other app/legit traffic uses the Firebase project (`eternalvows-3186b`).
2. Keep the project alive **only if FCM stays** — FCM depends on it. If/when push moves off FCM, the whole project can be shut down.
3. Disable the Email/Password (and Google) auth providers in Firebase Console when confident.
4. Export-then-delete Firestore data if you want an audit trail; otherwise delete directly.
5. **Rotate the ImgBB API key** that was previously hard-coded in `src/utils/UploadImages.ts` — the key was removed from the source but exists in git history.
6. Delete the local Firebase CLI artifacts when no longer needed: `.firebaserc`, `firebase.json`, `firestore.rules`, `firestore.indexes.json` (currently untracked local files, kept intentionally).

## Outstanding (tracked separately)

- On-device end-to-end testing of the full profile/chat/favorites flows (manual steps in PR #24).
- Production email delivery (SMTP) and redirect URLs for auth emails — Supabase dashboard config, owner action.
- Test-baseline restoration (App.test module path, detox e2e wiring): issues #19 and #20.
