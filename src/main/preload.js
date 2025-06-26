const { contextBridge, ipcRenderer } = require('electron')

// Güvenli API'leri expose et
contextBridge.exposeInMainWorld('electronAPI', {
  // Sistem bilgileri
  platform: process.platform,
  version: process.versions.electron,

  // Veritabanı işlemleri
  db: {
    healthCheck: () => ipcRenderer.invoke('db:health-check')
  },

  // Günlük işlemleri
  diary: {
    getEntries: (filters) => ipcRenderer.invoke('diary:getEntries', filters),
    getEntry: (id) => ipcRenderer.invoke('diary:getEntry', id),
    createEntry: (entry) => ipcRenderer.invoke('diary:createEntry', entry),
    updateEntry: (id, entry) => ipcRenderer.invoke('diary:updateEntry', id, entry),
    deleteEntry: (id) => ipcRenderer.invoke('diary:deleteEntry', id),
    deleteAllEntries: () => ipcRenderer.invoke('diary:deleteAllEntries'),
    
    // Etiket işlemleri
    getTags: () => ipcRenderer.invoke('diary:getTags'),
    
    // İstatistik işlemleri
    getStatistics: () => ipcRenderer.invoke('diary:get-statistics'),
    
    // Arama işlemleri
    search: (query, filters) => ipcRenderer.invoke('diary:search', query, filters),
    createTag: (tag) => ipcRenderer.invoke('diary:createTag', tag)
  },

  // Backup işlemleri
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: (backupData) => ipcRenderer.invoke('backup:restore', backupData),
    autoCreate: () => ipcRenderer.invoke('backup:auto-create')
  },

  // 📱 Settings Management
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (newSettings) => ipcRenderer.invoke('settings:update', newSettings)
  },

  // 🔔 Notification Management
  notification: {
    show: (title, body, options) => ipcRenderer.invoke('notification:show', title, body, options),
    scheduleReminder: () => ipcRenderer.invoke('notification:schedule-reminder'),
    test: () => ipcRenderer.invoke('notification:test')
  },

  // 🔐 Password Protection
  password: {
    set: (password) => ipcRenderer.invoke('password:set', password),
    remove: () => ipcRenderer.invoke('password:remove'),
    check: (password) => ipcRenderer.invoke('password:check', password)
  },

  // Şifreleme işlemleri
  encryption: {
    encrypt: (data, password) => ipcRenderer.invoke('encrypt:data', data, password),
    decrypt: (encryptedData, password) => ipcRenderer.invoke('decrypt:data', encryptedData, password)
  },

  // Sentiment Analysis
  sentiment: {
    analyze: (text) => ipcRenderer.invoke('sentiment:analyze', text)
  },

  // App Controls
  app: {
    showWindow: () => ipcRenderer.invoke('app:show-window'),
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPlatform: () => ipcRenderer.invoke('app:get-platform')
  },

  // Window Controls (Context7-style frameless window)
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // Event listeners (güvenli wrapper'lar)
  on: {
    // Navigation events
    navigateToNewEntry: (callback) => {
      const listener = () => callback()
      ipcRenderer.on('navigate-to-new-entry', listener)
      return () => ipcRenderer.removeListener('navigate-to-new-entry', listener)
    },
    
    // Notification events
    notificationClick: (callback) => {
      const listener = (event, data) => callback(data)
      ipcRenderer.on('notification-click', listener)
      return () => ipcRenderer.removeListener('notification-click', listener)
    },

    // Güncelleme progress'i
    updateProgress: (callback) => {
      const listener = (_event, value) => callback(value)
      ipcRenderer.on('update-progress', listener)
      return () => ipcRenderer.removeListener('update-progress', listener)
    }
  },

  // Log işlemleri (sadece development için)
  log: {
    info: (message) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Info:', message)
      }
    },
    warn: (message) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Warning:', message)
      }
    },
    error: (message) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', message)
      }
    }
  }
})

// Password dialog için özel API (sadece şifre penceresi için)
if (window.location.protocol === 'data:') {
  contextBridge.exposeInMainWorld('electronAPI', {
    checkPassword: (password) => ipcRenderer.invoke('check-password', password),
    closePassword: (success) => ipcRenderer.invoke('close-password', success),
    cancelPassword: () => ipcRenderer.invoke('cancel-password'),
    onPasswordResult: (callback) => {
      ipcRenderer.on('password-result', (event, result) => callback(result))
    }
  })
}

// Development mode için ek bilgiler
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    isDev: true,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    electronVersion: process.versions.electron
  })
}

// Güvenlik: window nesnesine doğrudan erişimi engelle
contextBridge.exposeInMainWorld('securityInfo', {
  contextIsolation: true,
  nodeIntegration: false,
  webSecurity: true
}) 