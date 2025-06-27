const knex = require('knex')
const path = require('path')
const os = require('os')
const { app } = require('electron')
const logger = require('./utils/logger')
const envConfig = require('./config/env')

// Logging utility - fallback to console if electron-log fails
let log
try {
  log = require('electron-log')
} catch (error) {
  console.warn('electron-log not available, using console fallback')
  log = {
    info: console.log,
    warn: console.warn,
    error: console.error
  }
}

const environment = process.env.NODE_ENV || 'development'

// Inline database configuration - production build için
const databaseConfig = {
  development: {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 5433,
      user: 'postgres',
      password: 'postgres',
      database: 'diary_app',
      ssl: false
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds'
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200
    }
  },
  
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'diary_user',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'diary_app',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './db/seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
}

// Electron için SQLite kullan, web için PostgreSQL
const isElectron = typeof process !== 'undefined' && process.versions && process.versions.electron
const isDev = environment === 'development'
const isPackaged = app && app.isPackaged

// Use environment configuration
const config = envConfig.getConfig()
logger.info('Environment detection from config:')
logger.info(`Environment: ${config.env}`)
logger.info(`isElectron: ${config.isElectron}`)
logger.info(`isDev: ${config.isDev}`)
logger.info(`isProd: ${config.isProd}`)

// Get database configuration from environment config
const dbConfig = config.database

logger.db('Database configuration loaded:', dbConfig.client)
if (dbConfig.connection?.filename) {
  logger.db('SQLite path:', dbConfig.connection.filename)
} else if (dbConfig.connection?.host) {
  logger.db('PostgreSQL host:', dbConfig.connection.host)
}

// Veritabanı bağlantısını oluştur
const db = knex(dbConfig)

// Bağlantı testi ve hata yönetimi
async function initDatabase() {
  try {
    // Veritabanı bağlantısını test et
    await db.raw('SELECT 1+1 as result')
    const dbType = dbConfig.client === 'pg' ? 'PostgreSQL' : 'SQLite'
    logger.success(`${dbType} connection successful`)
    
    // Migration'ları kontrol et
    const [batch, log_] = await db.migrate.currentVersion()
    logger.db(`Current migration version: ${batch}`)
    
    return true
  } catch (error) {
    logger.error('Database connection error:', error)
    throw error
  }
}

// Veritabanı bağlantısını kapat
async function closeDatabase() {
  try {
    await db.destroy()
    logger.info('Database connection closed')
  } catch (error) {
    logger.error('Database close error:', error)
  }
}

// Güvenli sorgu yürütme wrapper'ı
async function safeQuery(queryFn, errorMessage = 'Database operation failed') {
  try {
    return await queryFn()
  } catch (error) {
    logger.error(errorMessage, error)
    throw new Error(errorMessage)
  }
}

// Migration'ları çalıştır
async function runMigrations() {
  try {
    const [batch, log_] = await db.migrate.latest()
    if (log_.length === 0) {
      logger.db('All migrations up to date')
    } else {
      logger.success(`${log_.length} migrations executed successfully:`, log_)
    }
    return true
  } catch (error) {
    logger.error('Migration error:', error)
    throw error
  }
}

// Health check
async function healthCheck() {
  try {
    // SQLite ve PostgreSQL uyumlu query
    const isPostgreSQL = dbConfig.client === 'pg'
    
    if (isPostgreSQL) {
      const result = await db.raw('SELECT NOW() as current_time')
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        version: await db.migrate.currentVersion()
      }
    } else {
      // SQLite
      const result = await db.raw("SELECT datetime('now') as current_time")
      return {
        status: 'healthy',
        timestamp: result[0].current_time,
        version: await db.migrate.currentVersion()
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

module.exports = {
  db,
  initDatabase,
  closeDatabase,
  safeQuery,
  runMigrations,
  healthCheck
} 