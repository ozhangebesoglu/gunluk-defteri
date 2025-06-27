const path = require('path')
const fs = require('fs')

class BackendEnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development'
    this.isDev = this.env === 'development'
    this.isProd = this.env === 'production'
    this.isTest = this.env === 'test'
    
    // Load environment variables
    this.loadEnvFiles()
    
    // Validate required variables
    this.validateRequiredVars()
  }

  loadEnvFiles() {
    try {
      // Try to load .env files with fallbacks
      const envPaths = [
        path.join(process.cwd(), '.env'),
        path.join(process.cwd(), '.env.local'),
        path.join(__dirname, '../.env'),
        path.join(__dirname, '../../.env')
      ]

      for (const envPath of envPaths) {
        if (fs.existsSync(envPath)) {
          this.parseEnvFile(envPath)
          console.log(`[BACKEND-ENV] Loaded: ${envPath}`)
          break
        }
      }
    } catch (error) {
      console.warn('[BACKEND-ENV] Could not load .env file:', error.message)
    }
  }

  parseEnvFile(filePath) {
    try {
      const envContent = fs.readFileSync(filePath, 'utf8')
      const lines = envContent.split('\n')
      
      lines.forEach(line => {
        line = line.trim()
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...valueParts] = line.split('=')
          const value = valueParts.join('=').trim()
          
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '')
          
          // Only set if not already in process.env
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = cleanValue
          }
        }
      })
    } catch (error) {
      console.error('[BACKEND-ENV] Error parsing .env file:', error.message)
    }
  }

  validateRequiredVars() {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY'
    ]

    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      console.warn('[BACKEND-ENV] Missing required environment variables:', missing)
      if (this.isProd) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
      }
    }
  }

  // Server Configuration
  getServerConfig() {
    return {
      port: parseInt(process.env.PORT) || 3001,
      host: process.env.HOST || 'localhost',
      env: this.env
    }
  }

  // Supabase Configuration
  getSupabaseConfig() {
    const url = this.isProd && process.env.PROD_SUPABASE_URL 
      ? process.env.PROD_SUPABASE_URL 
      : process.env.SUPABASE_URL

    const serviceKey = this.isProd && process.env.PROD_SUPABASE_KEY
      ? process.env.PROD_SUPABASE_KEY
      : process.env.SUPABASE_SERVICE_KEY

    if (!url || !serviceKey) {
      throw new Error('Supabase configuration missing. Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.')
    }

    return { url, serviceKey }
  }

  // Security Configuration
  getSecurityConfig() {
    return {
      jwtSecret: process.env.JWT_SECRET || this.generateSecret(),
      apiKey: process.env.API_KEY || this.generateSecret(),
      enableHelmet: this.getBooleanEnv('ENABLE_HELMET_SECURITY', true),
      enableRateLimit: this.getBooleanEnv('ENABLE_RATE_LIMITING', true)
    }
  }

  // CORS Configuration
  getCorsConfig() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:5173', 'http://localhost:3000', 'file://']

    // Production CORS override
    if (this.isProd && process.env.PROD_ALLOWED_ORIGINS) {
      const prodOrigins = process.env.PROD_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      return {
        origins: prodOrigins,
        credentials: true
      }
    }

    return {
      origins: allowedOrigins,
      credentials: true
    }
  }

  // Rate Limiting Configuration
  getRateLimitConfig() {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      enabled: this.getBooleanEnv('ENABLE_RATE_LIMITING', true)
    }
  }

  // Logging Configuration
  getLoggingConfig() {
    return {
      level: process.env.LOG_LEVEL || (this.isDev ? 'debug' : 'info'),
      filePath: process.env.LOG_FILE_PATH || './logs/backend.log',
      enableRequestLogging: this.getBooleanEnv('ENABLE_REQUEST_LOGGING', this.isDev),
      enableFileLogging: this.getBooleanEnv('ENABLE_FILE_LOGGING', this.isProd)
    }
  }

  // Database Configuration (fallback)
  getDatabaseConfig() {
    if (process.env.DATABASE_URL) {
      return {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        ssl: this.isProd ? { rejectUnauthorized: false } : false
      }
    }

    return null // Use Supabase by default
  }

  // Feature Flags
  getFeatureFlags() {
    return {
      compression: this.getBooleanEnv('ENABLE_COMPRESSION', true),
      helmet: this.getBooleanEnv('ENABLE_HELMET_SECURITY', true),
      rateLimit: this.getBooleanEnv('ENABLE_RATE_LIMITING', true),
      requestLogging: this.getBooleanEnv('ENABLE_REQUEST_LOGGING', this.isDev)
    }
  }

  // Utility functions
  getBooleanEnv(key, defaultValue = false) {
    const value = process.env[key]
    if (value === undefined) return defaultValue
    return value === 'true' || value === '1'
  }

  generateSecret() {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }

  // Getters for common values
  get nodeEnv() { return this.env }
  get isProduction() { return this.isProd }
  get isDevelopment() { return this.isDev }
  get isTest() { return this.isTest }

  // Export all config as object
  getConfig() {
    return {
      env: this.env,
      isDev: this.isDev,
      isProd: this.isProd,
      isTest: this.isTest,
      server: this.getServerConfig(),
      supabase: this.getSupabaseConfig(),
      security: this.getSecurityConfig(),
      cors: this.getCorsConfig(),
      rateLimit: this.getRateLimitConfig(),
      logging: this.getLoggingConfig(),
      database: this.getDatabaseConfig(),
      features: this.getFeatureFlags()
    }
  }

  // Log configuration (development only)
  logConfig() {
    if (this.isDev) {
      console.group('🔧 Backend Environment Configuration')
      console.log('Environment:', this.env)
      console.log('Server:', this.getServerConfig())
      console.log('CORS Origins:', this.getCorsConfig().origins)
      console.log('Features:', this.getFeatureFlags())
      console.groupEnd()
    }
  }
}

// Export singleton instance
const backendEnvConfig = new BackendEnvironmentConfig()
module.exports = backendEnvConfig 