import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { BarChart, Book, Bot, Calendar, Heart, MessageSquare, Tag, AlertTriangle } from 'lucide-react';

// Define the structure of the stats object from the API
interface StatData {
  totalEntries: number;
  favoriteEntries: number;
  totalWords: number;
  averageWords: number;
  longestStreak: number;
  currentStreak: number;
  tagDistribution?: { [key: string]: number };
  sentimentDistribution: { [key: string]: number };
  activityByDay?: { [key: string]: number };
}

// Reusable Stat Card Component
const StatCard = ({ icon, title, value, unit, delay }: { icon: React.ReactNode, title: string, value: string | number, unit?: string, delay: number }) => {
  const { isDarkTheme } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className={`p-6 rounded-2xl shadow-lg transition-all duration-500 ${isDarkTheme ? 'bg-rich-brown-800/90 border border-rich-brown-700' : 'bg-white/80 border border-amber-200/50'}`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-3 rounded-full ${isDarkTheme ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
          {icon}
        </div>
        <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-rich-brown-200' : 'text-amber-800'}`}>{title}</h3>
      </div>
      <p className={`text-4xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>{value} <span className="text-xl font-medium text-gray-500">{unit}</span></p>
    </motion.div>
  );
};

// Bar for distribution charts
const DistributionBar = ({ label, value, color, icon }: { label: string, value: number, color: string, icon: string }) => {
    return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold">{value}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-rich-brown-700 rounded-full h-2.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-2.5 rounded-full ${color}`}
          />
        </div>
      </div>
    </div>
  );
};

const Statistics: React.FC = () => {
  const { isDarkTheme } = useTheme();
  const { data: stats, isLoading, error } = useQuery<StatData>({
    queryKey: ['statistics'],
    queryFn: () => apiService.getStats(),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4 ${isDarkTheme ? 'bg-rich-brown-900' : 'bg-amber-50'}`}>
        <div className="text-center">
          <BarChart className={`h-12 w-12 animate-pulse mx-auto mb-4 ${isDarkTheme ? 'text-amber-400' : 'text-amber-600'}`} />
          <p className={`font-medium ${isDarkTheme ? 'text-rich-brown-200' : 'text-amber-800'}`}>
            İstatistikler yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`w-full min-h-full flex items-center justify-center p-4 ${isDarkTheme ? 'bg-rich-brown-900' : 'bg-red-50'}`}>
        <div className="text-center p-8 rounded-lg border-2 border-dashed border-red-400 dark:border-red-600">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">İstatistikler Yüklenemedi</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">
            İstatistik verileri alınırken bir sorun oluştu.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
            Hata: {(error as Error)?.message || 'Bilinmeyen bir hata oluştu.'}
          </p>
        </div>
      </div>
    );
  }

  const sentimentColors: { [key: string]: string } = {
    positive: 'bg-green-500',
    very_positive: 'bg-emerald-500',
    neutral: 'bg-gray-500',
    negative: 'bg-orange-500',
    very_negative: 'bg-red-500',
  };

  const sentimentIcons: { [key: string]: string } = {
    positive: '🙂',
    very_positive: '😊',
    neutral: '😐',
    negative: '😔',
    very_negative: '😢',
  };
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-serif font-bold text-center mb-10 text-orange-900 dark:text-rich-brown-100">
        İstatistikler
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={<Book size={24} />} title="Toplam Kayıt" value={stats.totalEntries} delay={1} />
        <StatCard icon={<MessageSquare size={24} />} title="Toplam Kelime" value={stats.totalWords.toLocaleString()} delay={2} />
        <StatCard icon={<Heart size={24} />} title="Favori Kayıtlar" value={stats.favoriteEntries} delay={3} />
        <StatCard icon={<Bot size={24} />} title="Ortalama Kelime" value={stats.averageWords} unit="kelime/kayıt" delay={4} />
        <StatCard icon={<Calendar size={24} />} title="En Uzun Seri" value={stats.longestStreak} unit="gün" delay={5} />
        <StatCard icon={<Calendar size={24} />} title="Mevcut Seri" value={stats.currentStreak} unit="gün" delay={6} />

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`p-6 rounded-2xl shadow-lg lg:col-span-2 ${isDarkTheme ? 'bg-rich-brown-800/90 border-rich-brown-700' : 'bg-white/80 border-amber-200/50'}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart size={22} />Duygu Dağılımı</h3>
            <div className="space-y-3">
              {Object.entries(stats.sentimentDistribution).map(([sentiment, value]) => (
                <DistributionBar key={sentiment} label={sentiment} value={value} color={sentimentColors[sentiment] || 'bg-gray-400'} icon={sentimentIcons[sentiment] || '📝'} />
              ))}
            </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={`p-6 rounded-2xl shadow-lg ${isDarkTheme ? 'bg-rich-brown-800/90 border-rich-brown-700' : 'bg-white/80 border-amber-200/50'}`}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Tag size={22} />En Popüler Etiketler</h3>
            <div className="space-y-3">
              {(stats.tagDistribution && Object.keys(stats.tagDistribution).length > 0) ? (
                Object.entries(stats.tagDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([tag, count]) => (
                    <div key={tag} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-amber-800 dark:text-amber-300">{tag}</span>
                      <span className="font-bold px-2 py-0.5 bg-amber-200 dark:bg-rich-brown-700 rounded-full">{count}</span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Henüz hiç etiket eklenmemiş.</p>
              )}
            </div>
            </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className={`p-6 rounded-2xl shadow-lg lg:col-span-3 ${isDarkTheme ? 'bg-rich-brown-800/90 border-rich-brown-700' : 'bg-white/80 border-amber-200/50'}`}>
            <h3 className="text-xl font-bold mb-4">Haftalık Aktivite</h3>
             <div className="flex justify-between items-end gap-2 h-40">
                {(() => {
                  const maxActivity = Math.max(...Object.values(stats.activityByDay || {}), 0);
                  return weekdays.map(day => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${maxActivity > 0 ? (stats.activityByDay[day] || 0) / maxActivity * 100 : 0}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="w-full bg-gradient-to-t from-amber-400 to-orange-500 rounded-t-lg"
                          />
                          <span className="text-xs font-medium">{day.substring(0, 3)}</span>
                      </div>
                  ));
                })()}
            </div>
          </motion.div>
      </div>
    </div>
  );
};

export default Statistics; 