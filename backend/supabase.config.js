const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nbjnmhtgluctoeyrbgkd.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iam5taHRnbHVjdG9leXJiZ2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDc3MzEsImV4cCI6MjA2NjUyMzczMX0.84GFmIzKFUL6c2I370yyPNVwi9d6IRtXkZAt2ZNAr4Q'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  realtime: {
    enabled: true
  }
})

console.log('🔗 Supabase client initialized:', supabaseUrl)

module.exports = { supabase, supabaseUrl, supabaseAnonKey } 