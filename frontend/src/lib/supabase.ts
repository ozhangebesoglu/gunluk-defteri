import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nbjnmhtgluctoeyrbgkd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iam5taHRnbHVjdG9leXJiZ2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDc3MzEsImV4cCI6MjA2NjUyMzczMX0.84GFmIzKFUL6c2I370yyPNVwi9d6IRtXkZAt2ZNAr4Q'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      diary_entries: {
        Row: {
          id: string
          title: string
          content: string
          entry_date: string
          day_of_week?: string
          tags?: string[]
          sentiment?: string
          sentiment_score?: number
          weather?: string
          location?: string
          is_favorite: boolean
          is_encrypted?: boolean
          word_count: number
          read_time?: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          entry_date: string
          day_of_week?: string
          tags?: string[]
          sentiment?: string
          sentiment_score?: number
          weather?: string
          location?: string
          is_favorite?: boolean
          is_encrypted?: boolean
          word_count?: number
          read_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          entry_date?: string
          day_of_week?: string
          tags?: string[]
          sentiment?: string
          sentiment_score?: number
          weather?: string
          location?: string
          is_favorite?: boolean
          is_encrypted?: boolean
          word_count?: number
          read_time?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

console.log('🔗 Frontend Supabase client initialized:', supabaseUrl) 