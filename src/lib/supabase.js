import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (SUPABASE_URL === 'https://placeholder.supabase.co') {
  console.warn('[Supabase] Variables manquantes. Copier .env.example → .env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
