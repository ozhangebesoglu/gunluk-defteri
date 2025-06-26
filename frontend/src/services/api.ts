// API Service Layer - Dual Mode (Electron + Web)

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

export interface UpdateEntryDto extends Partial<CreateEntryDto> {}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class ApiService {
  private baseURL: string
  private isElectron: boolean

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI
    
    // Environment-based URL selection
    if (this.isElectron) {
      // Electron mode - use backend server
      this.baseURL = 'http://localhost:3001/api/v1'
    } else {
      // Web mode - check environment
      // Production check using hostname instead of import.meta.env.PROD
      const isProduction = window.location.hostname !== 'localhost' && 
                          window.location.hostname !== '127.0.0.1' &&
                          !window.location.hostname.includes('localhost')
      
      if (isProduction) {
        // Production - use Vercel functions
        this.baseURL = '/api'
      } else {
        // Development - use local backend
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
      }
    }
    
    console.log('🔧 API Service initialized:', { 
      mode: this.isElectron ? 'Electron' : 'Web',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
      environment: this.isElectron ? 'Electron' : (
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' &&
        !window.location.hostname.includes('localhost') ? 'Production' : 'Development'
      ),
      baseURL: this.baseURL 
    })

    // Online/offline detection for web mode
    if (!this.isElectron) {
      window.addEventListener('online', () => {
        console.log('📶 İnternet bağlantısı geri geldi')
        this.syncOfflineData()
      })
      
      window.addEventListener('offline', () => {
        console.log('📵 İnternet bağlantısı kesildi, offline moda geçiliyor')
      })
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      if (this.isElectron) {
        return await (window as any).electronAPI.diary.healthCheck()
      } else {
        const response = await fetch(`${this.baseURL}/health`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      }
    } catch (error) {
      console.error('❌ Health check failed:', error)
      throw new Error('API health check failed')
    }
  }

