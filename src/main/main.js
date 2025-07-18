const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron')
const path = require('path')
const Store = require('electron-store')
const { initDatabase, closeDatabase, runMigrations, healthCheck } = require('./database')
const diaryService = require('./services/diaryService')
const EncryptionService = require('./services/encryptionService')
const createSentimentService = require('./services/sentimentService')
const logger = require('./utils/logger')
const db = require('./database')

// Initialize electron-store
const store = new Store()

// Initialize default password for testing if not set
async function initDefaultPassword() {
  try {
    const hasPassword = await store.has('password.hash')
    if (!hasPassword) {
      logger.security('Setting random default password for security')
      const defaultPassword = require('crypto').randomBytes(8).toString('hex')
      logger.security('Generated password:', { length: defaultPassword.length })
      const hashedPassword = await EncryptionService.hashPassword(defaultPassword)
      await store.set('password.hash', hashedPassword)
      await store.set('settings.passwordProtection', true)
      logger.success('Default password set successfully')
    }
  } catch (error) {
    logger.error('Error setting default password:', error)
  }
}

// Güvenlik ayarları
const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// Ana pencere referansı
let mainWindow = null

// Notification settings
let notificationTimer = null
let appSettings = {
  notifications: true,
  reminderTime: '19:00',
  dailyReminder: true,
  weekendReminder: false,
  passwordProtection: false,
  autoBackup: false
}

// Password protection
let isAppLocked = false
let passwordAttempts = 0
const MAX_PASSWORD_ATTEMPTS = 3

// Güvenlik: CSP ayarları
const cspRules = isDev ? [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws://localhost:*",
  "media-src 'self'"
].join('; ') : [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "media-src 'self'"
].join('; ')

// Password verification handlers (defined once at startup)
let passwordWindow = null

// Ana pencereyi oluştur
function createMainWindow() {
  logger.info('🚀 Ana pencere oluşturuluyor...')
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    resizable: true, // Pencere boyutlandırma izni
    maximizable: true, // Maksimize izni
    show: false, // Hazır olana kadar gizle
    title: 'Günce Defteri', // Window title
    
    // Context7-style: Clean frameless design
    frame: false,                                  // Çerçevesiz pencere (Context7-like)
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    
    webPreferences: {
      // Güvenlik ayarları
      nodeIntegration: false,                    // Güvenlik için kapalı
      contextIsolation: true,                    // Güvenlik için açık
      enableRemoteModule: false,                 // Güvenli olmayan uzak modül kapalı
      webSecurity: true,                         // Web güvenliği açık
      allowRunningInsecureContent: false,        // HTTP içerik yasak
      experimentalFeatures: false,               // Deneysel özellikler kapalı
      
      // Preload script
      preload: path.join(__dirname, 'preload.js'),
      
      // Sandboxing
      sandbox: false, // Preload için gerekli
      
      // Diğer güvenlik ayarları
      disableBlinkFeatures: 'Auxclick', // Orta tık güvenliği
    },
    
    // Pencere ayarları
    icon: path.join(__dirname, '../../build/icon.png'),
    
    // Güvenlik
    webSecurity: true
  })

  // CSP header'ını ayarla
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspRules]
      }
    })
  })

  // URL yükleme
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // Development tools
    mainWindow.webContents.openDevTools()
  } else {
    // Production build path
    const frontendPath = path.join(__dirname, '../../frontend/dist/index.html')
    logger.info('📂 Frontend path:', frontendPath)
    mainWindow.loadFile(frontendPath)
  }

  // Güvenli navigasyon kontrolü
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (isDev && parsedUrl.origin === 'http://localhost:5173') {
      return // Development server'a izin ver
    }
    
    if (!isDev && parsedUrl.protocol === 'file:') {
      return // Production'da dosya protokolüne izin ver
    }
    
    // Diğer tüm navigasyonları engelle
    event.preventDefault()
    logger.warn('🚫 Güvenlik: Engellenen navigasyon:', navigationUrl)
  })

  // Güvenli pencere açma kontrolü
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Sadece HTTPS linklerine dış tarayıcıda izin ver
    if (url.startsWith('https://')) {
      shell.openExternal(url)
    } else {
      logger.warn('🚫 Güvenlik: Engellenen pencere açma:', url)
    }
    return { action: 'deny' }
  })

  // Pencere hazır olduğunda göster
  mainWindow.once('ready-to-show', async () => {
    logger.info('✨ Ana pencere hazır - şifre kontrolü yapılıyor...')
    
    try {
      const passwordOk = await checkPasswordProtection()
      
      if (passwordOk) {
        logger.info('🔓 Şifre kontrolü başarılı - ana pencere gösteriliyor')
        mainWindow.show()
        
        if (isDev) {
          mainWindow.focus()
        }
      } else {
        logger.error('❌ Şifre kontrolü başarısız - uygulama kapatılıyor')
        app.quit()
      }
    } catch (error) {
      logger.error('❌ Şifre kontrolü sırasında hata:', error)
      app.quit()
    }
  })

  // Pencere kapandığında
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

