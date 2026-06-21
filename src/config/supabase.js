import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://owjqcqfsfsnlmdylmufy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93anFjcWZzZnNubG1keWxtdWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzE2MjgsImV4cCI6MjA5NDQwNzYyOH0.P6wVAcX7lPerzEhH1i4soYtFZ7Bna5RzF12m8El1WeU';

const webStorage = typeof localStorage !== 'undefined' ? {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
} : undefined;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(webStorage ? { storage: webStorage } : {}),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  }
});
