import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Guard: only create a real client when both env vars are present and valid
const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id');

if (!isConfigured) {
  console.warn(
    '[Supabase] Credentials not found or invalid. App will run in offline/localStorage mode.\n' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file (locally) ' +
    'or in Vercel → Project Settings → Environment Variables (for production).'
  );
}

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,    // POS app — no user auth sessions needed
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'amit-mega-mart-pos/1.5',
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseReady = isConfigured;
