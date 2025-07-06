import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  PenTool, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Star,
  AlertTriangle
} from "lucide-react";
import { 
  format, 
  startOfToday, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay,
  parseISO
} from "date-fns";
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { apiService, type DiaryEntry } from '../services/api';
import { logger } from '../utils/logger';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface DashboardStats {
  total_entries: number;
  total_words: number;
  favorite_entries: number;
}

function Dashboard() {
  const navigate = useNavigate();
  const { isDarkTheme } = useTheme();
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;

  // ==========================================
  // DATA FETCHING with React Query
  // ==========================================
  const { 
    data: stats, 
    isLoading: isLoadingStats, 
    isError: isErrorStats, 
    error: errorStats 
  } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: () => apiService.getStats(),
    retry: 1, // Hata durumunda 1 kez daha dene
  });

  // Query for paginated entries for the "Recent Entries" list
  const { 
    data: paginatedData, 
    isLoading: isLoadingPaginatedEntries,
    isError: isErrorPaginated,
    error: errorPaginated
  } = useQuery({
    queryKey: ['paginatedEntries', currentPage, entriesPerPage],
    queryFn: () => apiService.getEntries({ page: currentPage, limit: entriesPerPage }),
    placeholderData: (previousData) => previousData,
    retry: 1,
  });
  
  // This query can be kept for the calendar view, or optimized later
  const { 
    data: allEntries, 
    isLoading: isLoadingAllEntries,
    isError: isErrorAllEntries,
    error: errorAllEntries
  } = useQuery<any>({
    queryKey: ['allEntriesForCalendar'],
    queryFn: () => apiService.getEntries({ limit: 1000 }), // Limit to prevent crash, calendar can be optimized later
    retry: 1,
  });
  
  const loading = isLoadingStats || isLoadingPaginatedEntries || isLoadingAllEntries;
  const isError = isErrorStats || isErrorPaginated || isErrorAllEntries;
  
  // Hata mesajlarını birleştir
  const errorMessages = [errorStats, errorPaginated, errorAllEntries]
    .filter(Boolean)
    .map(e => (e as Error).message)
    .join('; ');

  const recentEntries = paginatedData?.data ?? [];
  const totalEntries = paginatedData?.totalCount ?? 0;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;

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
    return new Date(); // Fallback
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "very_positive": return "bg-emerald-500";
      case "positive": return "bg-green-500";
      case "neutral": return "bg-gray-500";
      case "negative": return "bg-orange-500";
      case "very_negative": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  const getSentimentEmoji = (sentiment?: string) => {
    switch (sentiment) {
      case "very_positive": return "😊";
      case "positive": return "🙂";
      case "neutral": return "😐";
      case "negative": return "😔";
      case "very_negative": return "😢";
      default: return "📝";
    }
  };

  const hasEntryOnDate = (date: Date) => {
    return allEntries?.data?.some((entry: DiaryEntry) => {
      try {
        return isSameDay(parseEntryDate(entry.entry_date), date);
      } catch (error) {
        logger.warn('Date parsing error:', { date: entry.entry_date, error });
        return false;
      }
    });
  };

  const handleNewEntry = () => {
    navigate('/new');
  };

  const handleEntryClick = (entryId: string) => {
    navigate(`/entries/${entryId}`);
  };

  if (loading) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4`}>
        <div className="text-center">
          <BookOpen className={`h-12 w-12 animate-pulse mx-auto mb-4 text-amber-600`} />
          <p className={`font-medium text-amber-800`}>
            Günce defteri yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4 ${isDarkTheme ? 'bg-rich-brown-900' : 'bg-red-50'}`}>
        <div className="text-center p-8 rounded-lg border-2 border-dashed border-red-400 dark:border-red-600">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Bir Hata Oluştu</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">
            Veriler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            Hata Detayı: {errorMessages}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-full relative transition-all duration-700 ${
      isDarkTheme 
        ? 'bg-rich-brown-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`}>
      <div className="relative z-10 w-full max-w-full px-4 py-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className={`relative rounded-lg p-4 sm:p-6 lg:p-8 shadow-2xl border-4 transition-all duration-700 ${
            isDarkTheme 
              ? 'bg-gradient-to-r from-rich-brown-800 via-rich-brown-700 to-rich-brown-800 border-rich-brown-600' 
              : 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 border-amber-600'
          }`}>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                <div>
                  <h1 className={`text-2xl sm:text-3xl font-bold font-serif transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-200' : 'text-amber-100'
                  }`}>
                    Günce Defteri
                  </h1>
                  <p className={`text-sm sm:text-base mt-1 transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-300' : 'text-amber-200'
                  }`}>
                    {format(today, "d MMMM yyyy, eeee", { locale: tr })}
                  </p>
                </div>
                <button
                  onClick={handleNewEntry}
                  className={`mt-3 sm:mt-0 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                    isDarkTheme 
                      ? 'bg-warm-gold-500 hover:bg-warm-gold-400 text-rich-brown-900' 
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                  }`}
                >
                  <PenTool className="h-4 w-4" />
                  <span>Yeni Kayıt</span>
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 text-center">
                <div className="flex items-center">
                  <span className={`text-sm sm:text-base transition-colors duration-700 ${isDarkTheme ? 'text-amber-300' : 'text-amber-200'}`}>Toplam Kayıt:</span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${isDarkTheme ? 'text-amber-200' : 'text-amber-200'}`}>{stats?.total_entries || 0}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm sm:text-base transition-colors duration-700 ${isDarkTheme ? 'text-amber-300' : 'text-amber-200'}`}>Toplam Kelime:</span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${isDarkTheme ? 'text-amber-200' : 'text-amber-200'}`}>{stats?.total_words || 0}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm sm:text-base transition-colors duration-700 ${isDarkTheme ? 'text-amber-300' : 'text-amber-200'}`}>Favoriler:</span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${isDarkTheme ? 'text-amber-200' : 'text-amber-200'}`}>{stats?.favorite_entries || 0}</span>
                </div>
                 <div className="flex items-center">
                   <span className={`text-sm sm:text-base transition-colors duration-700 ${isDarkTheme ? 'text-amber-300' : 'text-amber-200'}`}>Yazma Serisi:</span>
                   <span className={`font-bold text-lg transition-colors duration-700 ${isDarkTheme ? 'text-amber-200' : 'text-amber-200'}`}>-</span>
                 </div>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className={`p-4 sm:p-6 rounded-lg shadow-lg h-full transition-all duration-700 ${isDarkTheme ? 'bg-rich-brown-800 border border-rich-brown-700' : 'bg-white/70 border border-amber-200/50'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5" /><span>Son Kayıtlar</span></h2>
                
                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-amber-200/50 hover:bg-amber-200 dark:bg-rich-brown-700/50 dark:hover:bg-rich-brown-700"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-amber-200/50 hover:bg-amber-200 dark:bg-rich-brown-700/50 dark:hover:bg-rich-brown-700"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {recentEntries.length > 0 ? (
                    recentEntries.map((entry: DiaryEntry, index: number) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleEntryClick(entry.id)}
                        className={`p-3 sm:p-4 rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] ${isDarkTheme ? 'bg-gradient-to-r from-rich-brown-700 to-rich-brown-600 border-rich-brown-500' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold truncate transition-colors duration-700 ${isDarkTheme ? 'text-neutral-100' : 'text-amber-900'}`}>{entry.title}</h3>
                              {entry.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
                            </div>
                            <p className={`text-sm mb-2 line-clamp-2 transition-colors duration-700 ${isDarkTheme ? 'text-neutral-300' : 'text-amber-700'}`}>{entry.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <p className={`transition-colors duration-700 ${isDarkTheme ? 'text-rich-brown-300' : 'text-amber-600'}`}>
                                {format(parseEntryDate(entry.entry_date), "dd MMM yyyy", { locale: tr })}
                              </p>
                              {entry.word_count && (<span className={`transition-colors duration-700 ${isDarkTheme ? 'text-rich-brown-300' : 'text-amber-600'}`}>{entry.word_count} kelime</span>)}
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2 ml-3 flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full ${getSentimentColor(entry.sentiment)}`}></div>
                            <span className="text-lg">{getSentimentEmoji(entry.sentiment)}</span>
                          </div>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                              <span
                                key={tagIndex}
                                className={`text-xs px-2 py-1 rounded-full transition-colors duration-700 ${isDarkTheme ? 'bg-rich-brown-600 text-warm-gold-400' : 'bg-amber-200 text-amber-800'}`}>{tag}</span>
                            ))}
                            {entry.tags.length > 3 && (<span className={`text-xs transition-colors duration-700 ${isDarkTheme ? 'text-rich-brown-300' : 'text-amber-600'}`}>+{entry.tags.length - 3}</span>)}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className={`h-12 w-12 mx-auto mb-4 transition-colors duration-700 ${isDarkTheme ? 'text-warm-gold-500' : 'text-amber-400'}`} />
                      <p className={`mb-4 transition-colors duration-700 ${isDarkTheme ? 'text-rich-brown-200' : 'text-amber-600'}`}>Henüz günce yazınız yok</p>
                      <button onClick={handleNewEntry} className={`px-6 py-2 rounded-lg transition-all duration-300 ${isDarkTheme ? 'bg-warm-gold-500 hover:bg-warm-gold-400 text-rich-brown-900' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>İlk Yazınızı Oluşturun</button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className={`p-4 sm:p-6 rounded-lg shadow-lg h-full transition-all duration-700 ${isDarkTheme ? 'bg-rich-brown-800 border border-rich-brown-700' : 'bg-white/70 border border-amber-200/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={previousMonth} className="p-2 rounded-full hover:bg-black/10 transition-colors"><ChevronLeft /></button>
                <h2 className="text-xl font-bold text-center">{format(currentMonth, 'MMMM yyyy', { locale: tr })}</h2>
                <button onClick={nextMonth} className="p-2 rounded-full hover:bg-black/10 transition-colors"><ChevronRight /></button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs sm:text-sm">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <div key={day} className={`font-bold ${isDarkTheme ? 'text-rich-brown-300' : 'text-amber-600'}`}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {calendarDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isCurrentDay = isToday(day);
                  const hasEntry = hasEntryOnDate(day);
                  return (
                    <div key={day.toString()} className={cn("flex items-center justify-center h-9 sm:h-10 rounded-full text-sm", !isCurrentMonth && "text-gray-400", isCurrentDay && "bg-amber-500 text-white font-bold", hasEntry && "bg-green-500/50 border-green-700")}>
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          const entryId = allEntries?.data?.find((e: DiaryEntry) => isSameDay(parseEntryDate(e.entry_date), day))?.id;
                          if (entryId) {
                            handleEntryClick(entryId);
                          }
                        }}
                        className={cn("w-full h-full rounded-full transition-colors", hasEntry && "hover:bg-green-600/50")}
                      >
                        {format(day, 'd')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 