const CryptoJS = require('crypto-js')
// const argon2 = require('argon2') // Geçici disable

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

class EncryptionService {
  constructor() {
    this.algorithm = 'AES'
    // this.keyDerivationOptions = {
    //   type: argon2.argon2id,
    //   memoryCost: 2 ** 16, // 64 MB
    //   timeCost: 3,
    //   parallelism: 1,
    // }
  }

  /**
   * Parola hash'leme (kullanıcı şifreleri için)
   */
  hashPassword(password) {
    try {
      // Güvenli salt ile hash
      const salt = CryptoJS.lib.WordArray.random(256/8)
      const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      })
      
      // Salt ve hash'i birleştir
      return salt.toString(CryptoJS.enc.Hex) + ':' + hash.toString(CryptoJS.enc.Hex)
    } catch (error) {
      log.error('Password hashing hatası:', error)
      throw new Error('Parola hash\'lenemedi')
    }
  }

  /**
   * Parola doğrulama
   */
  verifyPassword(password, storedHash) {
    try {
      const [saltHex, hashHex] = storedHash.split(':')
      if (!saltHex || !hashHex) {
        return false
      }
      
      const salt = CryptoJS.enc.Hex.parse(saltHex)
      const hash = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      })
      
      return hash.toString(CryptoJS.enc.Hex) === hashHex
    } catch (error) {
      log.error('Password verification hatası:', error)
      return false
    }
  }

  /**
   * Metin şifreleme (günlük içerikleri için)
   */
  encryptText(plainText, password) {
    try {
      // Güçlü anahtar türetme
      const salt = CryptoJS.lib.WordArray.random(256/8)
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256/32,
        iterations: 10000
      })

      // IV oluştur
      const iv = CryptoJS.lib.WordArray.random(128/8)

      // Şifrele
      const encrypted = CryptoJS.AES.encrypt(plainText, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })

      // Salt, IV ve şifrelenmiş metni birleştir
      const result = {
        salt: salt.toString(CryptoJS.enc.Hex),
        iv: iv.toString(CryptoJS.enc.Hex),
        encrypted: encrypted.toString()
      }

      return JSON.stringify(result)
    } catch (error) {
      log.error('Text encryption hatası:', error)
      throw new Error('Metin şifrelenemedi')
    }
  }

  /**
   * Metin çözme
   */
  decryptText(encryptedData, password) {
    try {
      const data = JSON.parse(encryptedData)
      const { salt, iv, encrypted } = data

      // Anahtarı yeniden türet
      const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), {
        keySize: 256/32,
        iterations: 10000
      })

      // Çöz
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })

      const plainText = decrypted.toString(CryptoJS.enc.Utf8)
      
      if (!plainText) {
        throw new Error('Yanlış parola veya bozuk veri')
      }

      return plainText
    } catch (error) {
      log.error('Text decryption hatası:', error.message)
      throw new Error('Metin çözülemedi: Yanlış parola olabilir')
    }
  }

  /**
   * Güvenli rastgele salt oluşturma
   */
  generateSalt(length = 32) {
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex)
  }

  /**
   * Güvenli rastgele token oluşturma
   */
  generateSecureToken(length = 32) {
    return CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Base64)
  }

  /**
   * Dosya şifreleme (resim ve ses dosyaları için)
   */
  async encryptFile(filePath, password) {
    try {
      const fs = require('fs').promises
      const fileData = await fs.readFile(filePath)
      const base64Data = fileData.toString('base64')
      
      return this.encryptText(base64Data, password)
    } catch (error) {
      log.error('File encryption hatası:', error)
      throw new Error('Dosya şifrelenemedi')
    }
  }

  /**
   * Dosya çözme
   */
  async decryptFile(encryptedData, password, outputPath) {
    try {
      const base64Data = this.decryptText(encryptedData, password)
      const fileData = Buffer.from(base64Data, 'base64')
      
      const fs = require('fs').promises
      await fs.writeFile(outputPath, fileData)
      
      return outputPath
    } catch (error) {
      log.error('File decryption hatası:', error)
      throw new Error('Dosya çözülemedi')
    }
  }

  /**
   * Parola güçlülük kontrolü
   */
  validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const score = Object.values(checks).filter(Boolean).length
    const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'

    return {
      score,
      strength,
      checks,
      isValid: score >= 3
    }
  }

  /**
   * Güvenli parola önerisi oluşturma
   */
  generateSecurePassword(length = 16) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const allChars = lowercase + uppercase + numbers + symbols
    let password = ''
    
    // En az bir karakter her kategoriden
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Kalanı rastgele doldur
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Karıştır
    return password.split('').sort(() => 0.5 - Math.random()).join('')
  }
}

module.exports = new EncryptionService() 