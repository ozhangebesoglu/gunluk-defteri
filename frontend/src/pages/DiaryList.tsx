import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Heart, 
  BookOpen, 
  Filter,
  Tag,
  Eye,
  Plus,
  ArrowRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { apiService, type DiaryEntry } from '../services/api';
import { logger } from '../utils/logger';

interface FilterState {
  searchTerm: string;
  selectedTags: string[];
  sortBy: 'date' | 'title';
  sortOrder: 'asc' | 'desc';
  showFavoritesOnly: boolean;
  selectedSentiment: string;
}

const DiaryList: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkTheme } = useTheme();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedTags: [],
    sortBy: 'date',
    sortOrder: 'desc',
    showFavoritesOnly: false,
    selectedSentiment: ''
  });
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const sentiments = [
    { value: 'very_positive', label: '😊 Çok Mutlu', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'positive', label: '🙂 Mutlu', color: 'bg-green-100 text-green-800' },
    { value: 'neutral', label: '😐 Nötr', color: 'bg-gray-100 text-gray-800' },
    { value: 'negative', label: '😔 Üzgün', color: 'bg-orange-100 text-orange-800' },
    { value: 'very_negative', label: '😢 Çok Üzgün', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      // API Service kullanımı (dual mode: Electron + Web + Offline)
      const storedEntries = await apiService.getEntries();
      setEntries(storedEntries);
      
      // Tüm etiketleri topla
      const tags = new Set<string>();
      storedEntries.forEach((entry: DiaryEntry) => {
        if (entry.tags) {
          entry.tags.forEach(tag => tags.add(tag));
        }
      });
      setAllTags(Array.from(tags));
      
      logger.success(`Diary list loaded (${apiService.mode}): ${storedEntries.length} entries`);
    } catch (error) {
      logger.error('Failed to load diary entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Güvenli tarih parsing fonksiyonu
  const parseEntryDate = (dateValue: string | Date): Date => {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      if (dateValue.includes('T') || dateValue.includes('-')) {
        return parseISO(dateValue);
      }
      return new Date(dateValue);
    }
    return new Date();
  };

  const filteredEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           entry.content.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesTags = filters.selectedTags.length === 0 || 
                         filters.selectedTags.some(tag => entry.tags?.includes(tag));
      
      const matchesFavorites = !filters.showFavoritesOnly || entry.is_favorite;
      
      const matchesSentiment = !filters.selectedSentiment || entry.sentiment === filters.selectedSentiment;
      
      return matchesSearch && matchesTags && matchesFavorites && matchesSentiment;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (filters.sortBy === 'date') {
        try {
          const dateA = parseEntryDate(a.entry_date);
          const dateB = parseEntryDate(b.entry_date);
          comparison = dateA.getTime() - dateB.getTime();
        } catch (error) {
          logger.warn('Date sorting error:', error);
          comparison = 0;
        }
      } else {
        comparison = a.title.localeCompare(b.title);
      }
      
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [entries, filters]);

  /* GEÇICI OLARAK COMMENT OUT - GELECEKTE KULLANILACAK
  const toggleFavorite = async (entryId: string) => {
    try {
      // LocalStorage'dan günceleri al
      const storedEntries = JSON.parse(localStorage.getItem('diary_entries') || '[]');
      
      // Favorileri toggle et
      const updatedEntries = storedEntries.map((entry: DiaryEntry) => 
        entry.id === entryId ? { ...entry, is_favorite: !entry.is_favorite } : entry
      );
      
      // LocalStorage'a kaydet
      localStorage.setItem('diary_entries', JSON.stringify(updatedEntries));
      
      // Local state'i güncelle
      setEntries(updatedEntries);
      
      console.log('⭐ Favori durumu güncellendi:', entryId);
    } catch (error) {
      console.error('❌ Favori güncelleme hatası:', error);
    }
  };
  */

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = parseEntryDate(dateValue);
      return format(date, "dd MMMM yyyy", { locale: tr });
    } catch (error) {
      logger.warn('Date formatting error:', { dateValue, error });
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
      default: return '📝';
    }
  };

  /* GEÇICI OLARAK COMMENT OUT - GELECEKTE KULLANILACAK
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'very_positive': return 'bg-emerald-100 border-emerald-300';
      case 'positive': return 'bg-green-100 border-green-300';
      case 'neutral': return 'bg-gray-100 border-gray-300';
      case 'negative': return 'bg-orange-100 border-orange-300';
      case 'very_negative': return 'bg-red-100 border-red-300';
      default: return 'bg-amber-100 border-amber-300';
    }
  };
  */

  const handleEntryClick = (entryId: string) => {
    navigate(`/entry/${entryId}`);
  };

  /* GEÇICI OLARAK COMMENT OUT - GELECEKTE KULLANILACAK
  const handleNewEntry = () => {
    navigate('/new-entry');
  };
  */

  if (loading) {
    return (
      <div className="w-full min-h-full bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-amber-600 animate-pulse mx-auto mb-4" />
          <p className="text-amber-800 font-medium">Günce kayıtları yükleniyor...</p>
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
        className={`backdrop-blur-sm border-b p-6 transition-all duration-700 snap-section ${
          isDarkTheme 
            ? 'bg-rich-brown-800 border-rich-brown-600' 
            : 'bg-white/80 border-orange-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-serif font-bold transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
            }`}>
              Günce Kayıtlarım
            </h1>
            <p className={`mt-2 transition-colors duration-700 ${
              isDarkTheme ? 'text-amber-300' : 'text-amber-700'
            }`}>
              {entries.length} kayıt bulundu
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-700 ${
              isDarkTheme 
                ? 'bg-gradient-to-r from-warm-gold-500 to-rich-brown-700 text-rich-brown-900 hover:from-warm-gold-400 hover:to-rich-brown-600' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
            }`}
          >
            <Plus size={20} />
                          <span>Yeni Günce Yazısı</span>
          </motion.button>
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
              placeholder="Günce yazılarında ara..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
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

          {/* Sort */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [string, string];
              setFilters(prev => ({ ...prev, sortBy: sortBy as 'date' | 'title', sortOrder: sortOrder as 'asc' | 'desc' }));
            }}
            className={`px-4 py-3 rounded-xl border backdrop-blur-sm transition-all duration-700 focus:outline-none focus:ring-2 ${
              isDarkTheme 
                ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-100 focus:ring-warm-gold-500' 
                : 'bg-white/80 border-orange-200 text-amber-900 focus:ring-amber-300'
            }`}
          >
            <option value="date-desc">Yeni → Eski</option>
            <option value="date-asc">Eski → Yeni</option>
            <option value="title-asc">Başlık A-Z</option>
            <option value="title-desc">Başlık Z-A</option>
          </select>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Ruh Hali Filtresi */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                    }`}>
                      Ruh Hali
                    </label>
                    <select
                      value={filters.selectedSentiment}
                      onChange={(e) => setFilters(prev => ({ ...prev, selectedSentiment: e.target.value }))}
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

                  {/* Etiket Filtresi */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                    }`}>
                      Etiket
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {allTags.map(tag => (
                        <motion.button
                          key={tag}
                          onClick={() => {
                            setFilters(prev => ({
                              ...prev,
                              selectedTags: prev.selectedTags.includes(tag)
                                ? prev.selectedTags.filter(t => t !== tag)
                                : [...prev.selectedTags, tag]
                            }))
                          }}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            filters.selectedTags.includes(tag)
                              ? (isDarkTheme 
                                  ? 'bg-warm-gold-500 text-rich-brown-900' 
                                  : 'bg-amber-200 text-amber-900')
                              : (isDarkTheme 
                                  ? 'bg-rich-brown-600 text-rich-brown-200 hover:bg-rich-brown-500' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-amber-100')
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Favoriler */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                    }`}>
                      Favoriler
                    </label>
                    <motion.button
                      onClick={() => setFilters(prev => ({ ...prev, showFavoritesOnly: !prev.showFavoritesOnly }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        filters.showFavoritesOnly
                          ? (isDarkTheme 
                              ? 'bg-warm-gold-500 border-warm-gold-400 text-rich-brown-900'
                              : 'bg-pink-100 border-pink-300 text-pink-900')
                          : (isDarkTheme 
                              ? 'bg-rich-brown-700 border-rich-brown-600 text-rich-brown-200 hover:bg-rich-brown-600'
                              : 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50')
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Heart className={`h-4 w-4 ${filters.showFavoritesOnly ? 'fill-current' : ''}`} />
                      Sadece Favoriler
                    </motion.button>
                  </div>
                </div>

                {/* Clear Filters */}
                {(filters.selectedSentiment || filters.selectedTags.length > 0 || filters.showFavoritesOnly) && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        selectedSentiment: '',
                        selectedTags: [],
                        showFavoritesOnly: false
                      }))
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                                  className={`h-64 rounded-xl border backdrop-blur-sm animate-pulse transition-all duration-700 ${
                  isDarkTheme 
                    ? 'bg-rich-brown-800 border-rich-brown-600' 
                    : 'bg-white/80 border-orange-200'
                }`}
              />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center py-16 rounded-xl border backdrop-blur-sm transition-all duration-700 ${
              isDarkTheme 
                ? 'bg-rich-brown-800 border-rich-brown-600' 
                : 'bg-white/80 border-orange-200'
            }`}
          >
            <BookOpen size={64} className={`mx-auto mb-4 transition-colors duration-700 ${
              isDarkTheme ? 'text-warm-gold-500' : 'text-amber-500'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
            }`}>
              Günce yazısı bulunamadı
            </h3>
            <p className={`transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
            }`}>
              {filters.searchTerm || filters.selectedSentiment || filters.selectedTags.length > 0 
                                  ? 'Arama kriterlerinize uygun günce yazısı bulunamadı.'
                  : 'Henüz hiç günce yazısı eklenmemiş.'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => handleEntryClick(entry.id)}
                  className={`group cursor-pointer rounded-xl border backdrop-blur-sm p-6 shadow-lg transition-all duration-700 ${
                    isDarkTheme 
                      ? 'bg-rich-brown-800 border-rich-brown-600 hover:bg-rich-brown-700 hover:border-rich-brown-500' 
                      : 'bg-white/80 border-orange-200 hover:bg-white hover:border-orange-300'
                  }`}
                >
                  {/* Entry Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getSentimentEmoji(entry.sentiment)}</span>
                      <Calendar size={16} className={`transition-colors duration-700 ${
                        isDarkTheme ? 'text-warm-gold-400' : 'text-amber-500'
                      }`} />
                      <span className={`text-sm transition-colors duration-700 ${
                        isDarkTheme ? 'text-warm-gold-400' : 'text-amber-600'
                      }`}>
                        {formatDate(entry.entry_date)}
                      </span>
                    </div>
                    
                    {entry.is_favorite && (
                      <Heart size={16} className="text-red-500 fill-current" />
                    )}
                  </div>

                  {/* Entry Title */}
                  <h3 className={`font-semibold text-lg mb-3 line-clamp-2 transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                  }`}>
                    {entry.title}
                  </h3>

                  {/* Entry Content Preview */}
                  <p className={`text-sm leading-relaxed mb-4 line-clamp-3 transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-300' : 'text-amber-700'
                  }`}>
                    {entry.content}
                  </p>

                  {/* Entry Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags?.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-xs rounded-md transition-all duration-700 ${
                          isDarkTheme 
                            ? 'bg-rich-brown-600 text-warm-gold-400' 
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Entry Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`flex items-center space-x-1 transition-colors duration-700 ${
                        isDarkTheme ? 'text-warm-gold-400' : 'text-amber-600'
                      }`}>
                        <Eye size={14} />
                        <span>{entry.word_count || 0} kelime</span>
                      </span>
                    </div>
                    
                    <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 ${
                      isDarkTheme ? 'text-warm-gold-400' : 'text-amber-700'
                    }`} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryList;

// Geçici export - gelecekte kullanılacak
export { DiaryList }; 