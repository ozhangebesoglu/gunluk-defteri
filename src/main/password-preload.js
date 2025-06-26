const { contextBridge, ipcRenderer } = require('electron')

console.log('🔐 Password preload script starting to load...')

try {
  console.log('📡 Setting up contextBridge...')
  
  contextBridge.exposeInMainWorld('electronAPI', {
    checkPassword: (password) => {
      console.log('🔍 checkPassword called from renderer with password length:', password?.length)
      return ipcRenderer.invoke('check-password', password)
    },
    
    closePassword: (success) => {
      console.log('🚪 closePassword called from renderer with success:', success)
      return ipcRenderer.invoke('close-password', success)
    },
    
    cancelPassword: () => {
      console.log('🚫 cancelPassword called from renderer')
      return ipcRenderer.invoke('cancel-password')
    }
  })
  
  console.log('✅ contextBridge setup complete - electronAPI exposed')
  
} catch (error) {
  console.error('❌ Error in password preload script:', error)
}

// Güvenlik bilgisi
contextBridge.exposeInMainWorld('securityInfo', {
  contextIsolation: true,
  nodeIntegration: false,
  webSecurity: true
})

console.log('✅ Password preload script loaded successfully') 