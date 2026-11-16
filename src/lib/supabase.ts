import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  typeof envUrl === 'string' && envUrl.trim().length > 0
    ? envUrl.trim()
    : 'https://placeholder.supabase.co';

const supabaseAnonKey =
  typeof envKey === 'string' && envKey.trim().length > 0
    ? envKey.trim()
    : 'placeholder-anon-key';

export const isSupabaseConfigured =
  typeof envUrl === 'string' &&
  envUrl.trim().length > 0 &&
  typeof envKey === 'string' &&
  envKey.trim().length > 0;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
