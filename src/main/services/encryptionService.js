const CryptoJS = require('crypto-js')
const argon2 = require('argon2')

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
    this.algorithm = 'AES-256-GCM' // GCM modu daha güvenli
    this.keyDerivationOptions = {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 65536 KB (64 MB)
      timeCost: 4,
      parallelism: 2,
      hashLength: 32
    }
  }

  /**
   * Parola hash'leme (kullanıcı şifreleri için)
   */
  async hashPassword(password) {
    try {
      const hash = await argon2.hash(password, this.keyDerivationOptions)
      return hash
    } catch (error) {
      log.error('Password hashing hatası:', error)
      throw new Error('Parola hash\'lenemedi')
    }
  }

  /**
   * Parola doğrulama
   */
  async verifyPassword(password, storedHash) {
    try {
      return await argon2.verify(storedHash, password)
    } catch (error) {
      // Argon2, parola uyuşmazlığında da hata fırlatır.
      log.warn('Password verification failed:', error.message)
      return false
    }
  }

  /**
   * Metin şifreleme (günlük içerikleri için)
   */
  async encryptText(plainText, password) {
    try {
      const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex)
      
      const key = await argon2.hash(password, {
        ...this.keyDerivationOptions,
        salt: Buffer.from(salt, 'hex'),
        raw: true, // Ham anahtar olarak döndür
      })

      // IV (Initialization Vector) oluştur
      const iv = CryptoJS.lib.WordArray.random(12).toString(CryptoJS.enc.Hex)

      // Şifrele (AES-GCM ile)
      const encrypted = CryptoJS.AES.encrypt(plainText, CryptoJS.lib.WordArray.create(key), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
      }).toString()

      // GCM'den authentication tag'i al (ciphertext'in sonunda)
      const ciphertext = CryptoJS.enc.Base64.parse(encrypted)
      const tag = ciphertext.clone()
      tag.sigBytes = 16
      tag.clamp()
      ciphertext.sigBytes -= 16
      ciphertext.clamp()
      
      const result = {
        salt: salt,
        iv: iv,
        tag: tag.toString(CryptoJS.enc.Hex),
        encrypted: ciphertext.toString(CryptoJS.enc.Hex)
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
  async decryptText(encryptedData, password) {
    try {
      const data = JSON.parse(encryptedData)
      const { salt, iv, tag, encrypted } = data

      // Anahtarı yeniden türet
      const key = await argon2.hash(password, {
        ...this.keyDerivationOptions,
        salt: Buffer.from(salt, 'hex'),
        raw: true,
      })
      
      // ciphertext ve tag'i birleştir
      const ciphertext = CryptoJS.enc.Hex.parse(encrypted + tag)

      // Çöz (AES-GCM ile)
      const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, CryptoJS.lib.WordArray.create(key), {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding
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