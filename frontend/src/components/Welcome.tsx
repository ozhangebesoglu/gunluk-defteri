// ==========================================
// GÜNCE DEFTERI - Welcome Component
// Landing page with auth trigger
// ==========================================

import React from 'react'
import { motion } from 'framer-motion'

interface WelcomeProps {
  onGetStarted: () => void
}

const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-4xl font-bold text-slate-900 shadow-2xl mb-8">
            📖
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Günce Defteri
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Düşüncelerinizi kaydedin, anılarınızı koruyun ve yaşamınızı organize edin. 
            Modern, güvenli ve senkronize günlük defteri deneyimi.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-xl transition-all duration-300"
          >
            Hemen Başlayın
          </motion.button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-blue-400 text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Güvenli</h3>
            <p className="text-slate-400">
              Verileriniz şifreli olarak saklanır ve sadece sizin erişebileceğiniz şekilde korunur.
            </p>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-green-400 text-2xl">☁️</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Senkronize</h3>
            <p className="text-slate-400">
              Tüm cihazlarınızda günlüklerinize erişin. Notion-style multi-platform sync.
            </p>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-purple-400 text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Analitik</h3>
            <p className="text-slate-400">
              Yazma alışkanlıklarınızı takip edin ve duygusal analiz ile içgörüler elde edin.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-slate-500 text-sm"
        >
          Context7 dokümantasyonuna uygun multi-platform sync
        </motion.div>
      </div>
    </div>
  )
}

export default Welcome 