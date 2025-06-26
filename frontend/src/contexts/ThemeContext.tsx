import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  borderLight: string;
}

interface ThemeContextType {
  isDarkTheme: boolean;
  setIsDarkTheme: (isDark: boolean) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

// Rich Brown + Gold dark theme color scheme
const darkThemeColors: ThemeColors = {
  background: 'rich-brown-900',     // Rich brown background
  surface: 'rich-brown-800',        // Warm brown surface
  surfaceHover: 'rich-brown-700',   // Lighter brown hover
  textPrimary: 'rich-brown-100',    // Cream white text
  textSecondary: 'rich-brown-300',  // Light brown text
  textMuted: 'rich-brown-400',      // Muted brown text
  accent: 'warm-gold-500',          // Real gold accent
  accentHover: 'warm-gold-400',     // Lighter gold hover
  border: 'rich-brown-600',         // Brown border
  borderLight: 'rich-brown-500'     // Light brown border
};

// Light theme colors (keeping the good existing ones)
const lightThemeColors: ThemeColors = {
  background: 'amber-50',
  surface: 'white/80',
  surfaceHover: 'white',
  textPrimary: 'amber-900',
  textSecondary: 'amber-700',
  textMuted: 'amber-600',
  accent: 'amber-600',
  accentHover: 'amber-700',
  border: 'orange-200',
  borderLight: 'orange-100'
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Safe localStorage access for Electron
  const getStoredTheme = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('diary-theme');
      }
    } catch (error) {
      console.warn('localStorage access failed:', error);
    }
    return null;
  };

  const setStoredTheme = (theme: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('diary-theme', theme);
      }
    } catch (error) {
      console.warn('localStorage write failed:', error);
    }
  };

  // Initialize theme from localStorage or system preference
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = getStoredTheme();
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    
    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch (error) {
        console.warn('matchMedia failed:', error);
      }
    }
    
    return false;
  });

  // Persist theme to localStorage
  useEffect(() => {
    setStoredTheme(isDarkTheme ? 'dark' : 'light');
    
    // Force update body class for immediate visual change
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('dark', isDarkTheme);
    }
  }, [isDarkTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't manually set a preference
        const savedTheme = getStoredTheme();
        if (!savedTheme) {
          setIsDarkTheme(e.matches);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (error) {
      console.warn('Media query listener failed:', error);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  const colors = isDarkTheme ? darkThemeColors : lightThemeColors;

  return (
    <ThemeContext.Provider value={{ 
      isDarkTheme, 
      setIsDarkTheme, 
      toggleTheme,
      colors 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}; 