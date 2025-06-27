const path = require('path')
const fs = require('fs')
const { app } = require('electron')
require('dotenv').config()

class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development'
    this.isDev = this.env === 'development'
    this.isProd = this.env === 'production'
    this.isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron
    
    // Load environment variables with dotenv
    this.loadEnvFiles()
    
    // Validate required variables
    this.validateRequiredVars()
  }

  loadEnvFiles() {
    try {
      // dotenv is already loaded at the top, but let's also try additional paths
      const envPaths = [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '.env.local'),
        path.join(app ? app.getAppPath() : process.cwd(), '.env'),
        path.join(__dirname, '../../../.env')
      ]

      let loaded = false
      for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
          require('dotenv').config({ path: envPath })
          console.log(`[ENV] Loaded: ${envPath}`)
          loaded = true
          break
        }
      }
      
      if (!loaded) {
        console.warn('[ENV] No .env file found in expected paths')
      }
    } catch (error) {
      console.warn('[ENV] Could not load .env file:', error.message)
    }
  }

  validateRequiredVars() {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      console.warn('[ENV] Missing required environment variables:', missing)
      console.log('[ENV] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    }
  }

  // Database Configuration
  getDatabaseConfig() {
    if (this.isElectron && this.isProd) {
      // Production Electron: SQLite
      return {
        client: 'sqlite3',
        connection: {
          filename: this.getSQLitePath()
        },
        useNullAsDefault: true
      }
    } else {
      // Development: PostgreSQL
      return {
        client: 'pg',
        connection: {
          host: process.env.DB_HOST || '127.0.0.1',
          port: parseInt(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER || 'diary_user',
          password: process.env.DB_PASSWORD || 'secure_password_123',
          database: process.env.DB_NAME || 'diary_app',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        }
      }
    }
  }

  // Supabase Configuration
  getSupabaseConfig() {
    const url = this.isProd && process.env.PROD_SUPABASE_URL 
      ? process.env.PROD_SUPABASE_URL 
      : process.env.SUPABASE_URL

    const key = this.isProd && process.env.PROD_SUPABASE_KEY
      ? process.env.PROD_SUPABASE_KEY
      : process.env.SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase configuration missing. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
    }

    return { url, key }
  }

  // Security Configuration
  getSecurityConfig() {
    return {
      appSecret: process.env.APP_SECRET || this.generateSecret(),
      encryptionKey: process.env.ENCRYPTION_KEY || this.generateEncryptionKey(),
      enableEncryption: process.env.ENABLE_ENCRYPTION !== 'false',
      enableCloudSync: process.env.ENABLE_CLOUD_SYNC !== 'false'
    }
  }

  // Feature Flags
  getFeatureFlags() {
    return {
      encryption: process.env.ENABLE_ENCRYPTION !== 'false',
      cloudSync: process.env.ENABLE_CLOUD_SYNC !== 'false',
      analytics: process.env.ENABLE_ANALYTICS === 'true',
      pwa: process.env.ENABLE_PWA !== 'false'
    }
  }

  // Paths
  getSQLitePath() {
    try {
      const userDataPath = app ? app.getPath('userData') : process.cwd()
      return path.join(userDataPath, 'gunce-database.sqlite')
    } catch (error) {
      return path.join(process.cwd(), 'gunce-database.sqlite')
    }
  }

  // Utility functions
  generateSecret() {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }

  generateEncryptionKey() {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }

  // Getters for common values
  get nodeEnv() { return this.env }
  get isProduction() { return this.isProd }
  get isDevelopment() { return this.isDev }
  get isElectronApp() { return this.isElectron }

  // Export all config as object
  getConfig() {
    return {
      env: this.env,
      isDev: this.isDev,
      isProd: this.isProd,
      isElectron: this.isElectron,
      database: this.getDatabaseConfig(),
      supabase: this.getSupabaseConfig(),
      security: this.getSecurityConfig(),
      features: this.getFeatureFlags(),
      paths: {
        sqlite: this.getSQLitePath()
      }
    }
  }
}

// Export singleton instance
const envConfig = new EnvironmentConfig()
module.exports = envConfig 