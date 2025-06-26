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
  TestTube
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { apiService } from '../services/api'

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

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

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
      console.error('❌ Ayarlar yüklenemedi:', error)
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
      console.error('❌ Ayarlar kaydedilemedi:', error)
      showMessage('error', 'Ayarlar kaydedilemedi!')
    }
  }

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
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
          console.error('Electron bildirim hatası:', error)
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

  // Password protection
  const handlePasswordSetup = async () => {
    if (password !== confirmPassword) {
      showMessage('error', 'Şifreler eşleşmiyor!')
      return
    }
    
    if (password.length < 6) {
      showMessage('error', 'Şifre en az 6 karakter olmalıdır!')
      return
    }

    setIsLoading(true)
    try {
      if (isElectron) {
        // Use Electron password API
        const result = await window.electronAPI?.password.set(password)
        if (result?.success) {
          await saveSettings({ passwordProtection: true })
          showMessage('success', 'Şifre koruması aktif edildi!')
        } else {
          showMessage('error', result?.error || 'Şifre ayarlanamadı!')
        }
      } else {
        // Simple encoding for web (use proper hashing in production)
        const hashedPassword = btoa(password)
        localStorage.setItem('gunce_password', hashedPassword)
        await saveSettings({ passwordProtection: true })
        showMessage('success', 'Şifre koruması aktif edildi!')
      }
      
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      showMessage('error', 'Şifre ayarlanamadı!')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordRemove = async () => {
    if (confirm('Şifre korumasını kaldırmak istediğinizden emin misiniz?')) {
      try {
        if (isElectron) {
          const result = await window.electronAPI?.password.remove()
          if (result?.success) {
            await saveSettings({ passwordProtection: false })
            showMessage('success', 'Şifre koruması kaldırıldı!')
          }
        } else {
          localStorage.removeItem('gunce_password')
          await saveSettings({ passwordProtection: false })
          showMessage('success', 'Şifre koruması kaldırıldı!')
        }
      } catch (error) {
        showMessage('error', 'Şifre kaldırılamadı!')
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
      console.error('❌ Yedekleme hatası:', error)
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
      console.error('❌ İçe aktarma hatası:', error)
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
        console.error('❌ Veri silme hatası:', error)
        showMessage('error', 'Veri silme sırasında hata oluştu!')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className={`w-full h-screen relative overflow-y-auto overscroll-behavior-y-auto transition-all duration-700 ${
      isDarkTheme 
        ? 'bg-rich-brown-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50'
    }`} style={{ height: '100vh', maxHeight: '100vh' }}>
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='13' cy='43' r='1'/%3E%3Ccircle cx='47' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-full px-4 py-6 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
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
              className={`backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-700 ${
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
              className={`backdrop-blur-sm paper-texture rounded-xl shadow-lg p-4 sm:p-6 transition-all duration-700 ${
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

                  {!settings.passwordProtection && (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type={settings.showPassword ? 'text' : 'password'}
                          placeholder="Yeni şifre"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`w-full px-3 py-2 pr-10 rounded-lg border transition-all duration-700 ${
                            isDarkTheme 
                              ? 'bg-rich-brown-600 border-rich-brown-500 text-rich-brown-100 placeholder-rich-brown-300' 
                              : 'bg-white border-amber-300 text-amber-900 placeholder-amber-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => saveSettings({ showPassword: !settings.showPassword })}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors duration-700 ${
                            isDarkTheme ? 'text-rich-brown-300 hover:text-rich-brown-100' : 'text-amber-500 hover:text-amber-700'
                          }`}
                        >
                          {settings.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <input
                        type={settings.showPassword ? 'text' : 'password'}
                        placeholder="Şifre tekrar"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border transition-all duration-700 ${
                          isDarkTheme 
                            ? 'bg-rich-brown-600 border-rich-brown-500 text-rich-brown-100 placeholder-rich-brown-300' 
                            : 'bg-white border-amber-300 text-amber-900 placeholder-amber-500'
                        }`}
                      />
                      <button
                        onClick={handlePasswordSetup}
                        disabled={!password || !confirmPassword || isLoading}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isDarkTheme 
                            ? 'bg-amber-500 hover:bg-amber-400 text-rich-brown-900' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {isLoading ? '⏳ Ayarlanıyor...' : '🔒 Şifre Belirle'}
                      </button>
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

          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings