const isDev = process.env.NODE_ENV === 'development'

class Logger {
  constructor() {
    this.isDev = isDev
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [ELECTRON-${level.toUpperCase()}]`
    
    if (data) {
      console[level](prefix, message, data)
    } else {
      console[level](prefix, message)
    }
  }

  /**
   * Development only logging - completely removed in production
   */
  debug(message, data) {
    if (!this.isDev) return
    this.formatMessage('debug', `🔍 ${message}`, data)
  }

  /**
   * Development only info logging
   */
  info(message, data) {
    if (!this.isDev) return
    this.formatMessage('info', `ℹ️ ${message}`, data)
  }

  /**
   * Development + production warnings
   */
  warn(message, data) {
    this.formatMessage('warn', `⚠️ ${message}`, data)
  }

  /**
   * Always log errors (development + production)
   */
  error(message, error) {
    this.formatMessage('error', `❌ ${message}`, error)
  }

  /**
   * Success messages (development only)
   */
  success(message, data) {
    if (!this.isDev) return
    this.formatMessage('info', `✅ ${message}`, data)
  }

  /**
   * Database operation logging (development only) 
   */
  db(operation, details) {
    if (!this.isDev) return
    this.formatMessage('info', `🗄️ DB: ${operation}`, details)
  }

  /**
   * Security related logging (always log)
   */
  security(message, details) {
    this.formatMessage('warn', `🔒 SECURITY: ${message}`, details)
  }

  /**
   * Performance logging (development only)
   */
  perf(operation, timeMs) {
    if (!this.isDev) return
    const timeStr = timeMs ? ` (${timeMs}ms)` : ''
    this.formatMessage('info', `⚡ PERF: ${operation}${timeStr}`)
  }
}

// Export singleton instance
const logger = new Logger()
module.exports = logger 