// Context7-style: Clean UI - No menu bar
function createApplicationMenu() {
  // Menü çubuğunu tamamen kaldır (Context7-like clean interface)
  Menu.setApplicationMenu(null)
  
  // Sadece macOS için minimal menü (uygulama kapanabilmesi için)
  if (process.platform === 'darwin') {
    const template = [
      {
        label: app.getName(),
        submenu: [
          { label: 'Günlük Defteri Hakkında', role: 'about' },
          { type: 'separator' },
          { label: 'Hizmetler', role: 'services', submenu: [] },
          { type: 'separator' },
          { label: 'Gizle', accelerator: 'Command+H', role: 'hide' },
          { label: 'Diğerlerini Gizle', accelerator: 'Command+Alt+H', role: 'hideothers' },
          { label: 'Tümünü Göster', role: 'unhide' },
          { type: 'separator' },
          { label: 'Çıkış', accelerator: 'Command+Q', role: 'quit' }
        ]
      }
    ]
    
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}

// 🔔 Notification System
function initNotificationSystem() {
  logger.info('🔔 Notification sistemi başlatılıyor...')
  
  // Check if notifications are supported
  if (!Notification.isSupported()) {
    logger.warn('⚠️ Bu sistemde bildirimler desteklenmiyor')
    return
  }

  // Load settings
  loadAppSettings()
  
  // Schedule notifications if enabled
  if (appSettings.notifications && appSettings.dailyReminder) {
    scheduleDailyReminder()
  }
}

function loadAppSettings() {
  try {
    const fs = require('fs')
    const settingsPath = path.join(app.getPath('userData'), 'app-settings.json')
    
    if (fs.existsSync(settingsPath)) {
      const savedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      appSettings = { ...appSettings, ...savedSettings }
      logger.info('📱 Ayarlar yüklendi:', appSettings)
    }
  } catch (error) {
    logger.error('❌ Ayarlar yüklenemedi:', error)
  }
}

function saveAppSettings() {
  try {
    const fs = require('fs')
    const settingsPath = path.join(app.getPath('userData'), 'app-settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 2))
    logger.info('💾 Ayarlar kaydedildi')
  } catch (error) {
    logger.error('❌ Ayarlar kaydedilemedi:', error)
  }
}

function scheduleDailyReminder() {
  // Clear existing timer
  if (notificationTimer) {
    clearTimeout(notificationTimer)
  }

  const now = new Date()
  const [hour, minute] = appSettings.reminderTime.split(':').map(Number)
  const reminderTime = new Date()
  reminderTime.setHours(hour, minute, 0, 0)

  // If time has passed today, schedule for tomorrow
  if (reminderTime <= now) {
    reminderTime.setDate(reminderTime.getDate() + 1)
  }

  // Check if weekends are excluded
  if (!appSettings.weekendReminder) {
    const dayOfWeek = reminderTime.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      // Skip to Monday
      const daysToAdd = dayOfWeek === 0 ? 1 : 2
      reminderTime.setDate(reminderTime.getDate() + daysToAdd)
    }
  }

  const timeUntilReminder = reminderTime.getTime() - now.getTime()
  
  logger.info(`⏰ Günce hatırlatması planlandı: ${reminderTime.toLocaleString('tr-TR')} (${Math.round(timeUntilReminder / 1000 / 60)} dakika sonra)`)

  notificationTimer = setTimeout(() => {
    showDailyReminder()
    // Schedule next day
    scheduleDailyReminder()
  }, timeUntilReminder)
}

function showDailyReminder() {
  if (!appSettings.notifications || !appSettings.dailyReminder) {
    return
  }

  const today = new Date().toLocaleDateString('tr-TR')
  
  const notification = new Notification({
    title: '📝 Günce Zamanı!',
    body: `Bugünün anılarını kaydetme zamanı geldi. ${today} tarihli günce yazınızı yazmayı unutmayın! ✨`,
    icon: path.join(__dirname, '../../book_icon.png'),
    silent: false,
    urgency: 'normal',
    timeoutType: 'default'
  })

  notification.on('click', () => {
    // Focus main window and navigate to new entry
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.webContents.send('navigate-to-new-entry')
    }
  })

  notification.show()
  logger.info('🔔 Günce hatırlatması gönderildi')
}

