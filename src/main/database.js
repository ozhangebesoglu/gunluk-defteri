const knex = require('knex')
const config = require('../../knexfile')
const log = require('electron-log')

const environment = process.env.NODE_ENV || 'development'
const dbConfig = config[environment]

// Veritabanı bağlantısını oluştur
const db = knex(dbConfig)

// Bağlantı testi ve hata yönetimi
async function initDatabase() {
  try {
    // Veritabanı bağlantısını test et
    await db.raw('SELECT 1+1 as result')
    log.info('✅ PostgreSQL bağlantısı başarılı')
    
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
    const result = await db.raw('SELECT NOW() as current_time')
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: await db.migrate.currentVersion()
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