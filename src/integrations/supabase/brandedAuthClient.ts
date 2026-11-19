import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

// Google sign-in goes through the branded auth domain so Google's account
// picker shows "auth.talkeasi.com" instead of the raw Supabase project URL.
// Same project and same session storage key as the main client, so the
// session returned after sign-in is picked up by the main client.
const BRANDED_AUTH_URL = 'https://auth.talkeasi.com';
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeGpqaGdmZ3lmaHdhY3hwcGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MjQ0NzMsImV4cCI6MjA3MzAwMDQ3M30.IJCtrmPDMyrLbzoL7iiF4koupkhHycBCKFZ6JGi11HA";

export const brandedAuthClient = createClient<Database>(BRANDED_AUTH_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: brokeredPreviewStorage(),
    storageKey: 'sb-qcxjjhgfgyfhwacxppcp-auth-token',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