function showCustomNotification(title, body, options = {}) {
  if (!appSettings.notifications) {
    return
  }

  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, '../../book_icon.png'),
    silent: options.silent || false,
    urgency: options.urgency || 'normal',
    ...options
  })

  if (options.onClick) {
    notification.on('click', options.onClick)
  }

  notification.show()
  return notification
}

// 🔐 Password Protection System
function initPasswordProtection() {
  logger.info('🔐 Şifre koruması sistemi başlatılıyor...')
  
  if (appSettings.passwordProtection) {
    isAppLocked = true
    logger.info('🔒 Uygulama kilitli - şifre gerekli')
  }
}

function checkPasswordProtection() {
  return new Promise(async (resolve) => {
    logger.security('Starting password protection check')
    logger.debug('Password protection enabled:', appSettings.passwordProtection)
    logger.debug('App locked:', isAppLocked)
    
    if (!appSettings.passwordProtection || !isAppLocked) {
      logger.success('No password protection needed')
      resolve(true)
      return
    }

    logger.security('Password protection required - creating dialog')

    // Create password dialog
    passwordWindow = new BrowserWindow({
      width: 500,
      height: 400,
      modal: true,
      parent: mainWindow,
      show: false,
      frame: false,
      resizable: false,
      center: true,
      minimizable: false,
      maximizable: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'password-preload.js')
      }
    })
    
    logger.debug('Password window created with preload:', path.join(__dirname, 'password-preload.js'))

    // Handle window close
    passwordWindow.on('closed', () => {
      passwordWindow = null
    })

    // Handle successful password
    const handlePasswordSuccess = () => {
      if (passwordWindow) {
        passwordWindow.close()
        passwordWindow = null
      }
      isAppLocked = false
      passwordAttempts = 0
      logger.info('✅ Şifre koruması başarılı - ana pencere açılıyor')
      resolve(true)
    }

    // Handle failed password
    const handlePasswordFailure = () => {
      if (passwordWindow) {
        passwordWindow.close()
        passwordWindow = null
      }
      logger.error('❌ Şifre koruması başarısız - uygulama kapatılıyor')
      resolve(false)
    }

    // Store resolve function for later use
    checkPasswordProtection.resolveFunction = resolve

    // Load HTML file
    passwordWindow.loadFile(path.join(__dirname, 'password-dialog.html'))
    
    passwordWindow.once('ready-to-show', () => {
      logger.debug('Password window ready to show')
      passwordWindow.show()
      
      // Development mode'da DevTools'u aç
      if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        logger.debug('Opening DevTools for password dialog')
        passwordWindow.webContents.openDevTools()
      }
    })
  })
}

// ===========================================
// 📡 IPC Handler Kurulumu
// ===========================================

// Pencere işlemleri
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

ipcMain.handle('app:getVersion', () => {
  return app.getVersion()
})

// ===========================================
// 📝 Günlük İşlemleri (Diary Handlers)
// ===========================================

// Diary handlers
ipcMain.handle('diary:getEntries', async (event, filters = {}) => {
  try {
    return await diaryService.getEntries(filters)
  } catch (error) {
    logger.error('Failed to get entries:', error)
    throw error
  }
})

ipcMain.handle('diary:getEntry', async (event, id) => {
  try {
    return await diaryService.getEntry(id)
  } catch (error) {
    logger.error('Failed to get entry:', error)
    throw error
  }
})

ipcMain.handle('diary:createEntry', async (event, entry) => {
  try {
    return await diaryService.createEntry(entry)
  } catch (error) {
    logger.error('Failed to create entry:', error)
    throw error
  }
})

ipcMain.handle('diary:updateEntry', async (event, id, entry) => {
  try {
    return await diaryService.updateEntry(id, entry)
  } catch (error) {
    logger.error('Failed to update entry:', error)
    throw error
  }
})

ipcMain.handle('diary:deleteEntry', async (event, id) => {
  try {
    return await diaryService.deleteEntry(id)
  } catch (error) {
    logger.error('Failed to delete entry:', error)
    throw error
  }
})

