// ==========================================
// GÜNCE DEFTERI - Sync Status Component (Context7 Uyumlu)
// Real-time sync status indicator
// ==========================================

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Wifi, WifiOff, AlertCircle, RotateCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const SyncStatus: React.FC = () => {
  const { syncStatus, user } = useAuth()

  // Don't show sync status if user is not authenticated
  if (!user) return null

  // Only show the indicator for "active" states that require user attention.
  // For 'connected' or 'synced' state, we don't need a persistent indicator.
  const activeStates: SyncStatus['status'][] = ['syncing', 'offline', 'conflict', 'error'];
  if (!syncStatus || !activeStates.includes(syncStatus.status)) {
    return null;
  }

  const getStatusInfo = () => {
    switch (syncStatus.status) {
      case 'synced':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          message: 'Senkronize',
          description: syncStatus.lastSync 
            ? `Son sync: ${syncStatus.lastSync.toLocaleTimeString('tr-TR')}`
            : 'Veriler güncel'
        }
      case 'syncing':
        return {
          icon: RotateCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          message: 'Senkronize ediliyor...',
          description: 'Veriler senkronize ediliyor',
          animate: true
        }
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          message: 'Çevrimdışı',
          description: 'Bağlantı yok'
        }
      case 'conflict':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          message: 'Çakışma',
          description: 'Veri çakışması tespit edildi'
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          message: 'Hata',
          description: 'Senkronizasyon hatası'
        }
      default:
        return {
          icon: Wifi,
          color: 'text-slate-500',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/20',
          message: 'Hazır',
          description: 'Senkronizasyon hazır'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const Icon = statusInfo.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50"
      >
        <motion.div
          className={`
            ${statusInfo.bgColor} ${statusInfo.borderColor}
            backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg
            flex items-center space-x-2 min-w-[200px]
          `}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* Status Icon */}
          <motion.div
            className={statusInfo.color}
            animate={statusInfo.animate ? { rotate: 360 } : {}}
            transition={statusInfo.animate ? {
              duration: 1,
              repeat: Infinity,
              ease: 'linear'
            } : {}}
          >
            <Icon className="w-4 h-4" />
          </motion.div>

          {/* Status Text */}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.message}
            </div>
            <div className="text-xs text-slate-400 truncate">
              {statusInfo.description}
            </div>
          </div>

          {/* Pending Changes Badge */}
          {syncStatus.pendingChanges && syncStatus.pendingChanges > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-amber-500 text-amber-900 text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center"
            >
              {syncStatus.pendingChanges}
            </motion.div>
          )}
        </motion.div>

        {/* Connection Quality Indicator */}
        {syncStatus.status === 'synced' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-1 flex justify-end"
          >
            <div className="flex space-x-1">
              {[1, 2, 3].map((bar) => (
                <motion.div
                  key={bar}
                  className="w-1 bg-green-500 rounded-full"
                  style={{ height: `${bar * 3 + 2}px` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: bar * 0.1, duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default SyncStatus 