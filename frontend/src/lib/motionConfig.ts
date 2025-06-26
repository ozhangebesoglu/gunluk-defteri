// Context7-style 120fps Motion Configuration
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

// Mobile-optimized animation variants
export const mobileVariants = {
  // Page transitions
  page: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: motionConfig.spring
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.98,
      transition: motionConfig.fastSpring
    }
  },
  
  // Button interactions
  button: {
    idle: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: motionConfig.fastSpring
    },
    tap: { 
      scale: 0.95,
      transition: motionConfig.touchSpring
    }
  },
  
  // Card hover effects
  card: {
    idle: { y: 0, scale: 1 },
    hover: { 
      y: -4, 
      scale: 1.02,
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
  
  // List item stagger
  listItem: {
    hidden: { opacity: 0, x: -20 },
    visible: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        ...motionConfig.spring,
        delay: custom * 0.05
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

// Performance optimization helper
export const getOptimizedTransition = (deviceInfo = detectDevice()) => {
  if (deviceInfo.isMobile) {
    return motionConfig.touchSpring
  } else if (deviceInfo.isTablet) {
    return motionConfig.fastSpring
  } else {
    return motionConfig.spring
  }
} 