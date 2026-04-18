import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Supabase client used exclusively for Realtime channel subscriptions.
// Auth and session persistence are disabled — we use Supabase only as a
// real-time event bus, not for auth or storage.
// Returns null when env vars are not configured (triggers polling fallback).
export const supabase: SupabaseClient | null = (() => {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    // If the client fails to initialise (e.g. missing URL polyfill in some RN
    // environments), the hook will fall back to polling automatically.
    return null;
  }
})();
