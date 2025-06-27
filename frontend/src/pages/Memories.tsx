import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { apiService, type DiaryEntry } from '../services/api'
import { Heart, Calendar, Tag, ArrowLeft, Search, Filter, Star, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// Using DiaryEntry from api.ts instead of local interface

const Memories: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkTheme } = useTheme();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const sentiments = [
    { value: 'very_positive', label: '😊 Çok Mutlu', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'positive', label: '🙂 Mutlu', color: 'bg-green-100 text-green-800' },
    { value: 'neutral', label: '😐 Nötr', color: 'bg-gray-100 text-gray-800' },
    { value: 'negative', label: '😔 Üzgün', color: 'bg-orange-100 text-orange-800' },
    { value: 'very_negative', label: '😢 Çok Üzgün', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      // API Service kullanımı (dual mode: Electron + Web + Offline)
    const storedEntries = await apiService.getEntries()
    console.log(`💖 Anılar yüklendi (${apiService.mode}):`, storedEntries.length)
      setEntries(storedEntries.filter((entry: DiaryEntry) => entry.is_favorite));
    } catch (error) {
      console.error('❌ Anılar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseEntryDate = (dateValue: string | Date): Date => {
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === 'string') {
      if (dateValue.includes('T')) {
        return new Date(dateValue);
      }
      return new Date(dateValue + 'T00:00:00');
    }
    return new Date();
  };

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = parseEntryDate(dateValue);
      return format(date, "dd MMMM yyyy", { locale: tr });
    } catch (error) {
      console.warn('Tarih formatting hatası:', dateValue, error);
      return "Tarih bilinmiyor";
    }
  };

  const getSentimentEmoji = (sentiment?: string) => {
    switch (sentiment) {
      case 'very_positive': return '😊';
      case 'positive': return '🙂';
      case 'neutral': return '😐';
      case 'negative': return '😔';
      case 'very_negative': return '😢';
      default: return '💭';
    }
  };

  const getYearFromEntry = (entry: DiaryEntry): string => {
    try {
      const date = parseEntryDate(entry.entry_date);
      return date.getFullYear().toString();
    } catch {
      return new Date().getFullYear().toString();
    }
  };

  const filteredMemories = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'all' || getYearFromEntry(entry) === selectedYear;
    const matchesSentiment = selectedSentiment === '' || entry.sentiment === selectedSentiment;
    
    return matchesSearch && matchesYear && matchesSentiment;
  });

  const availableYears = [...new Set(entries.map(entry => getYearFromEntry(entry)))].sort((a, b) => b.localeCompare(a));

  const handleEntryClick = (entryId: string) => {
    navigate(`/entry/${entryId}`);
  };

  const groupedMemories = filteredMemories.reduce((groups: { [key: string]: DiaryEntry[] }, entry) => {
    const year = getYearFromEntry(entry);
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(entry);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4 transition-all duration-700 ${
        isDarkTheme 
          ? 'bg-rich-brown-900' 
          : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}>
        <div className="text-center">
          <Heart className={`h-12 w-12 animate-pulse mx-auto mb-4 transition-colors duration-700 ${
            isDarkTheme ? 'text-warm-gold-400' : 'text-amber-600'
          }`} />
          <p className={`font-medium transition-colors duration-700 ${
            isDarkTheme ? 'text-rich-brown-200' : 'text-amber-800'
          }`}>
            Anılarınız yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-full transition-all duration-700 ${
      isDarkTheme 
        ? 'bg-rich-brown-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`backdrop-blur-sm border-b p-6 transition-all duration-700 ${
          isDarkTheme 
            ? 'bg-rich-brown-800 border-rich-brown-600' 
            : 'bg-white/80 border-orange-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/diary-list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-700 ${
                isDarkTheme 
                  ? 'text-amber-300 hover:text-amber-200 hover:bg-rich-brown-700' 
                  : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={20} />
              <span>Geri Dön</span>
            </motion.button>
            <div>
              <h1 className={`text-3xl font-serif font-bold transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
              }`}>
                ✨ Değerli Anılarım
              </h1>
              <p className={`mt-2 transition-colors duration-700 ${
                isDarkTheme ? 'text-amber-300' : 'text-amber-700'
              }`}>
                {filteredMemories.length} favori anınız bulundu
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-700 ${
              isDarkTheme ? 'text-warm-gold-400' : 'text-amber-500'
            }`} size={20} />
            <input
              type="text"
              placeholder="Anılarınızda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-700 focus:outline-none focus:ring-2 ${
                isDarkTheme 
                  ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 placeholder-rich-brown-300 focus:ring-warm-gold-500' 
                  : 'bg-white/80 border-orange-200 text-amber-900 placeholder-amber-500 focus:ring-amber-300'
              }`}
            />
          </div>

          {/* Filter Button */}
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl border backdrop-blur-sm transition-all duration-700 ${
              showFilters 
                ? (isDarkTheme 
                    ? 'bg-warm-gold-500 border-warm-gold-400 text-rich-brown-900' 
                    : 'bg-amber-200 border-amber-300 text-amber-900')
                : (isDarkTheme 
                    ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 hover:bg-rich-brown-600' 
                    : 'bg-white/80 border-orange-200 text-amber-700 hover:bg-amber-100')
            }`}
          >
            <Filter size={20} />
            <span>Filtreler</span>
          </motion.button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`overflow-hidden rounded-xl border backdrop-blur-sm transition-all duration-700 ${
                isDarkTheme 
                  ? 'bg-rich-brown-800 border-rich-brown-600' 
                  : 'bg-white/80 border-orange-200'
              }`}
            >
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Year Filter */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                    }`}>
                      Yıl
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-700 focus:outline-none focus:ring-2 ${
                        isDarkTheme 
                          ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 focus:ring-warm-gold-500' 
                          : 'bg-white border-orange-200 text-amber-900 focus:ring-amber-300'
                      }`}
                    >
                      <option value="all">Tüm yıllar</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sentiment Filter */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                    }`}>
                      Ruh Hali
                    </label>
                    <select
                      value={selectedSentiment}
                      onChange={(e) => setSelectedSentiment(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-700 focus:outline-none focus:ring-2 ${
                        isDarkTheme 
                          ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 focus:ring-warm-gold-500' 
                          : 'bg-white border-orange-200 text-amber-900 focus:ring-amber-300'
                      }`}
                    >
                      <option value="">Tüm ruh halleri</option>
                      {sentiments.map(sentiment => (
                        <option key={sentiment.value} value={sentiment.value}>
                          {sentiment.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(selectedYear !== 'all' || selectedSentiment !== '' || searchTerm !== '') && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      setSelectedYear('all');
                      setSelectedSentiment('');
                      setSearchTerm('');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all duration-700 ${
                      isDarkTheme 
                        ? 'bg-warm-gold-500 text-rich-brown-900 hover:bg-warm-gold-400' 
                        : 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                    }`}
                  >
                    Filtreleri Temizle
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {filteredMemories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className={`h-16 w-16 mx-auto mb-6 transition-colors duration-700 ${
              isDarkTheme ? 'text-amber-400' : 'text-amber-500'
            }`} />
            <h3 className={`text-xl font-semibold mb-3 transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
            }`}>
              {searchTerm || selectedYear !== 'all' || selectedSentiment ? 'Arama kriterlerinize uygun anı bulunamadı' : 'Henüz hiç favori anınız yok'}
            </h3>
            <p className={`mb-6 transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
            }`}>
              {searchTerm || selectedYear !== 'all' || selectedSentiment 
                                  ? 'Farklı filtreler deneyebilir veya tüm güncelerinizi görüntüleyebilirsiniz.'
                  : 'Özel günce yazılarınızı favoriye ekleyerek buradan kolayca ulaşabilirsiniz.'}
            </p>
            <motion.button
              onClick={() => navigate('/diary-list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-700 ${
                isDarkTheme 
                  ? 'bg-gradient-to-r from-warm-gold-500 to-rich-brown-700 text-rich-brown-900 hover:from-warm-gold-400 hover:to-rich-brown-600' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
              }`}
            >
                              Tüm Güncelere Git
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedMemories)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([year, yearEntries]) => (
                <motion.div
                  key={year}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Year Header */}
                  <div className="flex items-center gap-3">
                    <Calendar className={`h-5 w-5 transition-colors duration-700 ${
                      isDarkTheme ? 'text-warm-gold-400' : 'text-amber-600'
                    }`} />
                    <h2 className={`text-2xl font-serif font-bold transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                    }`}>
                      {year}
                    </h2>
                    <div className={`flex-1 h-px transition-colors duration-700 ${
                      isDarkTheme ? 'bg-rich-brown-600' : 'bg-amber-200'
                    }`} />
                    <span className={`text-sm transition-colors duration-700 ${
                      isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                    }`}>
                      {yearEntries.length} anı
                    </span>
                  </div>

                  {/* Memory Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {yearEntries
                        .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
                        .map((entry, index) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            onClick={() => handleEntryClick(entry.id)}
                            className={`group cursor-pointer rounded-xl border backdrop-blur-sm p-6 shadow-lg transition-all duration-700 ${
                              isDarkTheme 
                                ? 'bg-rich-brown-800 border-rich-brown-600 hover:bg-rich-brown-700 hover:border-rich-brown-500' 
                                : 'bg-white/80 border-orange-200 hover:bg-white hover:border-orange-300'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl">{getSentimentEmoji(entry.sentiment)}</span>
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              </div>
                              <span className={`text-xs transition-colors duration-700 ${
                                isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                              }`}>
                                {formatDate(entry.entry_date)}
                              </span>
                            </div>

                            {/* Card Content */}
                            <div className="space-y-3">
                              <h3 className={`font-serif font-semibold text-lg line-clamp-2 transition-colors duration-700 ${
                                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                              }`}>
                                {entry.title}
                              </h3>
                              <p className={`text-sm line-clamp-3 transition-colors duration-700 ${
                                isDarkTheme ? 'text-rich-brown-300' : 'text-amber-700'
                              }`}>
                                {entry.content}
                              </p>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-4 pt-4 border-t border-opacity-30 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {entry.word_count && (
                                  <span className={`text-xs flex items-center transition-colors duration-700 ${
                                    isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                                  }`}>
                                    <Clock className="h-3 w-3 mr-1" />
                                    {entry.word_count} kelime
                                  </span>
                                )}
                              </div>
                              {entry.tags && entry.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Tag className={`h-3 w-3 transition-colors duration-700 ${
                                    isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                                  }`} />
                                  <span className={`text-xs transition-colors duration-700 ${
                                    isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                                  }`}>
                                    {entry.tags.length}
                                  </span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Memories; 