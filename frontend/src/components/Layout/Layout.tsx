import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  User,
  Download,
  Shield,
  Calendar,
  PenTool,
  Sun,
  Moon,
  Heart
} from 'lucide-react'
import Lamp from '../ui/Lamp'
import WindowControls from '../ui/WindowControls'
import ScrollContainer from '../ui/ScrollContainer'

import { useTheme } from '../../contexts/ThemeContext'
import { detectDevice, getOptimizedTransition } from '../../lib/motionConfig'
const icon = '/book_icon.png'

interface LayoutProps {
  children: React.ReactNode
}

interface MenuItem {
  text: string
  icon: React.ReactElement
  path: string
  badge?: number
  description?: string
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { isDarkTheme, setIsDarkTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  
  // 120fps device detection
  const deviceInfo = detectDevice()
  const optimizedTransition = getOptimizedTransition(deviceInfo)

  const menuItems: MenuItem[] = [
    { 
      text: 'Ana Sayfa', 
      icon: <Home size={20} />, 
      path: '/dashboard',
      description: 'Günce defterinizin ana sayfası'
    },
    { 
      text: 'Tüm Günceler', 
      icon: <BookOpen size={20} />, 
      path: '/diary-list',
      description: 'Geçmiş yazılarınızı görüntüleyin'
    },
    { 
      text: 'Anılar', 
      icon: <Heart size={20} />, 
      path: '/memories',
      description: 'Favori günce yazılarınız'
    },
    { 
      text: 'Yeni günce', 
      icon: <PenTool size={20} />, 
      path: '/new-entry',
      description: 'Yeni bir günce yazısı oluşturun'
    },
    { 
      text: 'İstatistikler', 
      icon: <BarChart3 size={20} />, 
      path: '/statistics',
      description: 'Yazma alışkanlıklarınızı analiz edin'
    },
    { 
      text: 'Ayarlar', 
      icon: <Settings size={20} />, 
      path: '/settings',
      description: 'Uygulama tercihlerinizi yönetin'
    }
  ]

  const handleMenuClick = (path: string) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const handleBackup = async () => {
    try {
      if (window.electronAPI?.backup?.create) {
        const result = await window.electronAPI.backup.create()
        console.log('✅ Backup created:', result)
      }
    } catch (error) {
      console.error('❌ Backup failed:', error)
    }
    setProfileMenuOpen(false)
  }

  const sidebarVariants = {
    open: {
      x: 0,
      transition: optimizedTransition
    },
    closed: {
      x: "-100%", 
      transition: optimizedTransition
    }
  }

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.3
      }
    })
  }

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
  }

  return (
    <div className={`min-h-screen w-full transition-all duration-700 flex performance-optimized ${
      isDarkTheme 
        ? 'bg-rich-brown-900' 
        : 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50'
    }`}>
      
      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ x: 0 }}
        className={`hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:backdrop-blur-sm lg:paper-texture lg:shadow-xl lg:border-r transition-all duration-700 ${
          isDarkTheme 
            ? 'lg:bg-rich-brown-800/95 lg:border-rich-brown-600' 
            : 'lg:bg-white/95 lg:border-orange-200'
        }`}
      >
        {/* Desktop Sidebar Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center h-16 px-6 border-b transition-all duration-700 ${
            isDarkTheme 
              ? 'border-rich-brown-600 bg-rich-brown-700/50' 
              : 'border-orange-200 bg-gradient-to-r from-orange-100 to-amber-100'
          }`}
        >
          <div className="flex items-center space-x-3">
            <motion.img 
              src={icon} 
              alt="Günce Defteri" 
              className="w-8 h-8"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            />
            <h1 className={`text-xl font-serif font-semibold transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-orange-900'
            }`}>
              Günce Defteri
            </h1>
          </div>
        </motion.div>

        {/* Desktop Navigation Menu */}
        <nav className="flex-1 mt-6 px-4 overflow-y-auto pb-32">
          <motion.ul 
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {menuItems.map((item, index) => (
              <motion.li 
                key={item.text}
                custom={index}
                variants={menuItemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.button
                  onClick={() => handleMenuClick(item.path)}
                  className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                    location.pathname === item.path
                      ? (isDarkTheme 
                          ? 'bg-rich-brown-700 text-rich-brown-100 shadow-lg border border-rich-brown-500'
                          : 'bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 shadow-lg')
                      : (isDarkTheme
                          ? 'text-rich-brown-300 hover:bg-rich-brown-700 hover:text-rich-brown-100'
                          : 'text-amber-700 hover:bg-gradient-to-r hover:from-amber-100 hover:to-orange-100 hover:text-amber-900')
                  }`}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <div className="relative flex items-center space-x-4 px-4 py-4">
                    <span className={`flex-shrink-0 transition-colors duration-300 ${
                      location.pathname === item.path 
                        ? (isDarkTheme ? 'text-amber-300' : 'text-amber-600') 
                        : (isDarkTheme 
                            ? 'text-amber-400 group-hover:text-amber-300' 
                            : 'text-amber-500 group-hover:text-amber-600')
                    }`}>
                      {item.icon}
                    </span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{item.text}</div>
                      <div className={`text-xs opacity-70 mt-1 transition-colors duration-300 ${
                        isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </motion.button>
              </motion.li>
            ))}
          </motion.ul>
        </nav>

        {/* Desktop Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className={`mt-auto p-6 border-t transition-all duration-700 ${
            isDarkTheme 
              ? 'border-rich-brown-600 bg-gradient-to-t from-rich-brown-800 to-rich-brown-700' 
              : 'border-orange-200 bg-gradient-to-t from-amber-50 to-orange-50'
          }`}
        >
          <div className="text-center space-y-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className={`text-sm font-serif italic transition-colors duration-700 ${
                isDarkTheme ? 'text-amber-400' : 'text-amber-600'
              }`}
            >
              "Hayat kısa, anılar değerli"
            </motion.div>
            <div className={`text-xs transition-colors duration-700 ${
              isDarkTheme ? 'text-amber-500' : 'text-amber-500'
            }`}>
              📅 {new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Mobile Sidebar */}
            <motion.div 
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className={`lg:hidden fixed inset-y-0 left-0 w-72 backdrop-blur-md paper-texture shadow-2xl z-50 transition-all duration-700 ${
                isDarkTheme 
                  ? 'bg-rich-brown-800/95 border-rich-brown-600' 
                  : 'bg-white/95 border-orange-200'
              }`}
            >
              {/* Mobile Sidebar Header */}
              <div className={`flex items-center justify-between h-16 px-6 border-b transition-all duration-700 ${
                isDarkTheme 
                  ? 'border-rich-brown-600 bg-rich-brown-700/50' 
                  : 'border-orange-200 bg-gradient-to-r from-orange-100 to-amber-100'
              }`}>
                <div className="flex items-center space-x-3">
                  <motion.img 
                    src={icon} 
                    alt="Günce Defteri" 
                    className="w-7 h-7"
                    whileHover={{ scale: 1.1 }}
                  />
                  <h1 className={`text-lg font-serif font-semibold transition-colors duration-700 ${
                    isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
                  }`}>
                    Günce Defteri
                  </h1>
                </div>
                <motion.button
                  onClick={() => setSidebarOpen(false)}
                  className={`p-2 rounded-lg transition-colors duration-700 ${
                    isDarkTheme 
                      ? 'text-amber-300 hover:bg-rich-brown-600 hover:text-amber-200' 
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Mobile Navigation Menu */}
              <nav className="mt-6 px-4 pb-32 overflow-y-auto">
                <motion.ul 
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {menuItems.map((item, index) => (
                    <motion.li 
                      key={item.text}
                      custom={index}
                      variants={menuItemVariants}
                    >
                      <motion.button
                        onClick={() => handleMenuClick(item.path)}
                        className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                          location.pathname === item.path
                            ? (isDarkTheme 
                                ? 'bg-rich-brown-800 text-rich-brown-100 shadow-lg'
                                : 'bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 shadow-lg')
                            : (isDarkTheme
                                ? 'text-rich-brown-300 hover:bg-rich-brown-700 hover:text-rich-brown-100'
                                : 'text-amber-700 hover:bg-gradient-to-r hover:from-amber-100 hover:to-orange-100 hover:text-amber-900')
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-4 px-4 py-4">
                          <span className={`flex-shrink-0 transition-colors duration-300 ${
                            location.pathname === item.path 
                              ? (isDarkTheme ? 'text-amber-300' : 'text-amber-600') 
                              : (isDarkTheme 
                                  ? 'text-amber-400 group-hover:text-amber-300' 
                                  : 'text-amber-500 group-hover:text-amber-600')
                          }`}>
                            {item.icon}
                          </span>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm">{item.text}</div>
                            <div className={`text-xs opacity-70 mt-1 transition-colors duration-300 ${
                              isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                            }`}>
                              {item.description}
                            </div>
                          </div>
                          {item.badge && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    </motion.li>
                  ))}
                </motion.ul>
              </nav>

              {/* Mobile Footer */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className={`absolute bottom-0 left-0 right-0 p-4 border-t transition-all duration-700 ${
                  isDarkTheme 
                    ? 'border-rich-brown-600 bg-gradient-to-r from-rich-brown-800 to-rich-brown-700' 
                    : 'border-orange-200 bg-gradient-to-r from-amber-50 to-orange-50'
                }`}
              >
                <div className="text-center">
                  <div className={`text-sm font-serif italic mb-2 transition-colors duration-700 ${
                    isDarkTheme ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    "Hayat kısa, anılar değerli"
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar size={14} className={`transition-colors duration-700 ${
                      isDarkTheme ? 'text-amber-500' : 'text-amber-500'
                    }`} />
                    <span className={`text-xs transition-colors duration-700 ${
                      isDarkTheme ? 'text-amber-500' : 'text-amber-500'
                    }`}>
                      {new Date().toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar - 120fps Optimized */}
      <motion.div 
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={optimizedTransition}
        className={`lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-lg transition-all duration-150 drag-region performance-optimized fps-120 ${
          isDarkTheme 
            ? 'bg-rich-brown-800/95 border-rich-brown-600' 
            : 'bg-white/95 border-orange-200'
        }`}>
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-3 drag-none">
            <motion.button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 rounded-lg transition-colors duration-700 ${
                isDarkTheme 
                  ? 'text-amber-300 hover:bg-rich-brown-700 hover:text-amber-200' 
                  : 'text-amber-700 hover:bg-amber-100 hover:text-amber-900'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu size={20} />
            </motion.button>
            <img src={icon} alt="Günce Defteri" className="w-8 h-8" />
            <h1 className={`text-lg font-serif font-semibold transition-colors duration-700 ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-amber-900'
            }`}>
              Günce Defteri
            </h1>
          </div>
          
                                <div className="flex items-center space-x-3 drag-none">
            {/* Window Controls (Mobile) */}
            <WindowControls isMobile={true} />
            
            <motion.button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-700 ${
                  isDarkTheme 
                    ? 'text-amber-300 hover:bg-rich-brown-700 hover:text-amber-200' 
                    : 'text-amber-700 hover:bg-amber-100 hover:text-amber-900'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className={`h-16 backdrop-blur-sm paper-texture shadow-sm border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40 transition-all duration-700 drag-region ${
          isDarkTheme 
            ? 'bg-rich-brown-800/95 border-rich-brown-600 text-rich-brown-100' 
            : 'bg-white/95 border-orange-200'
        }`}>
          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-lg transition-colors drag-none ${
              isDarkTheme 
                ? 'hover:bg-rich-brown-700 text-amber-300' 
                : 'hover:bg-orange-100 text-orange-700'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu size={20} />
          </motion.button>

          {/* Desktop Logo */}
          <div className="hidden lg:flex items-center space-x-3">
            <img src={icon} alt="Günce Defteri" className="w-6 h-6" />
            <h1 className={`text-lg font-serif font-semibold transition-colors ${
              isDarkTheme ? 'text-rich-brown-100' : 'text-orange-900'
            }`}>
                              Günce Defteri
            </h1>
          </div>

                      {/* Right Side Controls */}
            <div className="flex items-center space-x-3 drag-none">
              {/* Window Controls (Frameless Window) */}
              <WindowControls isMobile={false} />
              
              {/* Theme Toggle - Desktop Only */}
              <motion.button
                onClick={toggleTheme}
                className={`hidden lg:flex p-2 rounded-lg transition-colors ${
                  isDarkTheme 
                    ? 'text-amber-300 hover:bg-rich-brown-700' 
                    : 'text-orange-700 hover:bg-orange-100'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            {/* Profile Menu */}
            <div className="relative">
              <motion.button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkTheme 
                    ? 'text-amber-300 hover:bg-rich-brown-700' 
                    : 'text-orange-700 hover:bg-orange-100'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <User size={20} />
              </motion.button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg backdrop-blur-sm border z-50 ${
                      isDarkTheme 
                        ? 'bg-rich-brown-800/95 border-rich-brown-600' 
                        : 'bg-white/95 border-orange-200'
                    }`}
                  >
                    <div className="py-2">
                      <motion.button
                        onClick={handleBackup}
                        className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                          isDarkTheme 
                            ? 'text-rich-brown-200 hover:bg-rich-brown-700' 
                            : 'text-gray-700 hover:bg-orange-50'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <Download size={16} className="mr-3" />
                        Yedek Al
                      </motion.button>
                      
                      <motion.button
                        className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                          isDarkTheme 
                            ? 'text-rich-brown-200 hover:bg-rich-brown-700' 
                            : 'text-gray-700 hover:bg-orange-50'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <Shield size={16} className="mr-3" />
                        Gizlilik
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-16 lg:pt-0">
          <ScrollContainer
            showScrollIndicator={true}
            pullToRefresh={true}
            onRefresh={async () => {
              // Refresh logic could be added here
              await new Promise(resolve => setTimeout(resolve, 1000))
            }}
            scrollbarStyle="context7"
            overscrollBehavior="contain"
            className="mobile-optimized fps-120"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={optimizedTransition}
              className="min-h-full"
            >
              {children}
            </motion.div>
          </ScrollContainer>
        </main>
      </div>

      {/* Background Effects */}
      <Lamp />
    </div>
  )
}

export default Layout 