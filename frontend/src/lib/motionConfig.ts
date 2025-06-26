// Context7-style 120fps Motion Configuration with Memory Optimization
import React from 'react'
export const motionConfig = {
  // High performance spring settings for 120fps
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
    mass: 0.8
  },
  
  // Fast spring for interactions
  fastSpring: {
    type: "spring" as const,
    stiffness: 600,
    damping: 20,
    mass: 0.6
  },
  
  // Ultra responsive for touch interactions
  touchSpring: {
    type: "spring" as const,
    stiffness: 800,
    damping: 30,
    mass: 0.4
  },
  
  // Smooth easing for mobile
  easing: [0.4, 0, 0.2, 1],
  
  // Duration settings
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3
  }
}

// Memory-optimized animation variants
export const mobileVariants = {
  // Page transitions - minimize will-change usage
  page: {
    initial: { opacity: 0, y: 10 }, // Reduced transform complexity
    animate: { 
      opacity: 1, 
      y: 0,
      transition: motionConfig.spring
    },
    exit: { 
      opacity: 0, 
      y: -10,
      transition: motionConfig.fastSpring
    }
  },
  
  // Button interactions - simplified
  button: {
    idle: { scale: 1 },
    hover: { 
      scale: 1.02, // Reduced scale for better performance
      transition: motionConfig.fastSpring
    },
    tap: { 
      scale: 0.98,
      transition: motionConfig.touchSpring
    }
  },
  
  // Card hover effects - minimal transform
  card: {
    idle: { y: 0 },
    hover: { 
      y: -2, // Reduced movement
      transition: motionConfig.spring
    }
  },
  
  // Sidebar animations
  sidebar: {
    closed: { 
      x: "-100%",
      transition: motionConfig.spring
    },
    open: { 
      x: 0,
      transition: motionConfig.spring
    }
  },
  
  // List item stagger - reduced complexity
  listItem: {
    hidden: { opacity: 0 },
    visible: (custom: number) => ({
      opacity: 1,
      transition: {
        ...motionConfig.spring,
        delay: custom * 0.02 // Reduced stagger delay
      }
    })
  }
}

// Device detection utility
export const detectDevice = () => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isMobile = window.innerWidth < 768
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
  
  return {
    isTouchDevice,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  }
}

// Performance optimization helper with reduced animations for low-end devices
export const getOptimizedTransition = (deviceInfo = detectDevice()) => {
  // Reduce animations on mobile for better performance
  if (deviceInfo.isMobile) {
    return {
      ...motionConfig.touchSpring,
      duration: 0.1 // Faster transitions on mobile
    }
  } else if (deviceInfo.isTablet) {
    return motionConfig.fastSpring
  } else {
    return motionConfig.spring
  }
}

// Will-change optimization utility - MEMORY SAFE
export const getWillChangeProps = (animating: boolean) => {
  // Only apply will-change when actively animating
  return animating ? { 
    style: { 
      willChange: 'transform',  // Only transform, not opacity
      animationFillMode: 'both'
    } 
  } : {
    style: {
      willChange: 'auto'  // Reset will-change when not animating
    }
  }
}

// Memory-safe animation state hook
export const useAnimationState = () => {
  const [isAnimating, setIsAnimating] = React.useState(false)
  
  const startAnimation = () => setIsAnimating(true)
  const endAnimation = () => setIsAnimating(false)
  
  return { isAnimating, startAnimation, endAnimation }
}

// Reduced motion utility for accessibility
export const shouldReduceMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Performance-first animation wrapper
export const createOptimizedMotion = (baseVariants: any) => {
  const device = detectDevice()
  const reduceMotion = shouldReduceMotion()
  
  if (reduceMotion || device.isMobile) {
    // Simplified animations for better performance
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.15 }
    }
  }
  
  return baseVariants
} 