// ==========================================
// GÜNCE DEFTERI - Database Types (Context7 Uyumlu)
// Supabase generated types + custom extensions
// ==========================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      diary_entries: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          entry_date: string
          day_of_week: string | null
          tags: string[] | null
          sentiment: string | null
          sentiment_score: number | null
          weather: string | null
          location: string | null
          is_favorite: boolean
          is_encrypted: boolean | null
          word_count: number
          read_time: number | null
          sync_status: string
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          entry_date: string
          day_of_week?: string | null
          tags?: string[] | null
          sentiment?: string | null
          sentiment_score?: number | null
          weather?: string | null
          location?: string | null
          is_favorite?: boolean
          is_encrypted?: boolean | null
          word_count?: number
          read_time?: number | null
          sync_status?: string
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          entry_date?: string
          day_of_week?: string | null
          tags?: string[] | null
          sentiment?: string | null
          sentiment_score?: number | null
          weather?: string | null
          location?: string | null
          is_favorite?: boolean
          is_encrypted?: boolean | null
          word_count?: number
          read_time?: number | null
          sync_status?: string
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      diary_tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          description: string | null
          usage_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          description?: string | null
          usage_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          description?: string | null
          usage_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      sentiment_type: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
      sync_status_type: 'pending' | 'synced' | 'conflict' | 'error'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ==========================================
// CUSTOM TYPES (Business Logic)
// ==========================================

export type Profile = Database['public']['Tables']['profiles']['Row']
export type DiaryEntry = Database['public']['Tables']['diary_entries']['Row']
export type DiaryTag = Database['public']['Tables']['diary_tags']['Row']

export type CreateDiaryEntry = Database['public']['Tables']['diary_entries']['Insert']
export type UpdateDiaryEntry = Database['public']['Tables']['diary_entries']['Update']

export type CreateProfile = Database['public']['Tables']['profiles']['Insert']
export type UpdateProfile = Database['public']['Tables']['profiles']['Update']

// ==========================================
// FRONTEND SPECIFIC TYPES
// ==========================================

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export interface DiaryEntryWithProfile extends DiaryEntry {
  profile: Profile
}

export interface SyncStatus {
  status: 'synced' | 'syncing' | 'offline' | 'conflict' | 'error'
  lastSync?: Date | null
  pendingChanges?: number
}

export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: DiaryEntry | null
  old: DiaryEntry | null
  errors: any[] | null
}

// ==========================================
// API RESPONSE TYPES
// ==========================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// ==========================================
// FORM TYPES
// ==========================================

export interface DiaryEntryFormData {
  title: string
  content: string
  entry_date: string
  tags?: string[]
  weather?: string
  location?: string
  is_favorite?: boolean
}

export interface AuthFormData {
  email: string
  password: string
  full_name?: string
}

// ==========================================
// SEARCH & FILTER TYPES
// ==========================================

export interface SearchFilters {
  query?: string
  tags?: string[]
  sentiment?: string
  dateFrom?: string
  dateTo?: string
  isFavorite?: boolean
}

export interface SortOptions {
  field: 'created_at' | 'updated_at' | 'entry_date' | 'title'
  direction: 'asc' | 'desc'
}

// ==========================================
// REALTIME CHANNEL TYPES
// ==========================================

export interface ChannelOptions {
  private?: boolean
  userId?: string
}

export interface BroadcastPayload {
  event: string
  payload: any
  userId?: string
} 