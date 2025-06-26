// Context7-style Haptic Feedback for Mobile/Tablet
export class HapticFeedback {
  private static isSupported = !!navigator.vibrate

  // Light feedback for button taps
  static light() {
    if (this.isSupported) {
      navigator.vibrate(10)
    }
  }

  // Medium feedback for important actions
  static medium() {
    if (this.isSupported) {
      navigator.vibrate(20)
    }
  }

  // Heavy feedback for critical actions
  static heavy() {
    if (this.isSupported) {
      navigator.vibrate([30, 10, 30])
    }
  }

  // Success pattern
  static success() {
    if (this.isSupported) {
      navigator.vibrate([10, 50, 10])
    }
  }

  // Error pattern
  static error() {
    if (this.isSupported) {
      navigator.vibrate([100, 50, 100, 50, 100])
    }
  }

  // Selection feedback
  static selection() {
    if (this.isSupported) {
      navigator.vibrate(5)
    }
  }

  // Check if device supports haptic feedback
  static isHapticSupported(): boolean {
    return this.isSupported
  }
}

// Touch feedback utility for Context7-style interactions
export const addTouchFeedback = (element: HTMLElement, type: 'light' | 'medium' | 'heavy' = 'light') => {
  const handleTouch = () => {
    switch (type) {
      case 'light':
        HapticFeedback.light()
        break
      case 'medium':
        HapticFeedback.medium()
        break
      case 'heavy':
        HapticFeedback.heavy()
        break
    }
  }

  element.addEventListener('touchstart', handleTouch, { passive: true })
  
  // Return cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouch)
  }
} 