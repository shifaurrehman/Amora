import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_ANON_KEY in the root .env file.');
}

if (new URL(SUPABASE_URL).protocol !== 'https:') {
  throw new Error('SUPABASE_URL must use HTTPS.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
