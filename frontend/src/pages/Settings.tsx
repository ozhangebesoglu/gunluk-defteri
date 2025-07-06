import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Download, 
  Upload, 
  Palette, 
  Database, 
  Trash2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  TestTube,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { logger } from '../utils/logger'
import { apiService } from '../services/api'
import * as Sentry from '@sentry/react';

// Password security utilities
const PASSWORD_SECURITY = {
  minLength: 8,
  maxAttempts: 3,
  lockoutDuration: 300000, // 5 minutes
  strengthChecks: {
    length: (pwd: string) => pwd.length >= 8,
    lowercase: (pwd: string) => /[a-z]/.test(pwd),
    uppercase: (pwd: string) => /[A-Z]/.test(pwd),
    numbers: (pwd: string) => /\d/.test(pwd),
    special: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
  }
}

const checkPasswordStrength = (password: string) => {
  const checks = Object.entries(PASSWORD_SECURITY.strengthChecks).map(([key, check]) => ({
    key,
    passed: check(password)
  }))
  
  const score = checks.filter(c => c.passed).length
  const strength = score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong'
  
  return {
    score,
    strength,
    checks: checks.reduce((acc, c) => ({ ...acc, [c.key]: c.passed }), {}),
    isValid: score >= 3,
    percentage: (score / 5) * 100
  }
}

const checkHTTPSRequirement = () => {
  const isHTTPS = window.location.protocol === 'https:'
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  return {
    isSecure: isHTTPS || isLocalhost,
    protocol: window.location.protocol,
    hostname: window.location.hostname
  }
}

