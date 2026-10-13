import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let hasLoggedInitNotice = false;

export const getCleanSupabaseUrl = (rawUrl?: string): string | null => {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  // Strip accidental /rest/v1 or /rest/v1/ suffix often copied from Supabase API docs
  url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) return null;
    return url;
  } catch {
    return null;
  }
};

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!rawUrl || !supabaseAnonKey) {
    return null;
  }

  const supabaseUrl = getCleanSupabaseUrl(rawUrl);
  if (!supabaseUrl) {
    if (!hasLoggedInitNotice) {
      console.warn('Configuração de URL do Supabase inválida. O aplicativo funcionará em modo local.');
      hasLoggedInitNotice = true;
    }
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return supabaseInstance;
  } catch (error) {
    if (!hasLoggedInitNotice) {
      console.warn('Supabase não pôde ser inicializado. Usando armazenamento local:', error);
      hasLoggedInitNotice = true;
    }
    return null;
  }
};
