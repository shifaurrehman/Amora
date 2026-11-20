import { supabase } from '../../lib/supabase';
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';
import {
  AVATAR_POSITION,
  MAX_GALLERY_POSITION,
  MIN_GALLERY_POSITION,
  PickedImage,
  ProfileMediaRow,
  buildMediaRow,
  createSignedUrlMap,
  deleteProfileMedia,
  galleryPositionForIndex,
  uploadProfileMedia,
} from './media';

// Embeds the languages and media rows owned by each profile row. RLS limits
// what is returned to profiles the caller may read (own + discoverable).
export const PROFILE_SELECT =
  '*, profile_languages(language_id, languages(id, name)), ' +
  'profile_media(id, user_id, object_path, kind, position, mime_type, file_name)';

interface LanguageRow {
  id: number;
  name: string;
}

interface ProfileLanguageJoinRow {
  language_id: number;
  languages: LanguageRow | null;
}

export interface ProfileJoinRow {
  user_id: string;
  name: string;
  age_years: number;
  gender: string;
  profession: string;
  education: string;
  height: string;
  weight: string;
  hobbies: string;
  religion: string;
  sect: string;
  city: string;
  about: string;
  employment_status: string;
  marital_status: string;
  is_discoverable: boolean;
  created_at: string;
  updated_at: string;
  profile_languages?: ProfileLanguageJoinRow[] | null;
  profile_media?: ProfileMediaRow[] | null;
}

export interface ProfileDraft {
  name: string;
  age: string;
  gender: string;
  profession: string;
  education: string;
  height: string;
  weight: string;
  hobbies: string;
  religion: string;
  sect: string;
  city: string;
  about: string;
  employmentStatus: string;
  maritalStatus: string;
  dateOfBirth?: string;
  languageIds: number[];
  profileImage: PickedImage | null;
  extraImages: PickedImage[];
}

const UNIQUE_VIOLATION_CODE = '23505';

function toProfileInsertRow(draft: ProfileDraft) {
  const ageYears = Number.parseInt(draft.age, 10);
  if (Number.isNaN(ageYears)) {
    throw new Error('Age must be a number.');
  }
  return {
    user_id: '', // filled in by saveProfile
    name: draft.name,
    age_years: ageYears,
    gender: draft.gender,
    profession: draft.profession,
    education: draft.education,
    height: draft.height,
    weight: draft.weight,
    hobbies: draft.hobbies,
    religion: draft.religion,
    sect: draft.sect || '',
    city: draft.city,
    about: draft.about || '',
    employment_status: draft.employmentStatus,
    marital_status: draft.maritalStatus,
  };
}

/** Maps schema rows to the existing UserProfileType shape used by the UI. */
export async function mapProfileRowsToUsers(
  rows: ProfileJoinRow[],
): Promise<UserProfileType[]> {
  const urlByPath = await createSignedUrlMap(
    rows.flatMap((row) => (row.profile_media || []).map((media) => media.object_path)),
  );

  return rows.map((row) => {
    const media = [...(row.profile_media || [])].sort((a, b) => a.position - b.position);
    const avatar = media.find((item) => item.kind === 'avatar');
    const gallery = media.filter(
      (item) =>
        item.kind === 'gallery' &&
        item.position >= MIN_GALLERY_POSITION &&
        item.position <= MAX_GALLERY_POSITION,
    );

    return {
      id: row.user_id,
      userId: row.user_id,
      name: row.name,
      age: String(row.age_years),
      gender: row.gender,
      profession: row.profession,
      education: row.education,
      height: row.height,
      weight: row.weight,
      hobbies: row.hobbies,
      religion: row.religion,
      sect: row.sect,
      city: row.city,
      about: row.about,
      employmentStatus: row.employment_status,
      maritalStatus: row.marital_status,
      createdAt: row.created_at,
      languages: (row.profile_languages || [])
        .map((join) => join.languages)
        .filter((language): language is LanguageRow => Boolean(language)),
      profileImage: avatar && urlByPath[avatar.object_path]
        ? { uri: urlByPath[avatar.object_path] }
        : undefined,
      extraimages: gallery
        .filter((item) => urlByPath[item.object_path])
        .map((item) => ({ uri: urlByPath[item.object_path] })),
    } as UserProfileType;
  });
}

export async function fetchVisibleProfiles(options?: {
  excludeUserId?: string;
}): Promise<UserProfileType[]> {
  let query = supabase.from('profiles').select(PROFILE_SELECT);
  if (options?.excludeUserId) {
    query = query.neq('user_id', options.excludeUserId);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  // The embedded select string is dynamic, so the response shape is asserted.
  return mapProfileRowsToUsers((data || []) as unknown as ProfileJoinRow[]);
}

export async function fetchOwnProfile(userId: string): Promise<UserProfileType | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const [mapped] = await mapProfileRowsToUsers([data as unknown as ProfileJoinRow]);
  return mapped ?? null;
}

/**
 * Server-side filtering for the discovery filter modal. Uses the indexed
 * discoverable columns (gender, age_years, religion) instead of the old
 * fetch-everything-then-filter-client approach.
 */
export async function fetchFilteredProfiles(
  ageRange: number[] | null,
  religion: string,
  gender: string,
): Promise<UserProfileType[]> {
  let query = supabase.from('profiles').select(PROFILE_SELECT);
  if (gender) {
    query = query.eq('gender', gender);
  }
  if (religion) {
    query = query.eq('religion', religion);
  }
  if (ageRange && ageRange.length === 2) {
    query = query.gte('age_years', ageRange[0]).lte('age_years', ageRange[1]);
  }
  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return mapProfileRowsToUsers((data || []) as unknown as ProfileJoinRow[]);
}

async function insertOrUpdateProfile(
  userId: string,
  draft: ProfileDraft,
): Promise<void> {
  const row = { ...toProfileInsertRow(draft), user_id: userId };

  const existing = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    const { error } = await supabase.from('profiles').update(row).eq('user_id', userId);
    if (error) {
      throw error;
    }
    return;
  }

  const inserted = await supabase.from('profiles').insert(row);
  if (inserted.error && inserted.error.code === UNIQUE_VIOLATION_CODE) {
    // Lost a race with a concurrent create; fall back to an update.
    const { error } = await supabase.from('profiles').update(row).eq('user_id', userId);
    if (error) {
      throw error;
    }
    return;
  }
  if (inserted.error) {
    throw inserted.error;
  }
}

async function savePrivateDateOfBirth(
  userId: string,
  dateOfBirth: string | undefined,
): Promise<void> {
  if (!dateOfBirth) {
    return;
  }
  const inserted = await supabase
    .from('profile_private')
    .insert({ user_id: userId, date_of_birth: dateOfBirth });
  if (inserted.error && inserted.error.code === UNIQUE_VIOLATION_CODE) {
    const { error } = await supabase
      .from('profile_private')
      .update({ date_of_birth: dateOfBirth })
      .eq('user_id', userId);
    if (error) {
      throw error;
    }
    return;
  }
  if (inserted.error) {
    throw inserted.error;
  }
}

async function saveProfileLanguages(userId: string, languageIds: number[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('profile_languages')
    .delete()
    .eq('user_id', userId);
  if (deleteError) {
    throw deleteError;
  }
  if (languageIds.length === 0) {
    return;
  }
  const { error: insertError } = await supabase
    .from('profile_languages')
    .insert(languageIds.map((languageId) => ({ user_id: userId, language_id: languageId })));
  if (insertError) {
    throw insertError;
  }
}

async function replaceProfileMedia(
  userId: string,
  profileImage: PickedImage | null,
  extraImages: PickedImage[],
): Promise<void> {
  const wantsNewMedia = Boolean(profileImage) || extraImages.length > 0;

  const { data: existingRows, error: fetchError } = await supabase
    .from('profile_media')
    .select('id, user_id, object_path, kind, position, mime_type, file_name')
    .eq('user_id', userId);
  if (fetchError) {
    throw fetchError;
  }

  // Replace-mode upload: old rows/objects are removed first so re-saving a
  // profile (retry or edit) does not collide with the unique object paths.
  await deleteProfileMedia((existingRows || []) as ProfileMediaRow[]);
  if (!wantsNewMedia) {
    return;
  }

  const uploads: Array<{ row: ProfileMediaRow; image: PickedImage }> = [];
  if (profileImage) {
    uploads.push({
      row: buildMediaRow(userId, profileImage, 'avatar', AVATAR_POSITION),
      image: profileImage,
    });
  }
  extraImages
    .slice(0, MAX_GALLERY_POSITION - MIN_GALLERY_POSITION + 1)
    .forEach((image, index) => {
      uploads.push({
        row: buildMediaRow(userId, image, 'gallery', galleryPositionForIndex(index)),
        image,
      });
    });

  for (const upload of uploads) {
    await uploadProfileMedia(upload.row, upload.image);
  }
}

/**
 * Creates or updates the signed-in user's profile across `profiles`,
 * `profile_private`, `profile_languages`, and `profile_media` plus the private
 * storage bucket. Idempotent: re-running the same save updates in place.
 */
export async function saveProfile(userId: string, draft: ProfileDraft): Promise<void> {
  if (!userId) {
    throw new Error('A signed-in user is required to save a profile.');
  }

  await insertOrUpdateProfile(userId, draft);
  await savePrivateDateOfBirth(userId, draft.dateOfBirth);
  await saveProfileLanguages(userId, draft.languageIds);
  await replaceProfileMedia(userId, draft.profileImage, draft.extraImages);
}