ipcMain.handle('diary:deleteAllEntries', async (event) => {
  try {
    return await diaryService.deleteAllEntries()
  } catch (error) {
    logger.error('Failed to delete all entries:', error)
    throw error
  }
})

ipcMain.handle('diary:getTags', async (event) => {
  return await diaryService.getTags()
})

// IPC Event Handlers
function setupIpcHandlers() {
  logger.info('🔌 IPC event handlers ayarlanıyor...')

  // --- Authentication ---
  ipcMain.on('set-auth-credentials', (event, { token, baseUrl }) => {
    logger.info('🔑 API kimlik bilgileri alındı, ayarlanıyor...')
    try {
      diaryService.setApiConfig({ token, baseUrl });
      logger.success('✅ API kimlik bilgileri başarıyla ayarlandı.');
    } catch (error) {
      logger.error('❌ API kimlik bilgilerini ayarlarken hata oluştu:', error);
    }
  });

  // --- Entries ---
  ipcMain.handle('entries:get-all', async (event, filters) => {
    return diaryService.getEntries(filters)
  })

  ipcMain.handle('entries:create', async (event, entryData) => {
    logger.info('✨ Yeni günlük kaydı oluşturuluyor...', { title: entryData.title })
    return diaryService.createEntry(entryData)
  })

  ipcMain.handle('entries:get-entry', async (event, id) => {
    return diaryService.getEntry(id)
  })

  ipcMain.handle('entries:update-entry', async (event, id, entryData) => {
    return diaryService.updateEntry(id, entryData)
  })

  ipcMain.handle('entries:delete-entry', async (event, id) => {
    return diaryService.deleteEntry(id)
  })

  ipcMain.handle('entries:get-tags', async () => {
    return diaryService.getTags()
  })

  ipcMain.handle('entries:get-statistics', async () => {
    return diaryService.getStatistics()
  })

  ipcMain.handle('entries:search', async (event, query, filters = {}) => {
    return diaryService.searchEntries(query, filters)
  })

  ipcMain.handle('sentiment:analyze', async (event, text) => {
    return SentimentService.analyzeSentiment(text)
  })

  ipcMain.handle('encrypt:data', async (event, data, password) => {
    return EncryptionService.encrypt(data, password)
  })

  ipcMain.handle('decrypt:data', async (event, encryptedData, password) => {
    return EncryptionService.decrypt(encryptedData, password)
  })

  ipcMain.handle('backup:create', async () => {
    return diaryService.createBackup()
  })

  ipcMain.handle('backup:restore', async (event, backupData) => {
    return diaryService.restoreBackup(backupData)
  })

  // 📱 Settings Management
  ipcMain.handle('settings:get', async () => {
    return appSettings
  })

  ipcMain.handle('settings:update', async (event, newSettings) => {
    appSettings = { ...appSettings, ...newSettings }
    saveAppSettings()
    
    // Update notification schedule if changed
    if (newSettings.notifications !== undefined || newSettings.reminderTime) {
      if (appSettings.notifications && appSettings.dailyReminder) {
        scheduleDailyReminder()
      } else if (notificationTimer) {
        clearTimeout(notificationTimer)
        notificationTimer = null
      }
    }
    
    return appSettings
  })

  // 🔔 Notification Management
  ipcMain.handle('notification:show', async (event, title, body, options = {}) => {
    return showCustomNotification(title, body, options)
  })

  ipcMain.handle('notification:schedule-reminder', async () => {
    if (appSettings.notifications && appSettings.dailyReminder) {
      scheduleDailyReminder()
      return true
    }
    return false
  })

  ipcMain.handle('notification:test', async () => {
    showCustomNotification(
      '🔔 Test Bildirimi', 
      'Bildirim sistemi çalışıyor! Günce yazmayı unutmayın.',
      { 
        onClick: () => {
          if (mainWindow) {
            mainWindow.focus()
          }
        }
      }
    )
    return true
  })

  // ===========================================
  // 🔐 Şifre Koruması Handler'ları
  // ===========================================

  ipcMain.handle('check-password', async (event, enteredPassword) => {
    logger.security('Password verification attempt', { passwordLength: enteredPassword?.length })
    try {
      const hashedPassword = await store.get('password.hash')
      logger.debug('Stored password hash exists:', !!hashedPassword)
      
      if (!hashedPassword) {
        logger.warn('No password hash found')
        return { success: false, error: 'Şifre ayarlanmamış' }
      }
      
      logger.security('Verifying password')
      const isValid = await EncryptionService.verifyPassword(enteredPassword, hashedPassword)
      logger.debug('Password verification result:', isValid)
      
      if (isValid) {
        passwordAttempts = 0
        isAppLocked = false
        logger.info('✅ Şifre doğru - uygulama kilidi açıldı')
        return { success: true }
      } else {
        passwordAttempts++
        logger.warn(`❌ Yanlış şifre - deneme ${passwordAttempts}/${MAX_PASSWORD_ATTEMPTS}`)
        return { success: false, attempts: passwordAttempts, maxAttempts: MAX_PASSWORD_ATTEMPTS }
      }
    } catch (error) {
      logger.error('Password check error:', error)
      return { success: false, error: 'Şifre kontrol hatası' }
    }
  })

  ipcMain.handle('close-password', async (event, success) => {
    logger.debug('Close password handler called with success:', success)
    if (passwordWindow) {
      passwordWindow.close()
      passwordWindow = null
    }
    
    // Use stored resolve function
    if (checkPasswordProtection.resolveFunction) {
      logger.success('Resolving password protection promise with:', success)
      checkPasswordProtection.resolveFunction(success)
      checkPasswordProtection.resolveFunction = null
    }
    
    return { success }
  })

  ipcMain.handle('cancel-password', async (event) => {
    logger.warn('Password input cancelled')
    if (passwordWindow) {
      passwordWindow.close()
      passwordWindow = null
    }
    logger.warn('Password entry cancelled - application closing')
    
    // Use stored resolve function
    if (checkPasswordProtection.resolveFunction) {
      logger.warn('Resolving password protection promise with: false')
      checkPasswordProtection.resolveFunction(false)
      checkPasswordProtection.resolveFunction = null
    }
    
    app.quit()
    return { cancelled: true }
  })

  ipcMain.handle('password:set', async (event, password) => {
    try {
      const hashedPassword = await EncryptionService.hashPassword(password)
      await store.set('password.hash', hashedPassword)
      await store.set('settings.passwordProtection', true)
      logger.info('🔐 Şifre koruması ayarlandı')
      return { success: true }
    } catch (error) {
      logger.error('❌ Şifre ayarlama hatası:', error)
      throw error
    }
  })

  ipcMain.handle('password:verify', async (event, password) => {
    try {
      const hashedPassword = await store.get('password.hash')
      if (!hashedPassword) {
        return { valid: false, error: 'Şifre ayarlanmamış' }
      }
      
      const isValid = await EncryptionService.verifyPassword(password, hashedPassword)
      return { valid: isValid }
    } catch (error) {
      logger.error('❌ Şifre doğrulama hatası:', error)
      return { valid: false, error: error.message }
    }
  })

  ipcMain.handle('password:remove', async (event) => {
    try {
      await store.delete('password.hash')
      await store.set('settings.passwordProtection', false)
      logger.info('🔓 Şifre koruması kaldırıldı')
      return { success: true }
    } catch (error) {
      logger.error('❌ Şifre kaldırma hatası:', error)
      throw error
    }
  })

  ipcMain.handle('password:check', async (event) => {
    try {
      const hasPassword = await store.has('password.hash')
      const isEnabled = await store.get('settings.passwordProtection', false)
      return { hasPassword, isEnabled }
    } catch (error) {
      logger.error('❌ Şifre kontrol hatası:', error)
      return { hasPassword: false, isEnabled: false }
    }
  })

  // 💾 Auto Backup Management
  ipcMain.handle('backup:auto-create', async () => {
    if (!appSettings.autoBackup) {
      return { success: false, message: 'Otomatik yedekleme kapalı' }
    }
    
    try {
      const backup = await diaryService.createBackup()
      const fs = require('fs')
      const backupDir = path.join(app.getPath('userData'), 'backups')
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      
      const fileName = `auto_backup_${new Date().toISOString().split('T')[0]}.json`
      const filePath = path.join(backupDir, fileName)
      
      fs.writeFileSync(filePath, JSON.stringify(backup, null, 2))
      
      logger.info(`💾 Otomatik yedek oluşturuldu: ${fileName}`)
      return { success: true, filePath }
    } catch (error) {
      logger.error('❌ Otomatik yedekleme hatası:', error)
      return { success: false, error: error.message }
    }
  })

  // System Integration
  ipcMain.handle('app:show-window', async () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      return true
    }
    return false
  })

  ipcMain.handle('app:get-platform', async () => {
    return process.platform
  })

  logger.info('✅ IPC handlers kuruldu')
}