  // Diary Entries
  async getEntries(filters: any = {}): Promise<DiaryEntry[]> {
    try {
      if (this.isElectron) {
        const entries = await (window as any).electronAPI.diary.getEntries(filters)
        return Array.isArray(entries) ? entries : []
      } else {
        // Web mode - REST API
        const queryParams = new URLSearchParams(filters).toString()
        const response = await fetch(`${this.baseURL}/entries?${queryParams}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        const entries = data.entries || data
        return Array.isArray(entries) ? entries : []
      }
    } catch (error: any) {
      console.error('❌ Failed to get entries:', error)
      
      // Fallback to localStorage in web mode
      if (!this.isElectron) {
        const cached = localStorage.getItem('diary_entries')
        if (cached) {
          console.log('📦 Loading from localStorage fallback')
          return JSON.parse(cached)
        }
      }
      
      return [] // Always return empty array on error
    }
  }

  async getEntry(id: string): Promise<DiaryEntry> {
    try {
      if (this.isElectron) {
        return await (window as any).electronAPI.diary.getEntry(id)
      } else {
        const response = await fetch(`${this.baseURL}/entries/${id}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        return data.entry || data
      }
    } catch (error: any) {
      console.error('❌ Failed to get entry:', error)
      
      // Fallback to localStorage
      if (!this.isElectron) {
        const cached = localStorage.getItem('diary_entries')
        if (cached) {
          const entries: DiaryEntry[] = JSON.parse(cached)
          const entry = entries.find(e => e.id === id)
          if (entry) return entry
        }
      }
      
      throw error
    }
  }

  async createEntry(entry: CreateEntryDto): Promise<DiaryEntry> {
    try {
      if (this.isElectron) {
        return await (window as any).electronAPI.diary.createEntry(entry)
      } else {
        const response = await fetch(`${this.baseURL}/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry)
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
        
        const newEntry = await response.json()
        
        // Cache in localStorage as backup
        this.cacheEntryLocally(newEntry, 'create')
        
        return newEntry
      }
    } catch (error: any) {
      console.error('❌ Failed to create entry:', error)
      
      // Offline mode - save to localStorage with sync flag
      if (!this.isElectron) {
        const offlineEntry: DiaryEntry = {
          id: Date.now().toString(),
          ...entry,
          entry_date: typeof entry.entry_date === 'string' ? entry.entry_date : entry.entry_date.toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          _pendingSync: true // Flag for later sync
        }
        
        this.cacheEntryLocally(offlineEntry, 'create')
        return offlineEntry
      }
      
      throw error
    }
  }

  async updateEntry(id: string, entry: UpdateEntryDto): Promise<DiaryEntry> {
    try {
      if (this.isElectron) {
        return await (window as any).electronAPI.diary.updateEntry(id, entry)
      } else {
        const response = await fetch(`${this.baseURL}/entries/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        const updatedEntry = data.entry || data
        
        // Cache to localStorage
        this.cacheEntryLocally(updatedEntry, 'update')
        
        return updatedEntry
      }
    } catch (error: any) {
      console.error('❌ Failed to update entry:', error)
      
      // Offline mode - update localStorage with sync flag
      if (!this.isElectron) {
        const stored = JSON.parse(localStorage.getItem('diary_entries_offline') || '[]')
        const index = stored.findIndex((e: DiaryEntry) => e.id === id)
        
        if (index !== -1) {
          stored[index] = {
            ...stored[index],
            ...entry,
            updated_at: new Date().toISOString(),
            _pendingSync: true
          }
          
          localStorage.setItem('diary_entries_offline', JSON.stringify(stored))
          return stored[index]
        }
      }
      
      throw error
    }
  }

  async deleteEntry(id: string): Promise<boolean> {
    try {
      if (this.isElectron) {
        await (window as any).electronAPI.diary.deleteEntry(id)
        return true
      } else {
        const response = await fetch(`${this.baseURL}/entries/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        // Remove from localStorage cache
        this.removeEntryFromCache(id)
        
        return true
      }
    } catch (error: any) {
      console.error('❌ Failed to delete entry:', error)
      
      // Offline mode - mark as deleted
      if (!this.isElectron) {
        const stored = JSON.parse(localStorage.getItem('diary_entries_offline') || '[]')
        const filtered = stored.filter((e: DiaryEntry) => e.id !== id)
        localStorage.setItem('diary_entries_offline', JSON.stringify(filtered))
        return true
      }
      
      throw error
    }
  }

  async deleteAllEntries(): Promise<boolean> {
    try {
      if (this.isElectron) {
        await (window as any).electronAPI.diary.deleteAllEntries()
        return true
      } else {
        const response = await fetch(`${this.baseURL}/entries`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        // Clear localStorage cache
        localStorage.removeItem('diary_entries_offline')
        
        return true
      }
    } catch (error: any) {
      console.error('❌ Failed to delete all entries:', error)
      
      // Offline mode - clear localStorage
      if (!this.isElectron) {
        localStorage.removeItem('diary_entries_offline')
        return true
      }
      
      throw error
    }
  }

  // Tags
  async getTags(): Promise<DiaryTag[]> {
    try {
      if (this.isElectron) {
        return await (window as any).electronAPI.diary.getTags()
      } else {
        const response = await fetch(`${this.baseURL}/tags`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        return data.tags || data
      }
    } catch (error: any) {
      console.error('❌ Failed to get tags:', error)
      
      // Fallback to localStorage
      if (!this.isElectron) {
        return JSON.parse(localStorage.getItem('diary_tags_offline') || '[]')
      }
      
      throw error
    }
  }

  async createTag(tag: any): Promise<DiaryTag> {
    try {
      if (this.isElectron) {
        return await (window as any).electronAPI.diary.createTag(tag)
      } else {
        const response = await fetch(`${this.baseURL}/tags`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tag)
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        return data.tag || data
      }
    } catch (error: any) {
      console.error('❌ Failed to create tag:', error)
      throw error
    }
  }

  // Offline Support Methods
  private cacheEntryLocally(entry: DiaryEntry, action: 'create' | 'update') {
    if (this.isElectron) return // No need to cache in Electron mode
    
    try {
      const stored = JSON.parse(localStorage.getItem('diary_entries_offline') || '[]')
      
      if (action === 'create') {
        stored.unshift(entry)
      } else {
        const index = stored.findIndex((e: DiaryEntry) => e.id === entry.id)
        if (index !== -1) {
          stored[index] = entry
        } else {
          stored.unshift(entry)
        }
      }
      
      localStorage.setItem('diary_entries_offline', JSON.stringify(stored))
      console.log(`💾 Entry cached locally (${action}):`, entry.id)
    } catch (error) {
      console.error('❌ Failed to cache entry:', error)
    }
  }

  private removeEntryFromCache(id: string) {
    if (this.isElectron) return
    
    try {
      const stored = JSON.parse(localStorage.getItem('diary_entries_offline') || '[]')
      const filtered = stored.filter((e: DiaryEntry) => e.id !== id)
      localStorage.setItem('diary_entries_offline', JSON.stringify(filtered))
      console.log('🗑️ Entry removed from cache:', id)
    } catch (error) {
      console.error('❌ Failed to remove entry from cache:', error)
    }
  }

  // Sync Methods (for when going back online)
  async syncOfflineData(): Promise<void> {
    if (this.isElectron) return // No sync needed in Electron mode
    
    try {
      const stored = JSON.parse(localStorage.getItem('diary_entries_offline') || '[]')
      const pendingEntries = stored.filter((e: DiaryEntry) => e._pendingSync)
      
      console.log(`🔄 Syncing ${pendingEntries.length} offline entries...`)
      
      for (const entry of pendingEntries) {
        try {
          if (entry._pendingSync) {
            // Try to sync to server
            await this.createEntry(entry)
            
            // Remove sync flag
            delete entry._pendingSync
            this.cacheEntryLocally(entry, 'update')
          }
        } catch (error) {
          console.error('❌ Failed to sync entry:', entry.id, error)
        }
      }
      
      console.log('✅ Offline data sync completed')
    } catch (error) {
      console.error('❌ Failed to sync offline data:', error)
    }
  }

  // Connection status
  isOnline(): boolean {
    return navigator.onLine
  }

  get mode(): 'electron' | 'web' {
    return this.isElectron ? 'electron' : 'web'
  }
}

// Singleton instance
export const apiService = new ApiService() 