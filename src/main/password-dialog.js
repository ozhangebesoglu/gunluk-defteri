console.log('🔐 Password dialog loaded')

// Simple test to verify JavaScript is working
console.log('🧪 JavaScript test - this should appear in console')

// Test alert after 2 seconds
setTimeout(() => {
  console.log('⏰ 2 second test alert coming...')
  // alert('🧪 JavaScript çalışıyor! Console\'da log\'ları kontrol edin.')
}, 2000)

// Check electronAPI availability
function checkElectronAPI() {
  console.log('🔍 Checking electronAPI availability...')
  console.log('window.electronAPI exists:', !!window.electronAPI)
  
  if (window.electronAPI) {
    console.log('electronAPI methods:')
    console.log('- checkPassword:', typeof window.electronAPI.checkPassword)
    console.log('- closePassword:', typeof window.electronAPI.closePassword)
    console.log('- cancelPassword:', typeof window.electronAPI.cancelPassword)
  } else {
    console.error('❌ electronAPI not available!')
  }
}

// Check API when page loads
checkElectronAPI()

let attempts = 0;
const maxAttempts = 3;

function submitPassword() {
  console.log('📝 Submit password called')
  const password = document.getElementById('password').value.trim();
  if (!password) {
    showError('Lütfen şifrenizi girin');
    return;
  }
  
  // Disable input and button during check
  setInputsDisabled(true);
  
  if (window.electronAPI && window.electronAPI.checkPassword) {
    console.log('🔍 Checking password...')
    window.electronAPI.checkPassword(password).then((result) => {
      console.log('📧 Password check result:', result)
      
      if (result.success) {
        console.log('✅ Password correct - closing dialog')
        document.getElementById('error').style.display = 'none';
        window.electronAPI.closePassword(true);
      } else {
        if (result.attempts !== undefined) {
          attempts = result.attempts;
        } else {
          attempts++;
        }
        
        const maxAttempts = result.maxAttempts || 3;
        
        if (attempts >= maxAttempts) {
          showError('Çok fazla yanlış deneme! Uygulama kapatılıyor.');
          setTimeout(() => {
            window.electronAPI.closePassword(false);
          }, 2000);
        } else {
          const remainingAttempts = maxAttempts - attempts;
          showError(`Yanlış şifre! ${remainingAttempts} deneme hakkınız kaldı.`);
          updateAttempts();
        }
      }
    }).catch((error) => {
      console.error('❌ Password check error:', error)
      showError('Şifre kontrol hatası!');
      setInputsDisabled(false);
    });
  } else {
    console.error('❌ electronAPI not available')
    showError('API bağlantı hatası!');
    setInputsDisabled(false);
  }
}

function cancelLogin() {
  console.log('🚫 Cancel login called')
  if (window.electronAPI && window.electronAPI.cancelPassword) {
    window.electronAPI.cancelPassword();
  } else {
    console.error('❌ electronAPI not available')
  }
}

function setInputsDisabled(disabled) {
  document.getElementById('password').disabled = disabled;
  document.getElementById('loginBtn').disabled = disabled;
  document.getElementById('cancelBtn').disabled = disabled;
}

function showError(message) {
  console.log('❌ Showing error:', message)
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  // Reset form
  document.getElementById('password').value = '';
  setInputsDisabled(false);
  
  // Focus after a short delay
  setTimeout(() => {
    document.getElementById('password').focus();
  }, 100);
}

function updateAttempts() {
  const attemptsDiv = document.getElementById('attempts');
  if (attempts > 0) {
    const remaining = maxAttempts - attempts;
    attemptsDiv.textContent = `${remaining} deneme hakkınız kaldı`;
  } else {
    attemptsDiv.textContent = '';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM loaded - setting up event listeners')
  
  // Setup button event listeners
  const loginBtn = document.getElementById('loginBtn')
  const cancelBtn = document.getElementById('cancelBtn')
  const passwordInput = document.getElementById('password')
  
  if (loginBtn) {
    console.log('✅ Login button found, adding event listener')
    loginBtn.addEventListener('click', () => {
      console.log('👆 Login button clicked!')
      submitPassword()
    })
  } else {
    console.error('❌ Login button not found!')
  }
  
  if (cancelBtn) {
    console.log('✅ Cancel button found, adding event listener')
    cancelBtn.addEventListener('click', () => {
      console.log('👆 Cancel button clicked!')
      cancelLogin()
    })
  } else {
    console.error('❌ Cancel button not found!')
  }
  
  if (passwordInput) {
    console.log('✅ Password input found, adding event listener')
    passwordInput.addEventListener('keypress', (e) => {
      console.log('⌨️ Key pressed:', e.key)
      if (e.key === 'Enter') {
        console.log('↩️ Enter key pressed - submitting password')
        submitPassword()
      }
    })
    
    // Focus after a short delay
    setTimeout(() => {
      passwordInput.focus()
      passwordInput.select()
      console.log('🎯 Password input focused and selected')
      updateAttempts()
    }, 200)
  } else {
    console.error('❌ Password input not found!')
  }
})

console.log('🔐 Password dialog script loaded completely') 