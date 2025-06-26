// Diary Types
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

// Create/Update DTOs are now in api.ts to avoid circular imports

export interface DiaryTag {
  id: string
  name: string
  color: string
  description?: string
  usage_count?: number
  created_at?: string
}

export interface FilterState {
  searchTerm: string
  selectedTags: string[]
  sortBy: 'date' | 'title'
  sortOrder: 'asc' | 'desc'
  showFavoritesOnly: boolean
  selectedSentiment: string
}

export interface DashboardStats {
  totalEntries: number
  thisMonthEntries: number
  favoriteEntries: number
  averageWordsPerEntry: number
  currentStreak: number
} 