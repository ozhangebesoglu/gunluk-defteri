const knex = require('knex')
const path = require('path')
const os = require('os')
const { app } = require('electron')

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

// Debug logs
log.info('🔍 Environment detection:')
log.info(`  - NODE_ENV: ${environment}`)
log.info(`  - isElectron: ${isElectron}`)
log.info(`  - isDev: ${isDev}`)
log.info(`  - isPackaged: ${isPackaged}`)

let dbConfig

// Production Electron (packaged app) için SQLite kullan
if (isElectron && (isPackaged || environment === 'production')) {
  // Production Electron: SQLite kullan
  let dbPath
  try {
    const userDataPath = app.getPath('userData')
    dbPath = path.join(userDataPath, 'gunce-database.sqlite')
  } catch (error) {
    // App henüz ready değilse temp path kullan
    dbPath = path.join(os.tmpdir(), 'gunce-database.sqlite')
    log.warn('⚠️ App.getPath not ready, using temp path:', dbPath)
  }
  
  // Production'da migration'lar app resources'da
  const appPath = app ? app.getAppPath() : __dirname
  const migrationsPath = path.join(appPath, 'db', 'migrations-sqlite')
  const seedsPath = path.join(appPath, 'db', 'seeds')
  
  dbConfig = {
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    migrations: {
      directory: migrationsPath,
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: seedsPath
    }
  }
  
  log.info('📱 Electron SQLite mode:', dbPath)
  log.info('📁 Migrations path:', migrationsPath)
} else {
  // Development veya Web: PostgreSQL kullan
  dbConfig = databaseConfig[environment]
  log.info('🐘 PostgreSQL mode:', environment)
}

// Veritabanı bağlantısını oluştur
const db = knex(dbConfig)

// Bağlantı testi ve hata yönetimi
async function initDatabase() {
  try {
    // Veritabanı bağlantısını test et
    await db.raw('SELECT 1+1 as result')
    const dbType = dbConfig.client === 'pg' ? 'PostgreSQL' : 'SQLite'
    log.info(`✅ ${dbType} bağlantısı başarılı`)
    
    // Migration'ları kontrol et
    const [batch, log_] = await db.migrate.currentVersion()
    log.info(`🔧 Mevcut migration versiyonu: ${batch}`)
    
    return true
  } catch (error) {
    log.error('❌ Veritabanı bağlantı hatası:', error.message)
    throw error
  }
}

// Veritabanı bağlantısını kapat
async function closeDatabase() {
  try {
    await db.destroy()
    log.info('🔒 Veritabanı bağlantısı kapatıldı')
  } catch (error) {
    log.error('❌ Veritabanı kapatma hatası:', error.message)
  }
}

// Güvenli sorgu yürütme wrapper'ı
async function safeQuery(queryFn, errorMessage = 'Veritabanı işlemi başarısız') {
  try {
    return await queryFn()
  } catch (error) {
    log.error(errorMessage, error.message)
    throw new Error(errorMessage)
  }
}

// Migration'ları çalıştır
async function runMigrations() {
  try {
    const [batch, log_] = await db.migrate.latest()
    if (log_.length === 0) {
      log.info('📦 Tüm migration\'lar güncel')
    } else {
      log.info(`📦 ${log_.length} migration başarıyla çalıştırıldı:`, log_)
    }
    return true
  } catch (error) {
    log.error('❌ Migration hatası:', error.message)
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