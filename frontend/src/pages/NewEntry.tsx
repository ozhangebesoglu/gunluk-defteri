import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Save, 
  Tag, 
  Smile, 
  AlertCircle, 
  Check, 
  Loader2, 
  ArrowLeft,
  BookOpen,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { apiService } from '../services/api'
import { logger } from '../utils/logger'

interface JournalEntry {
  title: string
  content: string
  tags: string[]
  sentiment: string
  entry_date: Date
  weather?: string
  location?: string
}

interface ValidationErrors {
  title?: string
  content?: string
  sentiment?: string
}

const NewEntry: React.FC = () => {
  const navigate = useNavigate()
  const { isDarkTheme } = useTheme()
  const [entry, setEntry] = useState<JournalEntry>({
    title: '',
    content: '',
    tags: [],
    sentiment: '',
    entry_date: new Date(),
    weather: '',
    location: ''
  })
  
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  const sentiments = [
    { value: 'very_positive', label: '😊 Çok Mutlu', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'positive', label: '🙂 Mutlu', color: 'bg-green-100 text-green-800' },
    { value: 'neutral', label: '😐 Nötr', color: 'bg-gray-100 text-gray-800' },
    { value: 'negative', label: '😔 Üzgün', color: 'bg-orange-100 text-orange-800' },
    { value: 'very_negative', label: '😢 Çok Üzgün', color: 'bg-red-100 text-red-800' }
  ]

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    if (!entry.title.trim()) {
      newErrors.title = 'Başlık zorunludur'
    }
    
    if (!entry.content.trim()) {
      newErrors.content = 'İçerik zorunludur'
    }
    
    if (!entry.sentiment) {
      newErrors.sentiment = 'Lütfen ruh halinizi seçin'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!entry.tags.includes(tagInput.trim())) {
        setEntry(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSave = async () => {
    logger.info('Save operation started')
    logger.debug('Entry data:', entry)
    
    if (!validateForm()) {
      logger.warn('Form validation failed')
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      const entryData = {
        id: Date.now().toString(), // Geçici ID
        ...entry,
        entry_date: entry.entry_date.toISOString().split('T')[0],
        word_count: entry.content.trim().split(/\s+/).length,
        created_at: new Date().toISOString()
      }
      
      // API Service kullanımı (dual mode: Electron + Web + Offline)
      await apiService.createEntry(entryData)
      
      logger.success('Entry saved successfully', { id: entryData.id })
      
      setShowSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      
    } catch (error) {
      logger.error('Failed to save entry:', error)
      // Hata mesajı göster
      setShowError(true)
              setErrors({ content: 'Günce kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.' })
      setTimeout(() => setShowError(false), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedSentiment = sentiments.find(sentiment => sentiment.value === entry.sentiment)

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
          className="text-center mb-6 sm:mb-8 snap-section"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Kontrol paneline geri dön"
              className={`flex items-center gap-2 transition-colors p-2 rounded-lg ${
                isDarkTheme 
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-900' 
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
            isDarkTheme ? 'text-amber-200' : 'text-amber-900'
          }`}>
            Yeni Günce Yazısı
          </h1>
          <p className={`text-sm sm:text-base lg:text-lg font-light transition-colors duration-700 ${
            isDarkTheme ? 'text-amber-300' : 'text-amber-700'
          }`}>
            Bugünkü düşüncelerinizi ve anılarınızı kaydedin
          </p>
        </motion.div>

        {/* Success Alert */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center"
          >
            <Check className="h-4 w-4 mr-2" />
            Günce yazınız başarıyla kaydedildi!
          </motion.div>
        )}

        {/* Error Alert */}
        {showError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg flex items-center"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Günce kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.
          </motion.div>
        )}

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-200 overflow-hidden"
        >
          {/* Paper texture overlay */}
          <div 
            className="relative bg-gradient-to-b from-amber-25 to-white"
            style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(139, 69, 19, 0.1) 1px, transparent 0),
                linear-gradient(90deg, rgba(139, 69, 19, 0.05) 1px, transparent 1px),
                linear-gradient(rgba(139, 69, 19, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px, 20px 20px, 100% 30px'
            }}
          >
            {/* Red margin line */}
            <div className="absolute left-16 top-0 bottom-0 w-px bg-red-300 opacity-60"></div>
            
            <div className="relative p-6 sm:p-8 lg:p-12">
              {/* Date and Mood Row */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1">
                  <label htmlFor="entry_date" className="block text-sm font-medium text-amber-900 mb-2">
                    <Calendar className="inline w-4 h-4 mr-2" />
                    Tarih
                  </label>
                  <input
                    type="date"
                    id="entry_date"
                    value={format(entry.entry_date, 'yyyy-MM-dd')}
                    onChange={(e) => setEntry(prev => ({...prev, entry_date: new Date(e.target.value)}))}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-500 text-amber-900`}
                  />
                </div>
                
                <fieldset className="flex-1">
                  <legend className="block text-sm font-medium text-amber-900 mb-2">
                    <Smile className="inline w-4 h-4 mr-2" />
                    Ruh Halin
                    {errors.sentiment && <span id="sentiment-error" className="text-red-600 ml-2"> - {errors.sentiment}</span>}
                  </legend>
                  <div role="radiogroup" aria-labelledby="sentiment-error" className="flex flex-wrap gap-2">
                    {sentiments.map(sentiment => (
                      <button
                        key={sentiment.value}
                        type="button"
                        role="radio"
                        aria-checked={entry.sentiment === sentiment.value}
                        aria-describedby={errors.sentiment ? 'sentiment-error' : undefined}
                        onClick={() => setEntry(prev => ({ ...prev, sentiment: sentiment.value }))}
                        className={`px-3 py-2 text-sm rounded-full transition-all duration-200 border-2 ${
                          entry.sentiment === sentiment.value
                            ? 'border-amber-500 ring-2 ring-amber-300 bg-amber-100 text-amber-900'
                            : 'border-gray-300 hover:border-amber-400'
                        }`}
                      >
                        {sentiment.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              {/* Title */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-lg font-semibold text-amber-900 mb-2">
                  Başlık
                </label>
                <input
                  id="title"
                  type="text"
                  value={entry.title}
                  onChange={e => setEntry(prev => ({ ...prev, title: e.target.value }))}
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  placeholder="Günün başlığı ne olsun?"
                  className={`w-full text-2xl font-serif p-2 bg-transparent border-b-2 border-amber-200 focus:outline-none focus:border-amber-500 ${ 'text-amber-900'}`}
                />
                {errors.title && <p id="title-error" className="text-red-600 mt-1 text-sm">{errors.title}</p>}
              </div>

              {/* Content */}
              <div className="mb-8">
                <label htmlFor="content" className="block text-lg font-semibold text-amber-900 mb-2">
                  Bugün neler oldu?
                </label>
                <textarea
                  id="content"
                  value={entry.content}
                  onChange={e => setEntry(prev => ({ ...prev, content: e.target.value }))}
                  aria-required="true"
                  aria-invalid={!!errors.content}
                  aria-describedby={errors.content ? 'content-error' : undefined}
                  placeholder="Düşüncelerini buraya yaz..."
                  rows={15}
                  className={`w-full p-4 text-base leading-relaxed bg-white/50 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${'text-amber-900'
                  }`}
                />
                {errors.content && <p id="content-error" className="text-red-600 mt-1 text-sm">{errors.content}</p>}
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Hava Durumu (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={entry.weather || ''}
                    onChange={(e) => setEntry(prev => ({ ...prev, weather: e.target.value }))}
                    placeholder="Güneşli, yağmurlu..."
                    className={`w-full px-3 py-2 font-serif text-base leading-relaxed bg-white/70 border border-amber-300 rounded-md focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 resize-none text-amber-900 ${
                      errors.content ? 'border-red-400' : ''
                    }`}
                                      />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Konum (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={entry.location || ''}
                    onChange={(e) => setEntry(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="İstanbul, Ankara..."
                    className={`w-full px-3 py-2 font-serif text-base leading-relaxed bg-white/70 border border-amber-300 rounded-md focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 resize-none text-amber-900${
                      errors.content ? 'border-red-400' : ''
                    }`}
                                      />
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label htmlFor="tags" className="block text-sm font-medium text-amber-900 mb-2">
                  <Tag className="inline w-4 h-4 mr-2" />
                  Etiketler (Enter'a basarak ekle)
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg bg-white/50">
                  {entry.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                      {tag}
                      <button onClick={() => removeTag(tag)} aria-label={`'${tag}' etiketini kaldır`}>
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Yeni etiket..."
                    className={`flex-1 p-1 bg-transparent focus:outline-none ${
                      'text-amber-900'
                    }`}
                  />
                </div>
              </div>

              {/* Current Mood Display */}
              {selectedSentiment && (
                <div className="mb-6 p-4 bg-white/50 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-700 mb-2">Seçilen ruh hali:</p>
                  <span className={`px-3 py-2 rounded-full text-sm font-medium ${selectedSentiment.color}`}>
                    {selectedSentiment.label}
                  </span>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Kaydet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-amber-600 text-sm">
          <p>Düşünceleriniz değerlidir. Yazmaya devam edin. ✨</p>
        </div>
      </div>
    </div>
  )
}

export default NewEntry 