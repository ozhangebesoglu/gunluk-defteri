/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Minus, Square, X } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { HapticFeedback } from '../../lib/hapticFeedback'

interface WindowControlsProps {
  isMobile?: boolean
}

const WindowControls: React.FC<WindowControlsProps> = ({ isMobile = false }) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isElectron, setIsElectron] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const { isDarkTheme } = useTheme()

  useEffect(() => {
    // Check if touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    
    // Enhanced Electron detection
    const checkElectronEnvironment = async () => {
      // Multiple Electron detection methods
      const electronAPI = (window as any).electronAPI
      const userAgent = navigator.userAgent.toLowerCase()
      const isElectronUA = userAgent.indexOf('electron') > -1
      const isElectronProcess = !!(window as any).process?.versions?.electron
      
      const isElectronApp = !!(electronAPI || isElectronUA || isElectronProcess)
      
      setIsElectron(isElectronApp)
      
      if (isElectronApp && electronAPI?.window) {
        try {
          const maximized = await electronAPI.window.isMaximized()
          setIsMaximized(maximized)
        } catch (error) {
          console.warn('⚠️ Window API error:', error)
        }
      }
    }

    checkElectronEnvironment()
  }, [])

  // Show controls for Electron apps or mobile devices
  const shouldShow = isElectron || isMobile || isTouchDevice
  
  // Debug removed - working correctly

  if (!shouldShow) {
    return null
  }

  const handleMinimize = async () => {
    // Haptic feedback for mobile/tablet
    if (isMobile || isTouchDevice) {
      HapticFeedback.light()
    }
    
    try {
      if ((window as any).electronAPI?.window?.minimize) {
        await (window as any).electronAPI.window.minimize()
      }
    } catch (error) {
      console.error('❌ Failed to minimize window:', error)
    }
  }

  const handleMaximize = async () => {
    // Haptic feedback for mobile/tablet
    if (isMobile || isTouchDevice) {
      HapticFeedback.medium()
    }
    
    try {
      if ((window as any).electronAPI?.window?.maximize) {
        await (window as any).electronAPI.window.maximize()
        const maximized = await (window as any).electronAPI.window.isMaximized()
        setIsMaximized(maximized)
      }
    } catch (error) {
      console.error('❌ Failed to maximize window:', error)
    }
  }

  const handleClose = async () => {
    // Haptic feedback for mobile/tablet
    if (isMobile || isTouchDevice) {
      HapticFeedback.heavy()
    }
    
    try {
      if ((window as any).electronAPI?.window?.close) {
        await (window as any).electronAPI.window.close()
      }
    } catch (error) {
      console.error('❌ Failed to close window:', error)
    }
  }

  // Mobile/Tablet optimized sizes and animations
  const buttonSize = isMobile || isTouchDevice ? "w-8 h-8" : "w-6 h-6"
  const iconSize = isMobile || isTouchDevice ? 16 : 12
  const spacing = isMobile || isTouchDevice ? "space-x-3" : "space-x-2"
  
  // 120fps animation variants
  const buttonVariants = {
    idle: { 
      scale: 1,
      transition: { type: "spring", stiffness: 400, damping: 25 }
    },
    hover: { 
      scale: isMobile || isTouchDevice ? 1.05 : 1.1,
      transition: { type: "spring", stiffness: 600, damping: 20 }
    },
    tap: { 
      scale: 0.95,
      transition: { type: "spring", stiffness: 800, damping: 30 }
    }
  }

  return (
    <div className={`flex items-center ${spacing} drag-none performance-optimized`}>
      {/* Minimize Button */}
      <motion.button
        onClick={handleMinimize}
        className={`${buttonSize} rounded-full transition-all duration-150 flex items-center justify-center group fps-120 ${
          isDarkTheme 
            ? 'bg-slate-600 hover:bg-yellow-500 active:bg-yellow-600' 
            : 'bg-gray-300 hover:bg-yellow-500 active:bg-yellow-600'
        } ${isMobile || isTouchDevice ? 'shadow-lg active:shadow-xl' : ''}`}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        title="Küçült"
      >
        <Minus 
          size={iconSize} 
          className={`${isMobile || isTouchDevice ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} transition-opacity duration-150 text-black`} 
        />
      </motion.button>

      {/* Maximize/Restore Button */}
      <motion.button
        onClick={handleMaximize}
        className={`${buttonSize} rounded-full transition-all duration-150 flex items-center justify-center group fps-120 ${
          isDarkTheme 
            ? 'bg-slate-600 hover:bg-green-500 active:bg-green-600' 
            : 'bg-gray-300 hover:bg-green-500 active:bg-green-600'
        } ${isMobile || isTouchDevice ? 'shadow-lg active:shadow-xl' : ''}`}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        title={isMaximized ? "Geri Yükle" : "Tam Ekran"}
      >
        <Square 
          size={iconSize - 2} 
          className={`${isMobile || isTouchDevice ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} transition-opacity duration-150 text-black`} 
        />
      </motion.button>

      {/* Close Button */}
      <motion.button
        onClick={handleClose}
        className={`${buttonSize} rounded-full transition-all duration-150 flex items-center justify-center group fps-120 ${
          isDarkTheme 
            ? 'bg-slate-600 hover:bg-red-500 active:bg-red-600' 
            : 'bg-gray-300 hover:bg-red-500 active:bg-red-600'
        } ${isMobile || isTouchDevice ? 'shadow-lg active:shadow-xl' : ''}`}
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        title="Kapat"
      >
        <X 
          size={iconSize} 
          className={`${isMobile || isTouchDevice ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} transition-opacity duration-150 text-white`} 
        />
      </motion.button>
    </div>
  )
}

export default WindowControls 