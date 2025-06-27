import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  PenTool, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  TrendingUp,
  Heart,
  Star
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
import { useTheme } from '../contexts/ThemeContext'
import { apiService, type DiaryEntry } from '../services/api';
import { logger } from '../utils/logger';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Using DiaryEntry from api.ts instead of local interface

interface DashboardStats {
  totalEntries: number;
  thisMonthEntries: number;
  favoriteEntries: number;
  averageWordsPerEntry: number;
  currentStreak: number;
}

function Dashboard() {
  const navigate = useNavigate();
  const { isDarkTheme, colors } = useTheme();
  const today = startOfToday();
  const [, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEntries: 0,
    thisMonthEntries: 0,
    favoriteEntries: 0,
    averageWordsPerEntry: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);

  // Verileri yükle
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // API Service kullanımı (dual mode: Electron + Web + Offline)
      const storedEntries = await apiService.getEntries();
      logger.success(`Dashboard data loaded (${apiService.mode}): ${storedEntries.length} entries`);
      
      setEntries(storedEntries);
      
      // İstatistikleri hesapla
      calculateStats(storedEntries);
      
    } catch (error) {
      logger.error('Dashboard data loading error:', error);
      setEntries([]);
      calculateStats([]);
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
      // ISO string formatında mı kontrol et
      if (dateValue.includes('T') || dateValue.includes('-')) {
        return parseISO(dateValue);
      }
      // Başka format deneyebiliriz
      return new Date(dateValue);
    }
    return new Date(); // Fallback
  };

  const calculateStats = (entriesData: DiaryEntry[]) => {
    // Safe array check
    if (!Array.isArray(entriesData) || entriesData.length === 0) {
      setStats({
        totalEntries: 0,
        thisMonthEntries: 0,
        favoriteEntries: 0,
        averageWordsPerEntry: 0,
        currentStreak: 0
      });
      return;
    }

    const thisMonth = entriesData.filter(entry => {
      try {
        const entryDate = parseEntryDate(entry.entry_date);
        return isSameMonth(entryDate, today);
      } catch (error) {
        logger.warn('Date parsing error:', { date: entry.entry_date, error });
        return false;
      }
    });
    
    const favoriteCount = entriesData.filter(entry => entry.is_favorite).length;
    
    const totalWords = entriesData.reduce((sum, entry) => sum + (entry.word_count || 0), 0);
    const avgWords = entriesData.length > 0 ? Math.round(totalWords / entriesData.length) : 0;

    setStats({
      totalEntries: entriesData.length,
      thisMonthEntries: thisMonth.length,
      favoriteEntries: favoriteCount,
      averageWordsPerEntry: avgWords,
      currentStreak: 5 // Bu değer daha karmaşık bir hesaplama gerektirir
    });
  };

  const recentEntries = entries.slice(0, 5);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
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
    return entries.some(entry => {
      try {
        const entryDate = parseEntryDate(entry.entry_date);
        return isSameDay(entryDate, date);
      } catch (error) {
        logger.warn('Date parsing error:', { date: entry.entry_date, error });
        return false;
      }
    });
  };

  const handleNewEntry = () => {
    navigate('/new-entry');
  };

  const handleEntryClick = (entryId: string) => {
    navigate(`/entry/${entryId}`);
  };

  if (loading) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4 transition-all duration-700 ${
        isDarkTheme 
          ? `bg-${colors.background}` 
          : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
      }`}>
        <div className="text-center">
          <BookOpen className={`h-12 w-12 animate-pulse mx-auto mb-4 transition-colors duration-700 ${
            isDarkTheme ? `text-${colors.accent}` : 'text-amber-600'
          }`} />
          <p className={`font-medium transition-colors duration-700 ${
            isDarkTheme ? 'text-amber-200' : 'text-amber-800'
          }`}>
            Günce defteri yükleniyor...
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
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='13' cy='43' r='1'/%3E%3Ccircle cx='47' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Header with vintage book cover design */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8 snap-section"
        >
          <div className={`relative rounded-lg p-4 sm:p-6 lg:p-8 shadow-2xl border-4 transition-all duration-700 ${
            isDarkTheme 
              ? 'bg-gradient-to-r from-rich-brown-800 via-rich-brown-700 to-rich-brown-800 border-rich-brown-600' 
              : 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 border-amber-600'
          }`}>
            {/* Book spine effect */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 sm:w-4 rounded-l-lg transition-all duration-700 ${
              isDarkTheme 
                ? 'bg-gradient-to-b from-rich-brown-800 to-rich-brown-900' 
                : 'bg-gradient-to-b from-amber-900 to-amber-800'
            }`}></div>
            
            {/* Decorative corners */}
            <div className={`absolute top-2 left-4 sm:left-6 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-700 ${
              isDarkTheme ? 'border-warm-gold-500' : 'border-amber-400'
            }`}></div>
            <div className={`absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-700 ${
              isDarkTheme ? 'border-warm-gold-500' : 'border-amber-400'
            }`}></div>
            <div className={`absolute bottom-2 left-4 sm:left-6 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-700 ${
              isDarkTheme ? 'border-warm-gold-500' : 'border-amber-400'
            }`}></div>
            <div className={`absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 rounded-br-lg transition-colors duration-700 ${
              isDarkTheme ? 'border-warm-gold-500' : 'border-amber-400'
            }`}></div>

            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-amber-100'
            }`}>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <BookOpen className={`h-8 w-8 sm:h-12 sm:w-12 flex-shrink-0 transition-colors duration-700 ${
                  isDarkTheme ? 'text-warm-gold-500' : 'text-amber-200'
                }`} />
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif tracking-wide">Günce Defterim</h1>
                  <p className={`font-medium text-sm sm:text-base transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-300' : 'text-amber-200'
                  }`}>
                    Anılarınızı kaydedin, düşüncelerinizi paylaşın
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className={`text-sm font-medium transition-colors duration-700 ${
                  isDarkTheme ? 'text-amber-300' : 'text-amber-200'
                }`}>
                  {format(today, "dd MMMM yyyy", { locale: tr })}
                </p>
                <p className={`text-xs transition-colors duration-700 ${
                  isDarkTheme ? 'text-amber-400' : 'text-amber-300'
                }`}>
                  Bugün
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mobile: Calendar first, then content */}
        {/* Desktop: Content left, calendar right */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sidebar - Mobile'da üstte, Desktop'ta sağda */}
          <div className="order-1 lg:order-2 lg:col-span-1 space-y-6">
            {/* Mini Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`backdrop-blur-sm rounded-lg shadow-lg border p-4 sm:p-6 transition-all duration-700 snap-section ${
                isDarkTheme 
                  ? 'bg-rich-brown-800 border-rich-brown-600' 
                  : 'bg-white/80 border-amber-200'
              }`}
            >
              <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
              }`}>
                <CalendarIcon className="mr-2 h-5 w-5" />
                {format(currentMonth, "MMMM yyyy", { locale: tr })}
              </h2>
              
              {/* Calendar Header Controls */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={previousMonth}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    isDarkTheme 
                      ? 'hover:bg-amber-900 text-amber-300 hover:text-amber-200' 
                      : 'hover:bg-amber-100 text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className={`font-medium transition-colors duration-700 ${
                  isDarkTheme ? 'text-amber-200' : 'text-amber-900'
                }`}>
                  {format(currentMonth, "MMMM yyyy", { locale: tr })}
                </span>
                <button
                  onClick={nextMonth}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    isDarkTheme 
                      ? 'hover:bg-amber-900 text-amber-300 hover:text-amber-200' 
                      : 'hover:bg-amber-100 text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm">
                {/* Week Headers */}
                {['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'].map((day) => (
                  <div key={day} className={`p-2 font-medium transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  const hasEntry = hasEntryOnDate(day);
                  const isCurrentDay = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-2 rounded-lg cursor-pointer transition-all duration-200 relative",
                        isCurrentDay && (isDarkTheme 
                          ? "bg-amber-700 text-white font-bold shadow-md" 
                          : "bg-amber-600 text-white font-bold shadow-md"
                        ),
                        !isCurrentDay && isCurrentMonth && (isDarkTheme 
                          ? "hover:bg-amber-900 text-amber-200" 
                          : "hover:bg-amber-100 text-amber-900"
                        ),
                        !isCurrentMonth && (isDarkTheme 
                          ? "text-amber-600" 
                          : "text-amber-400"
                        ),
                        hasEntry && !isCurrentDay && (isDarkTheme 
                          ? "bg-amber-800 text-amber-100 font-medium" 
                          : "bg-amber-200 text-amber-900 font-medium"
                        )
                      )}
                      onClick={() => setSelectedDate(day)}
                    >
                      {format(day, 'd')}
                      {hasEntry && (
                        <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
                          isDarkTheme ? 'bg-amber-500' : 'bg-amber-600'
                        }`}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`backdrop-blur-sm rounded-lg shadow-lg border p-4 sm:p-6 transition-all duration-700 ${
                isDarkTheme 
                  ? 'bg-rich-brown-800 border-rich-brown-600' 
                  : 'bg-white/80 border-amber-200'
              }`}
            >
              <h2 className={`text-xl font-bold mb-4 flex items-center transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
              }`}>
                <TrendingUp className="mr-2 h-5 w-5" />
                İstatistikler
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    Toplam Yazı:
                  </span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-200' : 'text-amber-900'
                  }`}>
                    {stats.totalEntries}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    Bu Ay:
                  </span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-200' : 'text-amber-900'
                  }`}>
                    {stats.thisMonthEntries}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base flex items-center transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    <Heart className="mr-1 h-4 w-4" />
                    Favori Yazılar:
                  </span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-200' : 'text-amber-900'
                  }`}>
                    {stats.favoriteEntries}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    Yazma Serisi:
                  </span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-200' : 'text-amber-900'
                  }`}>
                    {stats.currentStreak} gün
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-sm sm:text-base transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    Ort. Kelime:
                  </span>
                  <span className={`font-bold text-lg transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-200' : 'text-amber-900'
                  }`}>
                    {stats.averageWordsPerEntry}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Area - Mobile'da altta, Desktop'ta solda */}
          <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
            {/* New Entry Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <button 
                onClick={handleNewEntry}
                className={`w-full h-14 sm:h-16 text-base sm:text-lg font-medium shadow-lg border-2 rounded-lg transition-all duration-200 hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center ${
                  isDarkTheme 
                    ? 'bg-gradient-to-r from-warm-gold-500 to-rich-brown-700 hover:from-warm-gold-400 hover:to-rich-brown-600 border-warm-gold-500 text-rich-brown-900' 
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 border-amber-500 text-white'
                }`}
              >
                <PenTool className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                Yeni Günce Yazısı Yaz
              </button>
            </motion.div>

            {/* Recent Entries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`backdrop-blur-sm rounded-lg shadow-lg border p-4 sm:p-6 transition-all duration-700 ${
                isDarkTheme 
                  ? 'bg-rich-brown-800 border-rich-brown-600' 
                  : 'bg-white/80 border-amber-200'
              }`}
            >
              <h2 className={`text-xl sm:text-2xl font-bold mb-4 flex items-center transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
              }`}>
                <Clock className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                Son Günceler
              </h2>
              <div className="space-y-4">
                <AnimatePresence>
                  {recentEntries.length > 0 ? (
                    recentEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleEntryClick(entry.id)}
                        className={`p-3 sm:p-4 rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                          isDarkTheme 
                            ? 'bg-gradient-to-r from-rich-brown-700 to-rich-brown-600 border-rich-brown-500' 
                            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-semibold truncate transition-colors duration-700 ${
                                isDarkTheme ? 'text-neutral-100' : 'text-amber-900'
                              }`}>
                                {entry.title}
                              </h3>
                              {entry.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />}
                            </div>
                            <p className={`text-sm mb-2 line-clamp-2 transition-colors duration-700 ${
                              isDarkTheme ? 'text-neutral-300' : 'text-amber-700'
                            }`}>
                              {entry.content}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <p className={`transition-colors duration-700 ${
                                isDarkTheme ? 'text-rich-brown-300' : 'text-amber-600'
                              }`}>
                                {(() => {
                                  try {
                                    const entryDate = parseEntryDate(entry.entry_date);
                                    return format(entryDate, "dd MMM yyyy", { locale: tr });
                                  } catch {
                                    return "Tarih bilinmiyor";
                                  }
                                })()}
                              </p>
                              {entry.word_count && (
                                <span className={`transition-colors duration-700 ${
                                  isDarkTheme ? 'text-rich-brown-300' : 'text-amber-600'
                                }`}>
                                  {entry.word_count} kelime
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-2 ml-3 flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full ${getSentimentColor(entry.sentiment)}`}></div>
                            <span className="text-lg">{getSentimentEmoji(entry.sentiment)}</span>
                          </div>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span 
                                key={tagIndex}
                                className={`text-xs px-2 py-1 rounded-full transition-colors duration-700 ${
                                  isDarkTheme 
                                    ? 'bg-rich-brown-600 text-warm-gold-400' 
                                    : 'bg-amber-200 text-amber-800'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 3 && (
                              <span className={`text-xs transition-colors duration-700 ${
                                isDarkTheme ? 'text-rich-brown-300' : 'text-amber-600'
                              }`}>
                                +{entry.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className={`h-12 w-12 mx-auto mb-4 transition-colors duration-700 ${
                        isDarkTheme ? 'text-warm-gold-500' : 'text-amber-400'
                      }`} />
                      <p className={`mb-4 transition-colors duration-700 ${
                        isDarkTheme ? 'text-rich-brown-200' : 'text-amber-600'
                      }`}>
                        Henüz günce yazınız yok
                      </p>
                      <button 
                        onClick={handleNewEntry}
                        className={`px-6 py-2 rounded-lg transition-all duration-300 ${
                          isDarkTheme 
                            ? 'bg-warm-gold-500 hover:bg-warm-gold-400 text-rich-brown-900' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        İlk Yazınızı Oluşturun
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 