const { createClient } = require('@supabase/supabase-js')
const envConfig = require('./config/env')

// Supabase configuration from environment
const { url: supabaseUrl, serviceKey: supabaseServiceKey } = envConfig.getSupabaseConfig()

// Create Supabase client with service role (backend needs full access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  realtime: {
    enabled: true
  }
})

console.log('[BACKEND] Supabase client initialized:', supabaseUrl.substring(0, 30) + '...')

module.exports = { supabase, supabaseUrl, supabaseServiceKey } 