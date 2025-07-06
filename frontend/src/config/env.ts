const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const isElectron = /electron/i.test(navigator.userAgent);

// Basic validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase URL and Anon Key are required. Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

const env = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  API_URL,
  isElectron,
};

export {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  API_URL,
  isElectron,
  env as default
};