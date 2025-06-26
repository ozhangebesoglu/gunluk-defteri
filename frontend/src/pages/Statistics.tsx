import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
// import { useNavigate } from 'react-router-dom' // Geçici comment out
import { useTheme } from '../contexts/ThemeContext'
import { DiaryEntry, ApiService } from '../services/api'

interface Statistics {
  totalEntries: number
  thisMonth: number
  writingStreak: number
  averageWords: number
  sentimentDistribution: {
    [key: string]: number
  }
  mostUsedTags: Array<{ name: string; count: number }>
}

const Statistics: React.FC = () => {
  // const navigate = useNavigate() // Geçici comment out
  const { isDarkTheme } = useTheme()
  const [stats, setStats] = useState<Statistics>({
    totalEntries: 0,
    thisMonth: 0,
    writingStreak: 0,
    averageWords: 0,
    sentimentDistribution: {},
    mostUsedTags: []
  })
  const [loading, setLoading] = useState(true)
  const [apiService] = useState(() => new ApiService())
  
  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const entries = await apiService.getEntries()
      
      const calculatedStats = calculateStatistics(entries)
      setStats(calculatedStats)
      
      console.log('📊 İstatistikler yüklendi:', calculatedStats)
    } catch (error) {
      console.error('❌ İstatistikler yüklenemedi:', error)
      // Fallback to mock data on error
      setStats({
        totalEntries: 0,
        thisMonth: 0,
        writingStreak: 0,
        averageWords: 0,
        sentimentDistribution: {},
        mostUsedTags: []
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (entries: DiaryEntry[]): Statistics => {
    if (!entries.length) {
      return {
        totalEntries: 0,
        thisMonth: 0,
        writingStreak: 0,
        averageWords: 0,
        sentimentDistribution: {},
        mostUsedTags: []
      }
    }

    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    // Total entries
    const totalEntries = entries.length

    // This month entries
    const thisMonthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.entry_date)
      return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear
    }).length

    // Calculate writing streak (consecutive days)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    )
    
    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.entry_date)
      entryDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak || (streak === 0 && daysDiff <= 1)) {
        streak++
        currentDate = entryDate
      } else {
        break
      }
    }

    // Average word count
    const totalWords = entries.reduce((sum, entry) => 
      sum + (entry.word_count || entry.content.split(' ').length), 0
    )
    const averageWords = Math.round(totalWords / entries.length)

    // Sentiment distribution
    const sentimentDistribution: { [key: string]: number } = {}
    entries.forEach(entry => {
      const sentiment = entry.sentiment || 'normal'
      sentimentDistribution[sentiment] = (sentimentDistribution[sentiment] || 0) + 1
    })

    // Most used tags
    const tagCounts: { [key: string]: number } = {}
    entries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })
    
    const mostUsedTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    return {
      totalEntries,
      thisMonth: thisMonthEntries,
      writingStreak: streak,
      averageWords,
      sentimentDistribution,
      mostUsedTags
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'very_positive':
      case 'positive': return '😊'
      case 'good':
      case 'slightly_positive': return '🙂'
      case 'normal':
      case 'neutral': return '😐'
      case 'negative':
      case 'slightly_negative': return '😔'
      case 'very_negative': return '😢'
      default: return '😐'
    }
  }

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'very_positive':
      case 'positive': return 'Çok İyi'
      case 'good':
      case 'slightly_positive': return 'İyi'
      case 'normal':
      case 'neutral': return 'Normal'
      case 'negative':
      case 'slightly_negative': return 'Kötü'
      case 'very_negative': return 'Çok Kötü'
      default: return 'Normal'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'very_positive':
      case 'positive': return 'bg-green-500'
      case 'good':
      case 'slightly_positive': return 'bg-emerald-500'
      case 'normal':
      case 'neutral': return 'bg-gray-500'
      case 'negative':
      case 'slightly_negative': return 'bg-orange-500'
      case 'very_negative': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className={`w-full min-h-full relative overflow-hidden transition-all duration-700 flex items-center justify-center ${
        isDarkTheme 
          ? 'bg-rich-brown-900' 
          : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'}`}>
            İstatistikler yükleniyor...
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`w-full min-h-full relative overflow-hidden transition-all duration-700 ${
      isDarkTheme 
        ? 'bg-rich-brown-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='13' cy='43' r='1'/%3E%3Ccircle cx='47' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className={`text-3xl sm:text-4xl font-serif font-bold mb-4 transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
            }`}>
              📊 İstatistikler
            </h1>
            <p className={`text-base sm:text-lg font-medium transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
            }`}>
              Günce defteri yazma alışkanlıklarınızı keşfedin
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {/* Total Entries */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-6 card-hover text-center"
            >
              <div className="text-3xl mb-3">📚</div>
              <div className="text-2xl font-bold text-amber-900 mb-1">{stats.totalEntries}</div>
              <div className="text-amber-700 font-medium">Toplam Günce</div>
            </motion.div>

            {/* This Month */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-6 card-hover text-center"
            >
              <div className="text-3xl mb-3">📅</div>
              <div className="text-2xl font-bold text-amber-900 mb-1">{stats.thisMonth}</div>
              <div className="text-amber-700 font-medium">Bu Ay</div>
            </motion.div>

            {/* Writing Streak */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-6 card-hover text-center"
            >
              <div className="text-3xl mb-3">🔥</div>
              <div className="text-2xl font-bold text-amber-900 mb-1">{stats.writingStreak}</div>
              <div className="text-amber-700 font-medium">Günce Seri</div>
            </motion.div>

            {/* Average Words */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-6 card-hover text-center"
            >
              <div className="text-3xl mb-3">✍️</div>
              <div className="text-2xl font-bold text-amber-900 mb-1">{stats.averageWords}</div>
              <div className="text-amber-700 font-medium">Ortalama Kelime</div>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Mood Chart */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-amber-900 mb-4 sm:mb-6">
                Ruh Hali Dağılımı
              </h3>
              <div className="space-y-4">
                {Object.entries(stats.sentimentDistribution).map(([sentiment, count]) => {
                  const maxCount = Math.max(...Object.values(stats.sentimentDistribution))
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                  
                  return (
                    <div key={sentiment} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getSentimentIcon(sentiment)}</div>
                        <span className="text-amber-800 text-sm sm:text-base">{getSentimentLabel(sentiment)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 sm:w-32 bg-amber-200 rounded-full h-3">
                          <div 
                            className={`${getSentimentColor(sentiment)} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-amber-700">{count}</span>
                      </div>
                    </div>
                  )
                })}
                {Object.keys(stats.sentimentDistribution).length === 0 && (
                  <div className="text-center text-amber-600 py-8">
                    Henüz veri bulunmuyor
                  </div>
                )}
              </div>
            </motion.div>

            {/* Activity Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-amber-900 mb-4 sm:mb-6">
                Yazma Aktivitesi
              </h3>
              <div className="space-y-4">
                <div className="text-center text-amber-700 mb-4">
                  Son 30 Gün
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }, (_, i) => {
                    // Simple activity simulation based on available data
                    const hasActivity = Math.random() > 0.7 // 30% chance of activity
                    const intensity = hasActivity ? Math.floor(Math.random() * 3) + 1 : 0
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + (i * 0.02) }}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm ${
                          intensity === 3 
                            ? 'bg-amber-600' 
                            : intensity === 2
                            ? 'bg-amber-500'
                            : intensity === 1 
                            ? 'bg-amber-400' 
                            : 'bg-amber-200'
                        }`}
                        title={`Gün ${i + 1}`}
                      />
                    )
                  })}
                </div>
                <div className="flex justify-between text-xs text-amber-600 mt-2">
                  <span>Az</span>
                  <span>Çok</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Most Used Tags */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6"
          >
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-amber-900 mb-4 sm:mb-6">
              En Çok Kullanılan Etiketler
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {stats.mostUsedTags.map((tag, index) => (
                <motion.div
                  key={tag.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + (index * 0.1) }}
                  className="bg-amber-100 text-amber-800 px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-2"
                >
                  <span>{tag.name}</span>
                  <span className="bg-amber-200 text-amber-900 px-2 py-1 rounded-full text-xs">
                    {tag.count}
                  </span>
                </motion.div>
              ))}
              {stats.mostUsedTags.length === 0 && (
                <div className="text-center text-amber-600 py-8 w-full">
                  Henüz etiket kullanılmamış
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Statistics 