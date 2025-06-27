import { createClient } from '@supabase/supabase-js'
import { envConfig } from '../config/env'
import { logger } from '../utils/logger'

// Supabase configuration from environment
const { url: supabaseUrl, anonKey: supabaseAnonKey } = envConfig.supabase

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

logger.success('Frontend Supabase client initialized', { url: supabaseUrl.substring(0, 30) + '...' }) 