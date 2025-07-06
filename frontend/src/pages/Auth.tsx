// ==========================================
// GÜNCE DEFTERI - Authentication Page (Context7 Uyumlu)
// Google Auth + Email/Password integration
// ==========================================

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'

interface FormData {
  email: string
  password: string
  fullName: string
}

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    fullName: ''
  })

  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(formData.email, formData.password, formData.fullName)
        if (error) {
          setError(error)
        } else {
          setError(null)
          // You could show a success message here
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4"
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-2xl font-bold text-slate-900 shadow-lg">
              📖
            </div>
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Günce Defteri
          </h1>
          <p className="text-slate-400">
            {isSignUp ? 'Hesap oluşturun ve yazmaya başlayın' : 'Hoş geldiniz! Giriş yapın'}
          </p>
        </div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-slate-700/50"
        >
          {/* Google Auth Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full mb-6 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800 px-3 text-slate-400">veya</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors"
                  placeholder="Adınız ve soyadınız"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                E-posta
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors"
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
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
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-colors"
                placeholder="En az 6 karakter"
              />
            </div>

            {error && (
              <motion.div
                id="auth-error-message"
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                setFormData({ email: '', password: '', fullName: '' })
              }}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              {isSignUp 
                ? 'Zaten hesabınız var mı? Giriş yapın' 
                : 'Hesabınız yok mu? Kayıt olun'
              }
            </button>
          </div>

          <div className="text-sm">
            <Link
              to="/auth/request-reset"
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Şifrenizi mi unuttunuz?
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-8 text-slate-500 text-sm"
        >
          Context7 dokümantasyonuna uygun multi-platform sync
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AuthPage 