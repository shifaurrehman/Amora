import { supabase } from '../../lib/supabase';
import { UserProfileType } from '../../navigation/TypescriptTypes/UserType';
import {
  ProfileJoinRow,
  PROFILE_SELECT,
  mapProfileRowsToUsers,
} from './profiles';

const UNIQUE_VIOLATION_CODE = '23505';

export interface FavoriteRow {
  user_id: string;
  favorite_user_id: string;
  created_at: string;
}

/**
 * Loads the favorite list for the signed-in user, joined with the favorite
 * profiles and their media. RLS only returns favorites owned by the caller and
 * only profiles the caller may see (discoverable ones).
 */
export async function fetchFavoriteProfiles(userId: string): Promise<UserProfileType[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`favorite_user_id, profiles!favorites_favorite_user_id_fkey(${PROFILE_SELECT})`)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const profileRows = ((data || []) as unknown as Array<{ favorite_user_id: string } & {
    profiles: ProfileJoinRow | ProfileJoinRow[] | null;
  }>)
    .map((row) => {
      // favorites -> profiles is a single-profile join on favorite_user_id.
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return profile ?? null;
    })
    .filter((profile): profile is ProfileJoinRow => Boolean(profile));

  return mapProfileRowsToUsers(profileRows);
}

/** Adds a favorite. Inserting an already-favorited user is treated as success. */
export async function addFavorite(userId: string, favoriteUserId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, favorite_user_id: favoriteUserId });

  if (error && error.code !== UNIQUE_VIOLATION_CODE) {
    throw error;
  }
}

export async function removeFavorite(userId: string, favoriteUserId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('favorite_user_id', favoriteUserId);
  if (error) {
    throw error;
  }
}
