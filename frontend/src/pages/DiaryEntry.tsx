import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Save, 
  Tag, 
  Smile, 
  Check, 
  Loader2, 
  ArrowLeft,
  BookOpen,
  Edit3,
  Heart,
  Star,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { apiService, type DiaryEntry } from '../services/api'

interface ValidationErrors {
  title?: string
  content?: string
  sentiment?: string
}

const DiaryEntryPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { isDarkTheme } = useTheme()
  
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [editedEntry, setEditedEntry] = useState<DiaryEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)

  const sentiments = [
    { value: 'very_positive', label: '😊 Çok Mutlu', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'positive', label: '🙂 Mutlu', color: 'bg-green-100 text-green-800' },
    { value: 'neutral', label: '😐 Nötr', color: 'bg-gray-100 text-gray-800' },
    { value: 'negative', label: '😔 Üzgün', color: 'bg-orange-100 text-orange-800' },
    { value: 'very_negative', label: '😢 Çok Üzgün', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    if (id) {
      loadEntry(id)
    }
  }, [id])

  const loadEntry = async (entryId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // API Service kullanımı (dual mode: Electron + Web + Offline)
      const foundEntry = await apiService.getEntry(entryId)
      
      if (foundEntry) {
        console.log(`✅ Günce yüklendi (${apiService.mode}):`, foundEntry.id)
        setEntry(foundEntry)
        setEditedEntry({ ...foundEntry })
      } else {
        console.log(`❌ Günce bulunamadı (${apiService.mode}):`, entryId)
        setError('Günce yazısı bulunamadı')
      }
    } catch (error) {
      console.error('❌ Günce yüklenemedi:', error)
      setError('Günce yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const parseEntryDate = (dateValue: string | Date): Date => {
    if (dateValue instanceof Date) return dateValue
    if (typeof dateValue === 'string') {
      if (dateValue.includes('T')) {
        return new Date(dateValue)
      }
      return new Date(dateValue + 'T00:00:00')
    }
    return new Date()
  }

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = parseEntryDate(dateValue)
      return format(date, "dd MMMM yyyy, EEEE", { locale: tr })
    } catch (error) {
      console.warn('Tarih formatting hatası:', dateValue, error)
      return "Tarih bilinmiyor"
    }
  }



  const validateForm = (): boolean => {
    if (!editedEntry) return false
    
    const newErrors: ValidationErrors = {}
    
    if (!editedEntry.title.trim()) {
      newErrors.title = 'Başlık zorunludur'
    }
    
    if (!editedEntry.content.trim()) {
      newErrors.content = 'İçerik zorunludur'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && editedEntry) {
      e.preventDefault()
      const currentTags = editedEntry.tags || []
      if (!currentTags.includes(tagInput.trim())) {
        setEditedEntry(prev => prev ? {
          ...prev,
          tags: [...currentTags, tagInput.trim()]
        } : null)
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (!editedEntry) return
    setEditedEntry(prev => prev ? {
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    } : null)
  }

  const toggleFavorite = async () => {
    if (!entry || !editedEntry) return
    
    const newFavoriteStatus = !editedEntry.is_favorite
    setEditedEntry(prev => prev ? { ...prev, is_favorite: newFavoriteStatus } : null)
    
    try {
      // API Service kullanımı (dual mode: Electron + Web + Offline)
      await apiService.updateEntry(entry.id, { is_favorite: newFavoriteStatus })
      console.log(`✅ Favori durumu güncellendi (${apiService.mode})`)
      
      setEntry(prev => prev ? { ...prev, is_favorite: newFavoriteStatus } : null)
    } catch (error) {
      console.error('❌ Favori durumu güncellenemedi:', error)
      // Geri al
      setEditedEntry(prev => prev ? { ...prev, is_favorite: !newFavoriteStatus } : null)
    }
  }

  const handleSave = async () => {
    if (!editedEntry || !validateForm()) return
    
    setSaving(true)
    setErrors({})
    
    try {
      const updatedEntry = {
        ...editedEntry,
        word_count: editedEntry.content.trim().split(/\s+/).length,
        updated_at: new Date().toISOString()
      }
      
      // API Service kullanımı (dual mode: Electron + Web + Offline)
      const savedEntry = await apiService.updateEntry(updatedEntry.id, updatedEntry)
      console.log(`✅ Günce güncellendi (${apiService.mode}):`, savedEntry.id)
      
      setEntry(savedEntry)
      setEditedEntry(savedEntry)
      
      setIsEditing(false)
      setShowSuccess(true)
      
      setTimeout(() => setShowSuccess(false), 3000)
      
    } catch (error) {
      console.error('❌ Günce güncellenemedi:', error)
      setErrors({ content: 'Günce güncellenirken bir hata oluştu.' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    if (entry) {
      setEditedEntry({ ...entry })
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (entry) {
      setEditedEntry({ ...entry })
    }
    setErrors({})
  }

  if (loading) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4 transition-all duration-700 ${
        isDarkTheme 
          ? 'bg-rich-brown-900' 
          : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}>
        <div className="text-center">
          <BookOpen className={`h-12 w-12 animate-pulse mx-auto mb-4 transition-colors duration-700 ${
            isDarkTheme ? 'text-warm-gold-400' : 'text-amber-600'
          }`} />
          <p className={`font-medium transition-colors duration-700 ${
            isDarkTheme ? 'text-rich-brown-200' : 'text-amber-800'
          }`}>
            Günce yükleniyor...
          </p>
        </div>
      </div>
    )
  }

  if (error || !entry || !editedEntry) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4 transition-all duration-700 ${
        isDarkTheme 
          ? 'bg-rich-brown-900' 
          : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}>
        <div className="text-center">
          <BookOpen className={`h-12 w-12 mx-auto mb-4 transition-colors duration-700 ${
            isDarkTheme ? 'text-amber-400' : 'text-amber-400'
          }`} />
          <h2 className={`text-xl font-semibold mb-2 transition-colors duration-700 ${
            isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
          }`}>
            Günce Bulunamadı
          </h2>
          <p className={`mb-4 transition-colors duration-700 ${
            isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
          }`}>
            {error || 'Bu günce yazısı mevcut değil'}
          </p>
          <motion.button
            onClick={() => navigate('/diary-list')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-700 ${
              isDarkTheme 
                ? 'bg-warm-gold-500 text-rich-brown-900 hover:bg-warm-gold-400' 
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
                          Günce Listesine Dön
          </motion.button>
        </div>
      </div>
    )
  }

  const selectedSentiment = sentiments.find(sentiment => sentiment.value === editedEntry.sentiment)

  return (
    <div className={`w-full min-h-full relative transition-all duration-700 ${
      isDarkTheme 
        ? 'bg-rich-brown-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='13' cy='43' r='1'/%3E%3Ccircle cx='47' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            <button
              onClick={() => navigate('/diary-list')}
              className={`flex items-center gap-2 transition-colors p-2 rounded-lg ${
                isDarkTheme 
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-rich-brown-700' 
                  : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Geri Dön</span>
            </button>
            <BookOpen className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors duration-700 ${
              isDarkTheme ? 'text-amber-400' : 'text-amber-600'
            }`} />
          </div>
          <h1 className={`text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-serif mb-2 tracking-wide transition-colors duration-700 ${
            isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
          }`}>
            {isEditing ? 'Günce Düzenle' : 'Günce Yazım'}
          </h1>
          <p className={`text-sm sm:text-base lg:text-lg font-light transition-colors duration-700 ${
            isDarkTheme ? 'text-amber-300' : 'text-amber-700'
          }`}>
            {formatDate(editedEntry.entry_date)}
          </p>
        </motion.div>

        {/* Success Alert */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 px-4 py-3 rounded-lg flex items-center transition-all duration-700 ${
                isDarkTheme 
                  ? 'bg-green-900 border border-green-700 text-green-200' 
                  : 'bg-green-100 border border-green-300 text-green-800'
              }`}
            >
              <Check className="h-4 w-4 mr-2" />
              Günce başarıyla güncellendi!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3 justify-center mb-6"
        >
          {!isEditing ? (
            <>
              <motion.button
                onClick={handleEdit}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-700 ${
                  isDarkTheme 
                    ? 'bg-warm-gold-500 text-rich-brown-900 hover:bg-warm-gold-400' 
                    : 'bg-amber-500 text-white hover:bg-amber-600'
                }`}
              >
                <Edit3 className="h-4 w-4" />
                Düzenle
              </motion.button>
              <motion.button
                onClick={toggleFavorite}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-700 ${
                  editedEntry.is_favorite
                    ? (isDarkTheme 
                        ? 'bg-red-500 text-white hover:bg-red-400' 
                        : 'bg-red-500 text-white hover:bg-red-400')
                    : (isDarkTheme 
                        ? 'bg-rich-brown-700 text-rich-brown-200 border border-rich-brown-600 hover:bg-rich-brown-600' 
                        : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50')
                }`}
              >
                <Heart className={`h-4 w-4 ${editedEntry.is_favorite ? 'fill-current' : ''}`} />
                {editedEntry.is_favorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                whileHover={{ scale: saving ? 1 : 1.05 }}
                whileTap={{ scale: saving ? 1 : 0.95 }}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-700 ${
                  isDarkTheme 
                    ? 'bg-warm-gold-500 text-rich-brown-900 hover:bg-warm-gold-400 disabled:opacity-50' 
                    : 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Kaydet
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-700 ${
                  isDarkTheme 
                    ? 'bg-rich-brown-700 text-rich-brown-200 border border-rich-brown-600 hover:bg-rich-brown-600' 
                    : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-50'
                }`}
              >
                İptal
              </motion.button>
            </>
          )}
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`backdrop-blur-sm rounded-xl border shadow-xl p-6 sm:p-8 transition-all duration-700 ${
            isDarkTheme 
              ? 'bg-rich-brown-800/95 border-rich-brown-600' 
              : 'bg-white/95 border-orange-200'
          }`}
        >
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
              }`}>
                <Calendar className="inline h-4 w-4 mr-2" />
                Başlık
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedEntry.title}
                  onChange={(e) => setEditedEntry(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Günce başlığı..."
                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-700 focus:outline-none focus:ring-2 ${
                    isDarkTheme 
                      ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 placeholder-rich-brown-300 focus:ring-warm-gold-500' 
                      : 'bg-white border-orange-200 text-amber-900 placeholder-amber-500 focus:ring-amber-300'
                  } ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              ) : (
                <h2 className={`text-xl sm:text-2xl font-serif font-semibold transition-colors duration-700 ${
                  isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                }`}>
                  {editedEntry.title}
                </h2>
              )}
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Sentiment */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
              }`}>
                <Smile className="inline h-4 w-4 mr-2" />
                Ruh Hali
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {sentiments.map((sentiment) => (
                    <motion.button
                      key={sentiment.value}
                      type="button"
                      onClick={() => setEditedEntry(prev => prev ? { ...prev, sentiment: sentiment.value } : null)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all duration-300 ${
                        editedEntry.sentiment === sentiment.value
                          ? (isDarkTheme 
                              ? 'bg-warm-gold-500 border-warm-gold-400 text-rich-brown-900' 
                              : 'bg-amber-200 border-amber-300 text-amber-900')
                          : (isDarkTheme 
                              ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-200 hover:bg-rich-brown-600' 
                              : 'bg-white border-orange-200 text-amber-700 hover:bg-amber-50')
                      }`}
                    >
                      {sentiment.label}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className={`inline-flex items-center px-3 py-2 rounded-lg transition-colors duration-700 ${
                  isDarkTheme ? 'bg-rich-brown-700 text-rich-brown-200' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedSentiment?.label || '😐 Belirtilmemiş'}
                </div>
              )}
              {errors.sentiment && <p className="text-red-500 text-sm mt-1">{errors.sentiment}</p>}
            </div>

            {/* Content */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
              }`}>
                İçerik
              </label>
              {isEditing ? (
                <textarea
                  value={editedEntry.content}
                  onChange={(e) => setEditedEntry(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Sevgili günce..."
                  rows={12}
                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-700 focus:outline-none focus:ring-2 resize-none ${
                    isDarkTheme 
                      ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 placeholder-rich-brown-300 focus:ring-warm-gold-500' 
                      : 'bg-white border-orange-200 text-amber-900 placeholder-amber-500 focus:ring-amber-300'
                  } ${errors.content ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              ) : (
                <div className={`prose prose-amber max-w-none transition-colors duration-700 ${
                  isDarkTheme ? 'prose-invert text-rich-brown-200' : 'text-amber-800'
                }`}>
                  <p className="whitespace-pre-wrap text-base leading-relaxed">
                    {editedEntry.content}
                  </p>
                </div>
              )}
              {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
            </div>

            {/* Tags */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
              }`}>
                <Tag className="inline h-4 w-4 mr-2" />
                Etiketler
              </label>
              {isEditing && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Etiket ekleyin (Enter'a basın)"
                  className={`w-full px-4 py-2 rounded-lg border mb-3 transition-all duration-700 focus:outline-none focus:ring-2 ${
                    isDarkTheme 
                      ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 placeholder-rich-brown-300 focus:ring-warm-gold-500' 
                      : 'bg-white border-orange-200 text-amber-900 placeholder-amber-500 focus:ring-amber-300'
                  }`}
                />
              )}
              <div className="flex flex-wrap gap-2">
                {(editedEntry.tags || []).map((tag, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-700 ${
                      isDarkTheme 
                        ? 'bg-amber-900 text-amber-200' 
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => removeTag(tag)}
                        className={`ml-2 text-xs transition-colors duration-700 ${
                          isDarkTheme ? 'hover:text-amber-100' : 'hover:text-amber-900'
                        }`}
                      >
                        ×
                      </button>
                    )}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Metadata */}
            {!isEditing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`pt-4 border-t flex flex-wrap gap-4 text-sm transition-colors duration-700 ${
                  isDarkTheme ? 'border-rich-brown-600 text-amber-400' : 'border-amber-200 text-amber-600'
                }`}
              >
                {editedEntry.word_count && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{editedEntry.word_count} kelime</span>
                  </div>
                )}
                {editedEntry.is_favorite && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>Favorilerimde</span>
                  </div>
                )}
                {editedEntry.created_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Oluşturulma: {format(new Date(editedEntry.created_at), "dd.MM.yyyy HH:mm")}</span>
                  </div>
                )}
                {editedEntry.updated_at && editedEntry.updated_at !== editedEntry.created_at && (
                  <div className="flex items-center gap-1">
                    <Edit3 className="h-4 w-4" />
                    <span>Güncelleme: {format(new Date(editedEntry.updated_at), "dd.MM.yyyy HH:mm")}</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Vintage decorative footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className={`inline-flex items-center gap-2 transition-colors duration-700 ${
            isDarkTheme ? 'text-amber-600' : 'text-amber-600'
          }`}>
            <div className={`w-8 h-px transition-colors duration-700 ${
              isDarkTheme ? 'bg-amber-400' : 'bg-amber-300'
            }`} />
            <span className="text-sm font-serif italic">Anılarım</span>
            <div className={`w-8 h-px transition-colors duration-700 ${
              isDarkTheme ? 'bg-amber-400' : 'bg-amber-300'
            }`} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DiaryEntryPage 