const Settings: React.FC = () => {
  const { isDarkTheme, toggleTheme } = useTheme()
  
  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI
  
  // State management
  const [settings, setSettings] = useState({
    notifications: true,
    autoBackup: false,
    passwordProtection: false,
    reminderTime: '19:00',
    dailyReminder: true,
    weekendReminder: false,
    showPassword: false
  })
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Security state
  const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(''))
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([])
  const [passwordAttempts, setPasswordAttempts] = useState(0)
  const [isLockedOut, setIsLockedOut] = useState(false)

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
    checkSecurityRequirements()
  }, [])

  // Password strength checking
  useEffect(() => {
    const strength = checkPasswordStrength(password)
    setPasswordStrength(strength)
  }, [password])

  const checkSecurityRequirements = () => {
    const warnings: string[] = []
    const httpsCheck = checkHTTPSRequirement()
    
    if (!httpsCheck.isSecure) {
      warnings.push(`HTTPS gerekli! Şu anki protokol: ${httpsCheck.protocol}`)
    }
    
    // Check for password attempts in localStorage
    const attempts = parseInt(localStorage.getItem('password_attempts') || '0')
    const lastAttempt = parseInt(localStorage.getItem('last_password_attempt') || '0')
    const now = Date.now()
    
    if (attempts >= PASSWORD_SECURITY.maxAttempts && (now - lastAttempt) < PASSWORD_SECURITY.lockoutDuration) {
      setIsLockedOut(true)
      const remainingTime = Math.ceil((PASSWORD_SECURITY.lockoutDuration - (now - lastAttempt)) / 60000)
      warnings.push(`Çok fazla yanlış deneme! ${remainingTime} dakika bekleyin.`)
    } else if (attempts >= PASSWORD_SECURITY.maxAttempts) {
      // Reset attempts if lockout period expired
      localStorage.removeItem('password_attempts')
      localStorage.removeItem('last_password_attempt')
      setIsLockedOut(false)
    }
    
    setPasswordAttempts(attempts)
    setSecurityWarnings(warnings)
  }

  const loadSettings = async () => {
    try {
      if (isElectron) {
        // Load from Electron
        const electronSettings = await window.electronAPI?.settings.get()
        if (electronSettings) {
          setSettings(prev => ({ ...prev, ...electronSettings }))
        }
      } else {
        // Load from localStorage for web
        const savedSettings = localStorage.getItem('gunce_settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...parsed }))
        }
      }
    } catch (error) {
      logger.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async (newSettings: any) => {
    try {
      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      
      if (isElectron) {
        // Save via Electron API
        await window.electronAPI?.settings.update(newSettings)
      } else {
        // Save to localStorage for web
        localStorage.setItem('gunce_settings', JSON.stringify(updatedSettings))
      }
      
      showMessage('success', 'Ayarlar başarıyla kaydedildi!')
    } catch (error) {
      logger.error('Failed to save settings:', error)
      showMessage('error', 'Ayarlar kaydedilemedi!')
    }
  }

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const recordPasswordAttempt = (success: boolean) => {
    const now = Date.now()
    
    if (success) {
      // Reset attempts on success
      localStorage.removeItem('password_attempts')
      localStorage.removeItem('last_password_attempt')
      setPasswordAttempts(0)
      setIsLockedOut(false)
    } else {
      // Increment attempts on failure
      const newAttempts = passwordAttempts + 1
      localStorage.setItem('password_attempts', newAttempts.toString())
      localStorage.setItem('last_password_attempt', now.toString())
      setPasswordAttempts(newAttempts)
      
      if (newAttempts >= PASSWORD_SECURITY.maxAttempts) {
        setIsLockedOut(true)
        showMessage('error', `Çok fazla yanlış deneme! ${Math.ceil(PASSWORD_SECURITY.lockoutDuration / 60000)} dakika bekleyin.`)
      }
    }
  }

  // Notification settings
  const handleNotificationToggle = async (checked: boolean) => {
    await saveSettings({ notifications: checked })
    
    if (checked) {
      if (isElectron) {
        // Test Electron notification
        try {
          await window.electronAPI?.notification.test()
        } catch (error) {
          logger.error('Electron notification error:', error)
        }
      } else if ('Notification' in window) {
        // Web notification
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification('Günce Bildirimleri', {
            body: 'Artık günce yazma hatırlatmaları alacaksınız!',
            icon: '/book_icon.png'
          })
        }
      }
    }
  }

  // Test notification
  const handleTestNotification = async () => {
    if (isElectron) {
      try {
        await window.electronAPI?.notification.test()
        showMessage('success', 'Test bildirimi gönderildi!')
      } catch (error) {
        showMessage('error', 'Bildirim gönderilemedi!')
      }
    } else {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🔔 Test Bildirimi', {
          body: 'Bildirim sistemi çalışıyor! Günce yazmayı unutmayın.',
          icon: '/book_icon.png'
        })
        showMessage('success', 'Test bildirimi gönderildi!')
      } else {
        showMessage('error', 'Bildirim izni gerekli!')
      }
    }
  }

  // Auto backup
  const handleAutoBackupToggle = async (checked: boolean) => {
    await saveSettings({ autoBackup: checked })
    
    if (checked && isElectron) {
      // Schedule reminders via Electron
      await window.electronAPI?.notification.scheduleReminder()
    }
  }

  // Password protection - ENHANCED SECURITY
  const handlePasswordSetup = async () => {
    // Security checks
    if (isLockedOut) {
      showMessage('error', 'Çok fazla yanlış deneme! Lütfen bekleyin.')
      return
    }

    const httpsCheck = checkHTTPSRequirement()
    if (!httpsCheck.isSecure) {
      showMessage('error', 'Güvenlik nedeniyle HTTPS bağlantısı gerekli!')
      return
    }

    if (password !== confirmPassword) {
      showMessage('error', 'Şifreler eşleşmiyor!')
      recordPasswordAttempt(false)
      return
    }
    
    if (!passwordStrength.isValid) {
      showMessage('error', `Şifre çok zayıf! En az ${PASSWORD_SECURITY.minLength} karakter ve 3 güvenlik kriteri gerekli.`)
      return
    }

    setIsLoading(true)
    try {
      // Enhanced password validation before sending to backend
      if (password.length < PASSWORD_SECURITY.minLength) {
        throw new Error(`Şifre en az ${PASSWORD_SECURITY.minLength} karakter olmalıdır!`)
      }

      // Log security attempt (without password content)
      logger.info('Password setup attempt', {
        passwordLength: password.length,
        strengthScore: passwordStrength.score,
        https: httpsCheck.isSecure,
        platform: isElectron ? 'electron' : 'web'
      })

      const result = await apiService.updatePassword(password)
      
      if (result.success) {
        await saveSettings({ passwordProtection: true })
        showMessage('success', 'Uygulama şifresi başarıyla ayarlandı!')
        recordPasswordAttempt(true)
      } else {
        showMessage('error', result.error || 'Şifre ayarlanamadı!')
        recordPasswordAttempt(false)
      }
      
      setPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      logger.error('Password setup failed:', error)
      showMessage('error', error.message || 'Şifre ayarlanırken bir hata oluştu.')
      recordPasswordAttempt(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordRemove = async () => {
    if (confirm('Şifre korumasını kaldırmak istediğinizden emin misiniz?')) {
      setIsLoading(true);
      try {
        const result = await apiService.updatePassword(null)
        if (result.success) {
            await saveSettings({ passwordProtection: false })
            showMessage('success', 'Şifre koruması kaldırıldı!')
            recordPasswordAttempt(true)
        } else {
            showMessage('error', result.error || 'Şifre kaldırılamadı!')
        }
      } catch (error: any) {
        showMessage('error', error.message || 'Şifre kaldırılamadı!')
      } finally {
        setIsLoading(false);
      }
    }
  }

  // Backup functions
  const handleExportData = async (silent = false) => {
    setIsLoading(true)
    try {
      let exportData
      let dataStr
      
      if (isElectron) {
        // Use Electron backup API
        exportData = await window.electronAPI?.backup.create()
        dataStr = JSON.stringify(exportData, null, 2)
      } else {
        // Web mode - get entries via API service
        const entries = await apiService.getEntries()
        exportData = {
          entries,
          settings,
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        }
        dataStr = JSON.stringify(exportData, null, 2)
      }

      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `gunce_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (!silent) {
        showMessage('success', 'Yedek başarıyla oluşturuldu!')
      }
    } catch (error) {
      logger.error('Backup error:', error)
      if (!silent) {
        showMessage('error', 'Yedekleme sırasında hata oluştu!')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const text = await file.text()
      const importData = JSON.parse(text)
      
      if (importData.entries && Array.isArray(importData.entries)) {
        if (isElectron) {
          // Use Electron restore API
          await window.electronAPI?.backup.restore(importData)
        } else {
          // Web mode - import via API service
          for (const entry of importData.entries) {
            await apiService.createEntry(entry)
          }
        }
        
        // Import settings
        if (importData.settings) {
          await saveSettings(importData.settings)
        }
        
        showMessage('success', `${importData.entries.length} günce başarıyla içe aktarıldı!`)
        
        // Refresh page to show imported data
        setTimeout(() => window.location.reload(), 2000)
      } else {
        showMessage('error', 'Geçersiz yedek dosyası!')
      }
    } catch (error) {
      logger.error('Import error:', error)
      showMessage('error', 'İçe aktarma sırasında hata oluştu!')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearData = async () => {
    const confirmText = 'TÜM VERİLERİMİ SİL'
    const userInput = prompt(
      `⚠️ UYARI: Bu işlem geri alınamaz!\n\nTüm günce yazılarınız, ayarlarınız ve verileriniz kalıcı olarak silinecek.\n\nDevam etmek için "${confirmText}" yazın:`
    )

    if (userInput === confirmText) {
      setIsLoading(true)
      try {
        // Delete all entries
        await apiService.deleteAllEntries()
        
        if (isElectron) {
          // Clear Electron settings
          await window.electronAPI?.settings.update({
            notifications: true,
            autoBackup: false,
            passwordProtection: false,
            reminderTime: '19:00',
            dailyReminder: true,
            weekendReminder: false
          })
          await window.electronAPI?.password.remove()
        } else {
          // Clear localStorage
          localStorage.clear()
        }
        
        showMessage('success', 'Tüm veriler silindi. Sayfa yenileniyor...')
        
        // Reload after 2 seconds
        setTimeout(() => window.location.reload(), 2000)
      } catch (error) {
        logger.error('Data deletion error:', error)
        showMessage('error', 'Veri silme sırasında hata oluştu!')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Sentry Test Butonu
  const handleSentryTest = () => {
    try {
      throw new Error("Sentry Frontend Test Error");
    } catch (error) {
      Sentry.captureException(error);
      showMessage('success', 'Sentry test hatası gönderildi! Kontrol edebilirsiniz.');
    }
  };

  return (
    <div className={`w-full h-full relative transition-all duration-700 ${
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

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 snap-section"
        >
          <h1 className={`text-3xl sm:text-4xl font-serif font-bold mb-4 transition-colors duration-700 ${
            isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
          }`}>
            ⚙️ Ayarlar
          </h1>
          <p className={`text-base sm:text-lg font-medium transition-colors duration-700 ${
            isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
          }`}>
            Uygulama tercihlerinizi ve güvenlik ayarlarınızı yönetin
          </p>
          
          {/* Platform indicator */}
          <div className={`mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs ${
            isDarkTheme 
              ? 'bg-rich-brown-800 text-amber-400' 
              : 'bg-amber-100 text-amber-800'
          }`}>
            {isElectron ? '🖥️ Desktop Modu' : '🌐 Web Modu'}
          </div>
        </motion.div>

        {/* Message */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* General Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-700 snap-section ${
              isDarkTheme 
                ? 'bg-rich-brown-800 border border-rich-brown-600' 
                : 'bg-white/80 border border-amber-200'
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Palette className={`h-6 w-6 transition-colors duration-700 ${
                isDarkTheme ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <h2 className={`text-xl sm:text-2xl font-serif font-semibold transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
              }`}>
                🎨 Genel Ayarlar
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-700 ${
                  isDarkTheme 
                    ? 'bg-rich-brown-700 border border-rich-brown-600' 
                    : 'bg-amber-50 border border-amber-100'
                }`}
              >
                <div>
                  <h3 className={`font-medium transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                  }`}>
                    🌙 Karanlık Mod
                  </h3>
                  <p className={`text-sm transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                  }`}>
                    Gözlerinizi korumak için profesyonel karanlık tema
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDarkTheme}
                    onChange={toggleTheme}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer transition-all duration-700 peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                    isDarkTheme 
                      ? 'bg-rich-brown-600 peer-focus:ring-amber-500/30 after:border-rich-brown-500 peer-checked:bg-amber-500' 
                      : 'bg-amber-200 peer-focus:ring-amber-300 after:border-amber-300 peer-checked:bg-amber-600'
                  }`}></div>
                </label>
              </motion.div>

              {/* Notifications */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-700 ${
                  isDarkTheme 
                    ? 'bg-rich-brown-700 border border-rich-brown-600' 
                    : 'bg-amber-50 border border-amber-100'
                }`}
              >
                <div>
                  <h3 className={`font-medium transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                  }`}>🔔 Bildirimler</h3>
                  <p className={`text-sm transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                  }`}>
                    {isElectron ? 'Desktop bildirimlerini etkinleştir' : 'Web bildirimlerini etkinleştir'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Test notification button */}
                  <button
                    onClick={handleTestNotification}
                    className={`p-2 rounded-lg transition-colors duration-300 ${
                      isDarkTheme 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                    title="Test Bildirimi"
                  >
                    <TestTube size={16} />
                  </button>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleNotificationToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer transition-all duration-700 peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      isDarkTheme 
                        ? 'bg-rich-brown-600 peer-focus:ring-amber-500/30 after:border-rich-brown-500 peer-checked:bg-amber-500' 
                        : 'bg-amber-200 peer-focus:ring-amber-300 after:border-amber-300 peer-checked:bg-amber-600'
                    }`}></div>
                  </label>
                </div>
              </motion.div>

              {/* Reminder Time - Only show for Electron */}
              {settings.notifications && isElectron && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`p-4 rounded-lg transition-all duration-700 ${
                    isDarkTheme 
                      ? 'bg-rich-brown-700 border border-rich-brown-600' 
                      : 'bg-amber-50 border border-amber-100'
                  }`}
                >
                  <h3 className={`font-medium mb-3 transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                  }`}>⏰ Günce Hatırlatma Saati</h3>
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => saveSettings({ reminderTime: e.target.value })}
                    className={`px-3 py-2 rounded-lg border transition-all duration-700 ${
                      isDarkTheme 
                        ? 'bg-rich-brown-600 border-rich-brown-500 text-rich-brown-100' 
                        : 'bg-white border-amber-300 text-amber-900'
                    }`}
                  />
                  
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.dailyReminder}
                        onChange={(e) => saveSettings({ dailyReminder: e.target.checked })}
                        className={`rounded transition-colors duration-700 ${
                          isDarkTheme ? 'text-amber-500' : 'text-amber-600'
                        }`}
                      />
                      <span className={`text-sm transition-colors duration-700 ${
                        isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                      }`}>Günce yazmayı unuttuğumda hatırlat</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.weekendReminder}
                        onChange={(e) => saveSettings({ weekendReminder: e.target.checked })}
                        className={`rounded transition-colors duration-700 ${
                          isDarkTheme ? 'text-amber-500' : 'text-amber-600'
                        }`}
                      />
                      <span className={`text-sm transition-colors duration-700 ${
                        isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                      }`}>Hafta sonları da hatırlat</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-700 snap-section ${
              isDarkTheme 
                ? 'bg-rich-brown-800 border border-rich-brown-600' 
                : 'bg-white/80 border border-amber-200'
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Shield className={`h-6 w-6 transition-colors duration-700 ${
                isDarkTheme ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <h2 className={`text-xl sm:text-2xl font-serif font-semibold transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
              }`}>
                🔒 Güvenlik
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Password Protection */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className={`p-4 rounded-lg transition-all duration-700 ${
                  isDarkTheme 
                    ? 'bg-rich-brown-700 border border-rich-brown-600' 
                    : 'bg-amber-50 border border-amber-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`font-medium transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                    }`}>🔐 Şifre Koruması</h3>
                    <p className={`text-sm transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                    }`}>
                      {isElectron ? 'Uygulamayı şifre ile koruyun' : 'Güncelerinizi şifre ile koruyun'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.passwordProtection}
                      onChange={(e) => {
                        if (!e.target.checked) {
                          handlePasswordRemove()
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer transition-all duration-700 peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      isDarkTheme 
                        ? 'bg-rich-brown-600 peer-focus:ring-amber-500/30 after:border-rich-brown-500 peer-checked:bg-amber-500' 
                        : 'bg-amber-200 peer-focus:ring-amber-300 after:border-amber-300 peer-checked:bg-amber-600'
                    }`}></div>
                  </label>
                </div>

                {/* Security Warnings */}
                {securityWarnings.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border-l-4 border-red-500 ${
                      isDarkTheme ? 'bg-red-900/20' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-600 mb-1">Güvenlik Uyarıları</h4>
                        <ul className="text-xs text-red-600 space-y-1">
                          {securityWarnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Rate Limiting Info */}
                {passwordAttempts > 0 && !isLockedOut && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border-l-4 border-yellow-500 ${
                      isDarkTheme ? 'bg-yellow-900/20' : 'bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-xs text-yellow-600">
                        Yanlış deneme: {passwordAttempts}/{PASSWORD_SECURITY.maxAttempts}
                      </span>
                    </div>
                  </motion.div>
                )}

                {!settings.passwordProtection && (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type={settings.showPassword ? 'text' : 'password'}
                        placeholder="Yeni şifre (min. 8 karakter)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLockedOut}
                        className={`w-full px-3 py-2 pr-10 rounded-lg border transition-all duration-700 ${
                          isLockedOut 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        } ${
                          password && !passwordStrength.isValid
                            ? 'border-red-500'
                            : password && passwordStrength.isValid
                              ? 'border-green-500'
                              : ''
                        } ${
                          isDarkTheme 
                            ? 'bg-rich-brown-600 border-rich-brown-500 text-rich-brown-100 placeholder-rich-brown-300' 
                            : 'bg-white border-amber-300 text-amber-900 placeholder-amber-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => saveSettings({ showPassword: !settings.showPassword })}
                        disabled={isLockedOut}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-700 ${
                          isDarkTheme ? 'text-rich-brown-300 hover:text-rich-brown-100' : 'text-amber-500 hover:text-amber-700'
                        }`}
                      >
                        {settings.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${
                            isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                          }`}>
                            Şifre Gücü: {passwordStrength.strength === 'weak' ? 'Zayıf' : passwordStrength.strength === 'medium' ? 'Orta' : 'Güçlü'}
                          </span>
                          <span className={`text-xs ${
                            passwordStrength.isValid ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {passwordStrength.score}/5
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength.percentage}%` }}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.strength === 'weak' ? 'bg-red-500' :
                              passwordStrength.strength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(passwordStrength.checks).map(([key, passed]) => (
                            <div key={key} className={`flex items-center ${passed ? 'text-green-600' : 'text-red-600'}`}>
                              {passed ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                              <span>
                                {key === 'length' ? '8+ karakter' :
                                 key === 'lowercase' ? 'Küçük harf' :
                                 key === 'uppercase' ? 'Büyük harf' :
                                 key === 'numbers' ? 'Rakam' : 'Özel karakter'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <input
                      type={settings.showPassword ? 'text' : 'password'}
                      placeholder="Şifre tekrar"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLockedOut}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-700 ${
                        isLockedOut 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      } ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-500'
                          : confirmPassword && password === confirmPassword && confirmPassword
                            ? 'border-green-500'
                            : ''
                      } ${
                        isDarkTheme 
                          ? 'bg-rich-brown-600 border-rich-brown-500 text-rich-brown-100 placeholder-rich-brown-300' 
                          : 'bg-white border-amber-300 text-amber-900 placeholder-amber-500'
                      }`}
                    />

                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <div className={`text-xs flex items-center ${
                        password === confirmPassword ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {password === confirmPassword ? (
                          <>
                            <CheckCircle size={12} className="mr-1" />
                            Şifreler eşleşiyor
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} className="mr-1" />
                            Şifreler eşleşmiyor
                          </>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handlePasswordSetup}
                      disabled={!password || !confirmPassword || isLoading || isLockedOut || !passwordStrength.isValid}
                      className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isDarkTheme 
                          ? 'bg-amber-500 hover:bg-amber-400 text-rich-brown-900' 
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      {isLoading ? '⏳ Ayarlanıyor...' : 
                       isLockedOut ? '🔒 Geçici Olarak Kilitli' :
                       !passwordStrength.isValid ? '❌ Şifre Zayıf' :
                       '🔒 Güvenli Şifre Belirle'}
                    </button>

                    {/* Security Tips */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-3 rounded-lg ${
                        isDarkTheme ? 'bg-rich-brown-700/50' : 'bg-amber-50'
                      }`}
                    >
                      <h4 className={`text-xs font-medium mb-2 ${
                        isDarkTheme ? 'text-amber-400' : 'text-amber-700'
                      }`}>
                        🛡️ Güvenlik İpuçları:
                      </h4>
                      <ul className={`text-xs space-y-1 ${
                        isDarkTheme ? 'text-rich-brown-200' : 'text-amber-600'
                      }`}>
                        <li>• En az 8 karakter kullanın</li>
                        <li>• Büyük harf, küçük harf, rakam ve özel karakter karıştırın</li>
                        <li>• Kişisel bilgilerinizi kullanmayın</li>
                        <li>• Başka yerlerde kullandığınız şifreyi kullanmayın</li>
                      </ul>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Backup & Data */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-700 ${
              isDarkTheme 
                ? 'bg-rich-brown-800 border border-rich-brown-600' 
                : 'bg-white/80 border border-amber-200'
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Database className={`h-6 w-6 transition-colors duration-700 ${
                isDarkTheme ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <h2 className={`text-xl sm:text-2xl font-serif font-semibold transition-colors duration-700 ${
                isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
              }`}>
                💾 Yedekleme
              </h2>
            </div>
            
            <div className="space-y-4">
              {/* Auto Backup - Only for Electron */}
              {isElectron && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all duration-700 ${
                    isDarkTheme 
                      ? 'bg-rich-brown-700 border border-rich-brown-600' 
                      : 'bg-amber-50 border border-amber-100'
                  }`}
                >
                  <div>
                    <h3 className={`font-medium transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                    }`}>🔄 Otomatik Yedekleme</h3>
                    <p className={`text-sm transition-colors duration-700 ${
                      isDarkTheme ? 'text-rich-brown-200' : 'text-amber-700'
                    }`}>Güncelerinizi otomatik olarak yedekleyin</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => handleAutoBackupToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 rounded-full peer transition-all duration-700 peer-focus:outline-none peer-focus:ring-4 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                      isDarkTheme 
                        ? 'bg-rich-brown-600 peer-focus:ring-amber-500/30 after:border-rich-brown-500 peer-checked:bg-amber-500' 
                        : 'bg-amber-200 peer-focus:ring-amber-300 after:border-amber-300 peer-checked:bg-amber-600'
                    }`}></div>
                  </label>
                </motion.div>
              )}

              {/* Manual Backup/Import */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <button
                  onClick={() => handleExportData()}
                  disabled={isLoading}
                  className={`flex items-center justify-center space-x-2 p-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDarkTheme 
                      ? 'bg-green-600 hover:bg-green-500 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Download size={20} />
                  <span>{isLoading ? 'Yedekleniyor...' : 'Yedek Al'}</span>
                </button>

                <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg font-medium cursor-pointer transition-all duration-300 ${
                  isDarkTheme 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                  <Upload size={20} />
                  <span>Yedek Yükle</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </motion.div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className={`backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-700 border-2 ${
              isDarkTheme 
                ? 'bg-red-900/20 border-red-600' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <Trash2 className="h-6 w-6 text-red-500" />
              <h2 className={`text-xl sm:text-2xl font-serif font-semibold text-red-500`}>
                ⚠️ Tehlikeli Alan
              </h2>
            </div>
            
            <div className="space-y-4">
              <p className={`text-sm transition-colors duration-700 ${
                isDarkTheme ? 'text-red-300' : 'text-red-700'
              }`}>
                Bu işlemler geri alınamaz. Lütfen dikkatli olun.
              </p>

              <button
                onClick={handleClearData}
                disabled={isLoading}
                className={`w-full flex items-center justify-center space-x-2 p-4 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkTheme 
                    ? 'bg-red-600 hover:bg-red-500 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <Trash2 size={20} />
                <span>{isLoading ? 'Siliniyor...' : 'Tüm Verileri Sil'}</span>
              </button>
            </div>
          </motion.div>

          {/* Sentry Test Section */}
          {import.meta.env.DEV && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Geliştirici Araçları</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <TestTube className="h-5 w-5 mr-3 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">Sentry Test Hatası</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Frontend hata takibini test etmek için Sentry'ye manuel hata gönderin.</p>
                  </div>
                </div>
                <button
                  onClick={handleSentryTest}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
                >
                  Hata Gönder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings