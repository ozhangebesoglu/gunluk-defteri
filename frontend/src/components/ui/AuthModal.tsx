// ==========================================
// GÜNCE DEFTERI - Auth Modal Component
// Modern pop-up authentication modal
// ==========================================

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  email: string
  password: string
  fullName: string
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    fullName: ''
  })

  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth()

  // Auto close when user is authenticated
  useEffect(() => {
    if (user) {
      onClose()
    }
  }, [user, onClose])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
    setSuccess(null)
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error)
      }
    } catch (err) {
      setError('Google ile giriş yaparken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Demo kullanıcı bilgileri
      const { error } = await signInWithEmail('demo@guncedefteri.com', 'demo123')
      if (error) {
        setError('Demo hesabı henüz oluşturulmamış. Lütfen kayıt olun.')
      }
    } catch (err) {
      setError('Demo giriş yaparken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(formData.email, formData.password, formData.fullName)
        if (error) {
          setError(error)
        } else {
          setSuccess('Hesabınız oluşturuldu! Email adresinizi doğrulayın.')
        }
      } else {
        const { error } = await signInWithEmail(formData.email, formData.password)
        if (error) {
          setError(error)
        }
      }
    } catch (err) {
      setError('Giriş yaparken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-slate-700/50">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-xl font-bold text-slate-900 shadow-lg mb-3">
                  📖
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Günce Defteri
                </h2>
                <p className="text-slate-400 text-sm">
                  {isSignUp ? 'Hesap oluşturun ve yazmaya başlayın' : 'Hoş geldiniz! Giriş yapın'}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Google Auth Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full mb-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <LoadingSpinner size="sm" color="secondary" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Google ile {isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</span>
                  </>
                )}
              </motion.button>

              {/* Demo Button */}
              {!isSignUp && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full mb-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <>
                      <span className="text-xl">🎯</span>
                      <span>Demo ile Dene</span>
                    </>
                  )}
                </motion.button>
              )}

              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-900 px-3 text-slate-500">veya</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-2">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    Şifre
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                    placeholder="En az 6 karakter"
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-400 text-sm"
                  >
                    {success}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    <span>{isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}</span>
                  )}
                </motion.button>
              </form>

              {/* Toggle Auth Mode */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError(null)
                    setSuccess(null)
                    setFormData({ email: '', password: '', fullName: '' })
                  }}
                  className="text-amber-400 hover:text-amber-300 text-sm transition-colors font-medium"
                >
                  {isSignUp 
                    ? 'Zaten hesabınız var mı? Giriş yapın' 
                    : 'Hesabınız yok mu? Kayıt olun'
                  }
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700/50">
              <p className="text-center text-slate-500 text-xs">
                Context7 uyumlu multi-platform sync
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal 