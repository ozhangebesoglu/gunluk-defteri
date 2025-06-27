// Environment Configuration for Frontend
interface EnvironmentConfig {
  // Environment
  isDev: boolean
  isProd: boolean
  isTest: boolean
  
  // API
  apiBaseUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
  
  // Features
  enablePWA: boolean
  enableOffline: boolean
  enableAnalytics: boolean
  enableEncryption: boolean
  
  // UI/UX
  defaultTheme: 'light' | 'dark'
  enableThemeToggle: boolean
  defaultLanguage: string
  
  // Security
  enableCSP: boolean
}

class EnvironmentManager {
  private config: EnvironmentConfig

  constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  private loadConfig(): EnvironmentConfig {
    const env = import.meta.env.MODE || 'development'
    
    return {
      // Environment detection
      isDev: env === 'development',
      isProd: env === 'production',
      isTest: env === 'test',
      
      // API Configuration
      apiBaseUrl: this.getApiBaseUrl(),
      supabaseUrl: this.getRequiredEnv('VITE_SUPABASE_URL'),
      supabaseAnonKey: this.getRequiredEnv('VITE_SUPABASE_ANON_KEY'),
      
      // Feature Flags
      enablePWA: this.getBooleanEnv('VITE_ENABLE_PWA', true),
      enableOffline: this.getBooleanEnv('VITE_ENABLE_OFFLINE', true),
      enableAnalytics: this.getBooleanEnv('VITE_ENABLE_ANALYTICS', false),
      enableEncryption: this.getBooleanEnv('VITE_ENABLE_ENCRYPTION', true),
      
      // UI/UX Settings
      defaultTheme: (import.meta.env.VITE_DEFAULT_THEME as 'light' | 'dark') || 'dark',
      enableThemeToggle: this.getBooleanEnv('VITE_ENABLE_THEME_TOGGLE', true),
      defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE || 'tr',
      
      // Security Settings
      enableCSP: this.getBooleanEnv('VITE_ENABLE_CSP', true)
    }
  }

  private getApiBaseUrl(): string {
    // Production URL override
    if (this.config?.isProd && import.meta.env.VITE_PROD_API_URL) {
      return import.meta.env.VITE_PROD_API_URL
    }
    
    // Development/default URL
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'
  }

  private getRequiredEnv(key: string): string {
    const value = import.meta.env[key]
    if (!value) {
      throw new Error(`Required environment variable ${key} is missing`)
    }
    return value
  }

  private getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
    const value = import.meta.env[key]
    if (value === undefined) return defaultValue
    return value === 'true' || value === '1'
  }

  private validateConfig(): void {
    const errors: string[] = []

    // Validate Supabase URL format
    if (!this.config.supabaseUrl.startsWith('https://')) {
      errors.push('VITE_SUPABASE_URL must start with https://')
    }

    // Validate Supabase key format (basic check)
    if (this.config.supabaseAnonKey.length < 100) {
      errors.push('VITE_SUPABASE_ANON_KEY appears to be invalid (too short)')
    }

    // Validate API URL format
    if (!this.config.apiBaseUrl.startsWith('http')) {
      errors.push('VITE_API_BASE_URL must be a valid HTTP URL')
    }

    if (errors.length > 0) {
      console.error('Environment configuration errors:', errors)
      if (this.config.isProd) {
        throw new Error(`Environment validation failed: ${errors.join(', ')}`)
      }
    }
  }

  // Public getters
  get environment(): string {
    return import.meta.env.MODE
  }

  get isDevelopment(): boolean {
    return this.config.isDev
  }

  get isProduction(): boolean {
    return this.config.isProd
  }

  get api(): { baseUrl: string } {
    return {
      baseUrl: this.config.apiBaseUrl
    }
  }

  get supabase(): { url: string; anonKey: string } {
    return {
      url: this.config.supabaseUrl,
      anonKey: this.config.supabaseAnonKey
    }
  }

  get features(): {
    pwa: boolean
    offline: boolean
    analytics: boolean
    encryption: boolean
  } {
    return {
      pwa: this.config.enablePWA,
      offline: this.config.enableOffline,
      analytics: this.config.enableAnalytics,
      encryption: this.config.enableEncryption
    }
  }

  get ui(): {
    defaultTheme: 'light' | 'dark'
    enableThemeToggle: boolean
    defaultLanguage: string
  } {
    return {
      defaultTheme: this.config.defaultTheme,
      enableThemeToggle: this.config.enableThemeToggle,
      defaultLanguage: this.config.defaultLanguage
    }
  }

  get security(): { enableCSP: boolean } {
    return {
      enableCSP: this.config.enableCSP
    }
  }

  // Utility methods
  getFullConfig(): EnvironmentConfig {
    return { ...this.config }
  }

  logConfig(): void {
    if (this.config.isDev) {
      console.group('🔧 Environment Configuration')
      console.log('Environment:', this.environment)
      console.log('API Base URL:', this.config.apiBaseUrl)
      console.log('Features:', this.features)
      console.log('UI Settings:', this.ui)
      console.groupEnd()
    }
  }
}

// Export singleton instance
export const envConfig = new EnvironmentManager()

// Export types for TypeScript
export type { EnvironmentConfig }

// Export default for backward compatibility
export default envConfig 