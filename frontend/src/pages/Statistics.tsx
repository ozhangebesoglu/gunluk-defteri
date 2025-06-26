import React from 'react'
import { motion } from 'framer-motion'
// import { useNavigate } from 'react-router-dom' // Geçici comment out
import { useTheme } from '../contexts/ThemeContext'

const Statistics: React.FC = () => {
  // const navigate = useNavigate() // Geçici comment out
  const { isDarkTheme } = useTheme()
  
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
              <div className="text-2xl font-bold text-amber-900 mb-1">42</div>
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
              <div className="text-2xl font-bold text-amber-900 mb-1">8</div>
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
              <div className="text-2xl font-bold text-amber-900 mb-1">5</div>
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
              <div className="text-2xl font-bold text-amber-900 mb-1">247</div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">😊</div>
                    <span className="text-amber-800 text-sm sm:text-base">Çok İyi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 sm:w-32 bg-amber-200 rounded-full h-3">
                      <div className="w-12 sm:w-16 bg-green-500 h-3 rounded-full"></div>
                    </div>
                    <span className="text-sm text-amber-700">12</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🙂</div>
                    <span className="text-amber-800 text-sm sm:text-base">İyi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 sm:w-32 bg-amber-200 rounded-full h-3">
                      <div className="w-18 sm:w-24 bg-emerald-500 h-3 rounded-full"></div>
                    </div>
                    <span className="text-sm text-amber-700">18</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">😐</div>
                    <span className="text-amber-800 text-sm sm:text-base">Normal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 sm:w-32 bg-amber-200 rounded-full h-3">
                      <div className="w-8 sm:w-12 bg-gray-500 h-3 rounded-full"></div>
                    </div>
                    <span className="text-sm text-amber-700">8</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">😔</div>
                    <span className="text-amber-800 text-sm sm:text-base">Kötü</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 sm:w-32 bg-amber-200 rounded-full h-3">
                      <div className="w-4 sm:w-6 bg-orange-500 h-3 rounded-full"></div>
                    </div>
                    <span className="text-sm text-amber-700">3</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">😢</div>
                    <span className="text-amber-800 text-sm sm:text-base">Çok Kötü</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 sm:w-32 bg-amber-200 rounded-full h-3">
                      <div className="w-2 sm:w-3 bg-red-500 h-3 rounded-full"></div>
                    </div>
                    <span className="text-sm text-amber-700">1</span>
                  </div>
                </div>
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
                  {Array.from({ length: 30 }, (_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + (i * 0.02) }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm ${
                        Math.random() > 0.3 
                          ? 'bg-amber-400' 
                          : Math.random() > 0.6 
                          ? 'bg-amber-600' 
                          : 'bg-amber-200'
                      }`}
                      title={`Gün ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-amber-700 mt-4">
                  <span>Az</span>
                  <span>Çok</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tags Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/80 backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6"
          >
            <h3 className="text-lg sm:text-xl font-serif font-semibold text-amber-900 mb-4 sm:mb-6">
              En Çok Kullanılan Etiketler
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { name: 'Kişisel', count: 15 },
                { name: 'İş', count: 12 },
                { name: 'Seyahat', count: 8 },
                { name: 'Aile', count: 7 },
                { name: 'Hobiler', count: 6 },
                { name: 'Hedefler', count: 5 },
                { name: 'Düşünceler', count: 4 },
                { name: 'Anılar', count: 3 }
              ].map((tag, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + (index * 0.1) }}
                  className="inline-flex items-center space-x-2 bg-amber-100 text-amber-800 px-3 py-2 rounded-full text-sm font-medium hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  <span>{tag.name}</span>
                  <span className="bg-amber-300 text-amber-900 px-2 py-1 rounded-full text-xs">
                    {tag.count}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Statistics 