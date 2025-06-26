// Direct Supabase Client API Service - No middleware needed!
import { createClient } from '@supabase/supabase-js'

// API-specific types
export interface DiaryEntry {
  id: string
  title: string
  content: string
  entry_date: string
  tags?: string[]
  sentiment?: string
  weather?: string
  location?: string
  is_favorite?: boolean
  word_count?: number
  created_at?: string
  updated_at?: string
  _pendingSync?: boolean // For offline support
}

export interface DiaryTag {
  id: string
  name: string
  color: string
  description?: string
  usage_count?: number
  created_at?: string
}

export interface CreateEntryDto {
  title: string
  content: string
  entry_date: Date | string
  tags?: string[]
  sentiment?: string
  weather?: string
  location?: string
  is_favorite?: boolean
}

export interface UpdateEntryDto {
  title?: string
  content?: string
  entry_date?: Date | string
  tags?: string[]
  sentiment?: string
  weather?: string
  location?: string
  is_favorite?: boolean
}

// Supabase configuration
const supabaseUrl = 'https://nbjnmhtgluctoeyrbgkd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iam5taHRnbHVjdG9leXJiZ2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDc3MzEsImV4cCI6MjA2NjUyMzczMX0.84GFmIzKFUL6c2I370yyPNVwi9d6IRtXkZAt2ZNAr4Q'

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔧 Supabase Client initialized directly!')

export class ApiService {
  private _mode: string
  private _environment: string

  constructor() {
    this._mode = 'Direct Supabase'
    this._environment = 'Production'
    console.log('🚀 Direct Supabase API Service initialized:', {
      mode: this._mode,
      environment: this._environment,
      url: supabaseUrl
    })
  }

  // Public getters for backward compatibility
  get mode(): string {
    return this._mode
  }

  get environment(): string {
    return this._environment
  }

  // Health check
  async healthCheck() {
    try {
      const { error } = await supabase
        .from('diary_entries')
        .select('count')
        .limit(1)
      
      if (error) throw error
      
      return { 
        status: 'OK', 
        message: 'Supabase bağlantısı başarılı',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Supabase health check failed:', error)
      throw error
    }
  }

  // Get all entries
  async getEntries(): Promise<DiaryEntry[]> {
    try {
      console.log('📚 Supabase\'den entries çekiliyor...')
      
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .order('entry_date', { ascending: false })
      
      if (error) {
        console.error('❌ Supabase entries error:', error)
        throw error
      }

      console.log(`✅ ${data?.length || 0} entry başarıyla çekildi`)
      return data || []
    } catch (error) {
      console.error('❌ Failed to get entries:', error)
      throw error
    }
  }

  // Get entry by ID (backward compatibility)
  async getEntry(id: string): Promise<DiaryEntry | null> {
    return this.getEntryById(id)
  }

  // Get entry by ID
  async getEntryById(id: string): Promise<DiaryEntry | null> {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      return data
    } catch (error) {
      console.error(`❌ Failed to get entry ${id}:`, error)
      throw error
    }
  }

  // Create new entry
  async createEntry(entry: CreateEntryDto): Promise<DiaryEntry> {
    try {
      console.log('✍️ Yeni entry oluşturuluyor...')
      
      const newEntry = {
        ...entry,
        entry_date: typeof entry.entry_date === 'string' 
          ? entry.entry_date 
          : entry.entry_date.toISOString().split('T')[0],
        word_count: entry.content.split(/\s+/).length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('diary_entries')
        .insert([newEntry])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Supabase create error:', error)
        throw error
      }

      console.log('✅ Entry başarıyla oluşturuldu:', data.id)
      return data
    } catch (error) {
      console.error('❌ Failed to create entry:', error)
      throw error
    }
  }

  // Update entry
  async updateEntry(id: string, updates: UpdateEntryDto): Promise<DiaryEntry> {
    try {
      const updateData: Record<string, string | number | boolean | string[] | undefined> = {
        ...updates,
        entry_date: updates.entry_date 
          ? (typeof updates.entry_date === 'string' 
              ? updates.entry_date 
              : updates.entry_date.toISOString().split('T')[0])
          : undefined,
        word_count: updates.content 
          ? updates.content.split(/\s+/).length 
          : undefined,
        updated_at: new Date().toISOString()
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      )

      const { data, error } = await supabase
        .from('diary_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error(`❌ Failed to update entry ${id}:`, error)
      throw error
    }
  }

  // Delete entry
  async deleteEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      console.log(`🗑️ Entry ${id} silindi`)
    } catch (error) {
      console.error(`❌ Failed to delete entry ${id}:`, error)
      throw error
    }
  }

  // Delete all entries (for Settings page) - FIXED UUID ISSUE
  async deleteAllEntries(): Promise<void> {
    try {
      console.log('🗑️ Tüm entries siliniyor...')
      
      // Alternative approach: Use NOT operator instead of problematic UUID handling
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .gte('created_at', '1900-01-01') // Match all records created after 1900
      
      if (error) {
        console.error('❌ Delete error:', error)
        throw error
      }
      
      console.log('🗑️ Tüm entries başarıyla silindi')
    } catch (error) {
      console.error('❌ Failed to delete all entries:', error)
      throw error
    }
  }

  // Toggle favorite
  async toggleFavorite(id: string): Promise<DiaryEntry> {
    try {
      // First get current entry
      const { data: currentEntry, error: fetchError } = await supabase
        .from('diary_entries')
        .select('is_favorite')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError

      // Toggle favorite status
      const { data, error } = await supabase
        .from('diary_entries')
        .update({ 
          is_favorite: !currentEntry.is_favorite,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      console.log(`💖 Entry ${id} favorite durumu: ${data.is_favorite}`)
      return data
    } catch (error) {
      console.error(`❌ Failed to toggle favorite ${id}:`, error)
      throw error
    }
  }

  // Get tags
  async getTags(): Promise<DiaryTag[]> {
    try {
      const { data, error } = await supabase
        .from('diary_tags')
        .select('*')
        .order('name')
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Failed to get tags:', error)
      return [] // Return empty array as fallback
    }
  }

  // Create tag
  async createTag(tag: Omit<DiaryTag, 'id' | 'created_at'>): Promise<DiaryTag> {
    try {
      const { data, error } = await supabase
        .from('diary_tags')
        .insert([{
          ...tag,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Failed to create tag:', error)
      throw error
    }
  }

  // Search entries
  async searchEntries(query: string): Promise<DiaryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('entry_date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Failed to search entries:', error)
      return []
    }
  }

  // Get entries by tag
  async getEntriesByTag(tag: string): Promise<DiaryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .contains('tags', [tag])
        .order('entry_date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Failed to get entries by tag:', error)
      return []
    }
  }

  // Get entries by date range
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<DiaryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Failed to get entries by date range:', error)
      return []
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export default for backward compatibility
export default apiService 