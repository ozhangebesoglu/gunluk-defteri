import React, { useState, useEffect } from 'react'
import { CheckCircle, RotateCw, WifiOff, AlertCircle } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { apiService } from '../services/api'

type SyncStatusType = 'synced' | 'syncing' | 'offline' | 'error'

const SyncStatus: React.FC = () => {
  const { isDarkTheme } = useTheme()
  const [status, setStatus] = useState<SyncStatusType>('synced')
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Initial check
    checkSyncStatus()

    // Set up periodic checks (every 30 seconds)
    const interval = setInterval(checkSyncStatus, 30000)

    // Listen for online/offline events in web mode
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  const handleOnline = () => {
    setStatus('syncing')
    checkSyncStatus()
  }

  const handleOffline = () => {
    setStatus('offline')
  }

  const checkSyncStatus = async () => {
    try {
      setStatus('syncing')
      
      // Check if we're online (for web mode)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setStatus('offline')
        return
      }

      try {
        const health = await apiService.healthCheck()
        // Check if health response indicates success
        if (health && health.status === 'OK') {
          setStatus('synced')
          setLastSync(new Date())
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.warn('API health check failed, running in offline mode:', error)
        setStatus('offline')
      }
    } catch (error) {
      console.error('❌ Sync status check failed:', error)
      setStatus('error')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'syncing':
        return <RotateCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'offline':
        return <WifiOff className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI
    const mode = isElectron ? 'Desktop' : 'Web'
    
    switch (status) {
      case 'synced':
        return lastSync 
          ? `${mode} - Senkronize (${lastSync.toLocaleTimeString()})`
          : `${mode} - Senkronize`
      case 'syncing':
        return `${mode} - Senkronize ediliyor...`
      case 'offline':
        return `${mode} - Çevrimdışı / Yerel Kayıt`
      case 'error':
        return `${mode} - Bağlantı hatası`
      default:
        return `${mode} - Durum kontrol ediliyor...`
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'synced':
        return isDarkTheme ? 'text-green-400' : 'text-green-600'
      case 'syncing':
        return isDarkTheme ? 'text-blue-400' : 'text-blue-600'
      case 'offline':
        return isDarkTheme ? 'text-red-400' : 'text-red-600'
      case 'error':
        return isDarkTheme ? 'text-red-400' : 'text-red-600'
      default:
        return isDarkTheme ? 'text-slate-400' : 'text-slate-600'
    }
  }

  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI

  return (
    <div className={`flex items-center space-x-2 text-xs transition-colors duration-700 ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {/* Mode indicator badge */}
      <span className={`px-2 py-1 rounded-full text-xs font-medium transition-colors duration-700 ${
        isElectron
          ? (isDarkTheme ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800')
          : (isDarkTheme ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
      }`}>
        {isElectron ? 'Desktop' : 'Web'}
      </span>
    </div>
  )
}

export default SyncStatus 