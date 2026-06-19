import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://owjqcqfsfsnlmdylmufy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H3M5xqKGR4giDhamC4LqVw_rYC5F1i2';

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