// Auto updater setup
function setupAutoUpdater() {
  if (isDev) return

  autoUpdater.checkForUpdatesAndNotify()
  
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Güncelleme Mevcut',
      message: 'Yeni bir sürüm mevcut. İndirilecek ve yeniden başlatıldığında kurulacak.',
      buttons: ['Tamam']
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    logger.info('Update downloaded:', info);
    const dialogOpts = {
      type: 'info',
      title: 'Güncelleme Hazır',
      message: 'Güncelleme indirildi. Uygulamayı yeniden başlatmak istiyor musunuz?',
      buttons: ['Şimdi Yeniden Başlat', 'Sonra']
    }
    dialog.showMessageBox(mainWindow, dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  logger.info('🚀 Electron uygulaması başlatılıyor...')
  
  // Set app name
  app.setName('Günce Defteri')
  
  try {
    // Veritabanını başlat ve migration'ları çalıştır
    await db.initDatabase();
    await db.runMigrations();
    logger.info('Database initialized and migrations are checked.');
  } catch (error) {
    logger.error('Failed to initialize database or run migrations:', error);
    // Burada uygulamayı kapatmak veya bir hata penceresi göstermek mantıklı olabilir.
    app.quit();
    return;
  }

  createMainWindow()
    
  // İnternet durumunu dinle
  const onlineStatusWindow = new BrowserWindow({ width: 0, height: 0, show: false })
  onlineStatusWindow.loadURL(`data:text/html, <script>
    window.addEventListener('online', () => require('electron').ipcRenderer.send('online-status-changed', 'online'));
    window.addEventListener('offline', () => require('electron').ipcRenderer.send('online-status-changed', 'offline'));
  </script>`)

  ipcMain.on('online-status-changed', (event, status) => {
    const isOnline = status === 'online';
    diaryService.setOnlineStatus(isOnline);
  });

  // İlk durumu ayarla
  diaryService.setOnlineStatus(true); // Başlangıçta online varsay

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Tüm pencereler kapandığında
app.on('window-all-closed', async () => {
  logger.info('🔒 Tüm pencereler kapatıldı')
  
  // Veritabanı bağlantısını kapat
  await closeDatabase()
  
  // macOS dışında uygulamayı kapat
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOS'ta dock'tan tıklandığında
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

// Güvenlik: HTTP üzerinden yetkilendirme devre dışı
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    logger.warn('🚫 Güvenlik: Yeni pencere engellendi:', navigationUrl)
  })
})

