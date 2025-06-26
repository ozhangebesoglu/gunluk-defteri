import React, { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ScrollContainerProps {
  children: React.ReactNode
  className?: string
  showScrollIndicator?: boolean
  pullToRefresh?: boolean
  onRefresh?: () => Promise<void>
  overscrollBehavior?: 'auto' | 'contain' | 'none'
  scrollbarStyle?: 'hidden' | 'thin' | 'iOS' | 'context7'
}

const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  className,
  showScrollIndicator = true,
  pullToRefresh = false,
  onRefresh,
  overscrollBehavior = 'auto',
  scrollbarStyle = 'context7'
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [isAtTop, setIsAtTop] = useState(true)

  // Scroll progress tracking
  const { scrollYProgress } = useScroll({ container: containerRef })
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Scroll velocity for momentum
  const scrollVelocity = useSpring(0, {
    stiffness: 100,
    damping: 30
  })

  // Monitor scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      setIsAtTop(scrollTop <= 0)
      
      // Update velocity for momentum
      scrollVelocity.set(scrollTop)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [scrollVelocity])

  // Pull to refresh logic
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!pullToRefresh || !isAtTop) return
    setTouchStart(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pullToRefresh || !isAtTop || isRefreshing) return
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, currentY - touchStart)
    
    if (distance > 0) {
      setPullDistance(Math.min(distance, 100))
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (!pullToRefresh || pullDistance < 60 || isRefreshing) {
      setPullDistance(0)
      return
    }

    setIsRefreshing(true)
    
    try {
      if (onRefresh) {
        await onRefresh()
      }
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }

  // Scrollbar style variants
  const getScrollbarStyles = () => {
    switch (scrollbarStyle) {
      case 'hidden':
        return 'scrollbar-hide'
      case 'thin':
        return 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'
      case 'iOS':
        return 'ios-scrollbar'
      case 'context7':
      default:
        return 'context7-scrollbar'
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Scroll Progress Indicator */}
      {showScrollIndicator && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 transform-gpu z-50"
          style={{ scaleX, transformOrigin: '0%' }}
        />
      )}

      {/* Pull to Refresh Indicator */}
      {pullToRefresh && (
        <motion.div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-40"
          animate={{
            y: isRefreshing ? 60 : pullDistance > 0 ? pullDistance - 60 : -60,
            opacity: pullDistance > 20 || isRefreshing ? 1 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg border border-amber-200">
            {isRefreshing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full"
              />
            ) : (
              <motion.div
                animate={{ rotate: pullDistance > 60 ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-6 h-6 text-amber-600"
              >
                ↓
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Scroll Container */}
      <motion.div
        ref={containerRef}
        className={cn(
          // Base styles
          'w-full h-full overflow-y-auto overflow-x-hidden',
          // Smooth scrolling
          'scroll-smooth',
          // Overscroll behavior
          overscrollBehavior === 'contain' && 'overscroll-contain',
          overscrollBehavior === 'none' && 'overscroll-none',
          // Scrollbar styles
          getScrollbarStyles(),
          // Performance optimizations
          'transform-gpu',
          // Mobile optimizations
          'touch-pan-y',
          // Custom styles
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          // iOS momentum scrolling
          WebkitOverflowScrolling: 'touch',
          // Scroll snap for smooth sections
          scrollSnapType: 'y proximity',
        }}
      >
        {/* Content wrapper with pull offset */}
        <motion.div
          animate={{
            y: isRefreshing ? 60 : pullDistance > 0 ? pullDistance : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="min-h-full"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ScrollContainer 