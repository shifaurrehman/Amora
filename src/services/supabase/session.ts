import { getItem } from '../../utils/MMKV_STORAGE/mmkvStorage';
import { supabase } from '../../lib/supabase';

/**
 * Returns the signed-in user id. Prefers the MMKV value written at
 * login/splash time and falls back to the live Supabase session.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cachedId = getItem('USERUID');
  if (cachedId) {
    return cachedId;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data?.user?.id ?? null;
}
