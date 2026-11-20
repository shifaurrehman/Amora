# Supabase Security Review — Phase 6

Review of the Amora Supabase project's security posture after the Firebase migration.

- **Part A** — static review of `supabase/migrations/20261120142000_initial_schema.sql` against the Supabase Security Advisor lint set (done, results below).
- **Part B** — read-only SQL probes to run in the Supabase SQL Editor plus the exact dashboard path to run the live Security Advisor; paste results back for triage.
- **Part C** — triage rules and the fix process (new migration per finding, remote apply only after owner approval).

## Part A — Static review (migration SQL)

All line references point to `supabase/migrations/20261120142000_initial_schema.sql`.

| # | Advisor lint | Status | Evidence / notes |
|---|---|---|---|
| 1 | RLS disabled in public schema | ✅ Pass | `alter table ... enable row level security` on all 8 tables (lines 147–154) |
| 2 | RLS enabled but no policy | ✅ Pass | Every table has ≥1 policy (lines 176–348): languages (read), profiles (read-discoverable/insert/update), profile_private (owner CRUD), profile_languages (read/insert/delete), profile_media (read/insert/update/delete), conversations (read/insert), messages (read/insert), favorites (read/insert/delete) |
| 3 | Function search path mutable | ✅ Pass | `set_updated_at()` is `security definer` **with** `set search_path = ''` (lines 125–135); `execute` revoked from `public`, `anon`, `authenticated` (line 145) |
| 4 | Public/anon table grants | ✅ Pass | `revoke all` from `anon, authenticated` on every table (lines 156–165); minimal per-command grants to `authenticated` only (lines 167–174); `languages` is select-only |
| 5 | Multiple permissive policies | ✅ Pass | Each table's policies cover *distinct* commands (select/insert/update/delete) for the `authenticated` role — no same-command overlap that could widen access |
| 6 | `auth.uid()` usage pattern | ✅ Pass | All policies use the parenthesized `(select auth.uid())` form (planner-safe; avoids per-row re-evaluation) |
| 7 | Bucket is public | ✅ Pass | `profile-media` created with `public = false` (lines 350–364), plus an idempotency check that *raises* if the live bucket ever drifts from the approved private config (lines 366–381) |
| 8 | Bucket limits | ✅ Pass | `file_size_limit = 5242880` (5 MiB), `allowed_mime_types = ['image/jpeg','image/png','image/webp']` (lines 358–362) |
| 9 | Storage policy scope | ✅ Pass | All four `storage.objects` policies are scoped to `bucket_id = 'profile-media'` (lines 383–439). Writes/deletes require `split_part(name,'/',1) = auth.uid()`; **reads of another user's object require a registered `profile_media` row whose profile `is_discoverable`** — orphan objects are unreadable to others |
| 10 | Object insert without registration | ✅ Pass | Storage insert policy requires a matching `profile_media` row to already exist (lines 401–413) — the app inserts the row first, then uploads (see `src/services/supabase/media.ts`) |
| 11 | Realtime exposure | ✅ Pass | Publication contains only `public.messages` (line 441); delivery is subject to the `messages_read_participant` RLS policy |
| 12 | Privileged keys in client | ✅ Pass | Mobile code uses only the anon key (`src/lib/supabase.ts`, `babel.config.js` allow-list); no `service_role` key anywhere in the repo |

### Advisory observations (no action required)

- **a) Column-level grants.** `update` on `profiles` is row-restricted by RLS but column-unrestricted (e.g., a client could update `created_at` on its own row). Harmless today; column-level grants could tighten it later.
- **b) Realtime `REPLICA IDENTITY`.** `messages` is not `REPLICA IDENTITY FULL`. Fine for the INSERT-only subscription the app uses; revisit if UPDATE/DELETE events are ever consumed.
- **c) Immutable chat history.** `messages`/`conversations` have no `update`/`delete` grants — clients cannot edit or delete chat history. Intentional.
- **d) `is_discoverable` semantics.** Discoverability is owner-controlled via the `profiles` update grant; RLS enforces visibility everywhere (lists, media reads, chat creation, favoriting). No UI toggle exists yet — default `true`.

### Dashboard-side checks only the owner can see (verify in Console)

1. **Auth → Email provider**: "Confirm email" enabled (the local `supabase/config.toml` sets `enable_confirmations = true`; the *remote* project setting must match — the app enforces `email_confirmed_at` client-side regardless).
2. **Auth → Policy/settings**: leaked-password protection, minimum password length (local config: 6), rate limits, captcha — decide per production posture.
3. **Auth → SMTP**: production email delivery is not configured yet (outstanding item).
4. **No exposed keys**: only `SUPABASE_URL` + `SUPABASE_ANON_KEY` in `.env`; the JWT secret and service key are never in the repo.
5. **Database → Extensions/backups**: nothing extra was installed by the app.

## Part B — Live verification (owner runs, read-only)

### B1. SQL probes — Supabase Dashboard → SQL Editor → paste each block

All probes are `SELECT`-only against catalogs. Expected results are noted inline.

```sql
-- 1. RLS enabled on every public table (expect 8 rows, all true)
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- 2. Policies per table (expect only the policies from the baseline migration)
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Grants to anon (expect 0 rows) and authenticated (expect only the baseline grants)
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- 4. Storage policies for the profile-media bucket (expect 4, all bucket-scoped)
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage'
and position('profile-media' in coalesce(qual, '') || coalesce(with_check, '')) > 0
order by policyname;

-- 5. Bucket configuration (expect public=false, 5242880, the 3 mime types)
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'profile-media';

-- 6. Data counts (pre-launch expectation: all zero)
select
  (select count(*) from public.profiles)        as profiles,
  (select count(*) from public.profile_media)   as profile_media_rows,
  (select count(*) from storage.objects where bucket_id = 'profile-media') as storage_objects,
  (select count(*) from public.conversations)   as conversations,
  (select count(*) from public.messages)        as messages,
  (select count(*) from public.favorites)       as favorites;

-- 7. Realtime publication members (expect exactly one row: public.messages)
select * from pg_publication_tables where pubname = 'supabase_realtime';

-- 8. Security-definer functions pinned (expect proconfig to contain search_path=empty)
select p.proname, p.prosecdef, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;
```

### B2. Security Advisor — Dashboard path

1. Open the project at `https://supabase.com/dashboard/project/<ref>`.
2. Go to **Security → Advisor** (on older layouts: **Database → Lints**) and run it.
3. Copy the findings for all three categories — **Database**, **Auth**, **Storage** — and paste them back into this review (Part C).

## Part C — Triage and fix process

For each pasted finding, record a row:

| Finding | Category | Verdict | Action |
|---|---|---|---|
| *(paste advisor finding here)* | Database/Auth/Storage | real / advisory / not-applicable | migration file or none |

Verdicts:

- **real** — confirmed weakness against this app's threat model.
- **advisory** — true but acceptable/deliberate (see Part A observations).
- **not-applicable** — generic advisor warning that does not apply (e.g., warnings about a public bucket when the app only has a private one).

Fix rules (agreed with the owner):

1. Every **real** finding becomes a **new timestamped migration** in `supabase/migrations/` (e.g. `20261120190000_fix_<slug>.sql`). The applied baseline `20261120142000_initial_schema.sql` is never edited.
2. The fix SQL is shown to the owner before anything touches the remote project.
3. Remote application (`npx supabase db push` or the dashboard SQL editor) happens **only after explicit owner approval**.
4. If a fix changes app behavior, it is implemented together with the migration and covered by tests in the same change.
