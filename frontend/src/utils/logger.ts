class Logger {
  private isDev: boolean

  constructor() {
    this.isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
  }

  private formatMessage(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (data) {
      console[level](prefix, message, data)
    } else {
      console[level](prefix, message)
    }
  }

  /**
   * Development only logging - completely removed in production
   */
  debug(message: string, data?: any): void {
    if (!this.isDev) return
    this.formatMessage('debug', `🔍 ${message}`, data)
  }

  /**
   * Development only info logging
   */
  info(message: string, data?: any): void {
    if (!this.isDev) return
    this.formatMessage('info', `ℹ️ ${message}`, data)
  }

  /**
   * Development + production warnings
   */
  warn(message: string, data?: any): void {
    this.formatMessage('warn', `⚠️ ${message}`, data)
  }

  /**
   * Always log errors (development + production)
   */
  error(message: string, error?: any): void {
    this.formatMessage('error', `❌ ${message}`, error)
  }

  /**
   * Success messages (development only)
   */
  success(message: string, data?: any): void {
    if (!this.isDev) return
    this.formatMessage('info', `✅ ${message}`, data)
  }

  /**
   * API operation logging (development only)
   */
  api(operation: string, details?: any): void {
    if (!this.isDev) return
    this.formatMessage('info', `🔄 API: ${operation}`, details)
  }

  /**
   * Database operation logging (development only) 
   */
  db(operation: string, details?: any): void {
    if (!this.isDev) return
    this.formatMessage('info', `🗄️ DB: ${operation}`, details)
  }

  /**
   * Navigation logging (development only)
   */
  nav(action: string, details?: any): void {
    if (!this.isDev) return
    this.formatMessage('info', `🧭 NAV: ${action}`, details)
  }

  /**
   * Performance logging (development only)
   */
  perf(operation: string, timeMs?: number): void {
    if (!this.isDev) return
    const timeStr = timeMs ? ` (${timeMs}ms)` : ''
    this.formatMessage('info', `⚡ PERF: ${operation}${timeStr}`)
  }

  /**
   * Security related logging (always log)
   */
  security(message: string, details?: any): void {
    this.formatMessage('warn', `🔒 SECURITY: ${message}`, details)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export for backward compatibility
export default logger 