// Uygulama çıkışında temizlik
app.on('before-quit', async () => {
  logger.info('🧹 Uygulama kapanıyor, temizlik yapılıyor...')
  try {
    await closeDatabase()
  } catch (error) {
    logger.error('❌ Database kapatma hatası:', error)
  }
  
  // Force kill eski process'leri
  setTimeout(() => {
    logger.warn('⚠️ Force quit - process zorla sonlandırılıyor')
    process.exit(0)
  }, 3000)
})

// Güvenlik ayarları
app.on('web-contents-created', (event, contents) => {
  // Güvenli olmayan izinleri reddet
  contents.on('permission-request', (event, permission, callback) => {
    const allowedPermissions = ['media', 'notifications']
    
    if (allowedPermissions.includes(permission)) {
      callback(true)
    } else {
      logger.warn(`🚫 Güvenlik: İzin reddedildi: ${permission}`)
      callback(false)
    }
  })
}) 

// Renderer'dan gelen API config'ini al ve service'e ilet
ipcMain.on('set-api-config', (event, apiConfig) => {
  logger.info('API config received from renderer:', { hasToken: !!apiConfig.token, baseUrl: apiConfig.baseUrl });
  diaryService.setApiConfig(apiConfig);
  // İnternet varsa senkronizasyonu tetikle
  diaryService.synchronize(); 
});

// IPC handlers (CRUD) - Artık diaryService'i kullanacaklar
ipcMain.handle('get-entries', async (event, filters) => {
  return diaryService.getEntries(filters);
});

ipcMain.handle('get-entry', async (event, id) => {
  return diaryService.getEntry(id);
});

ipcMain.handle('create-entry', async (event, entryData) => {
  return diaryService.createEntry(entryData);
});

ipcMain.handle('update-entry', async (event, { id, entryData }) => {
  return diaryService.updateEntry(id, entryData);
});

ipcMain.handle('delete-entry', async (event, id) => {
  return diaryService.deleteEntry(id);
});

// ... (diğer IPC handler'ları da benzer şekilde güncellenebilir) ... 