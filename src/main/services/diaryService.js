const { db, safeQuery } = require('../database')
const log = require('electron-log')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs').promises

class DiaryService {
  /**
   * Günlük kayıtlarını getir (filtreleme ile)
   */
  async getEntries(filters = {}) {
    return await safeQuery(async () => {
      let query = db('diary_entries').select('*')

      // Filtreleme
      if (filters.startDate) {
        query = query.where('entry_date', '>=', filters.startDate)
      }
      if (filters.endDate) {
        query = query.where('entry_date', '<=', filters.endDate)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.where('tags', '&&', filters.tags)
      }
      if (filters.sentiment) {
        query = query.where('sentiment', filters.sentiment)
      }
      if (filters.isFavorite) {
        query = query.where('is_favorite', true)
      }
      if (filters.searchText) {
        query = query.whereRaw(
          "to_tsvector('turkish', title || ' ' || content) @@ plainto_tsquery('turkish', ?)",
          [filters.searchText]
        )
      }

      // Sıralama
      const orderBy = filters.orderBy || 'entry_date'
      const orderDirection = filters.orderDirection || 'desc'
      query = query.orderBy(orderBy, orderDirection)

      // Sayfalama
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.offset(filters.offset)
      }

      const entries = await query
      
      // Şifrelenmiş kayıtları işaretle
      return entries.map(entry => ({
        ...entry,
        hasEncryption: !!entry.encrypted_content,
        content: entry.is_encrypted ? '[ŞİFRELENMİŞ İÇERİK]' : entry.content
      }))
    }, 'Günlük kayıtları getirilemedi')
  }

  /**
   * Tek günlük kaydını getir
   */
  async getEntry(id) {
    return await safeQuery(async () => {
      const entry = await db('diary_entries').where('id', id).first()
      
      if (!entry) {
        throw new Error('Günlük kaydı bulunamadı')
      }

      return entry
    }, 'Günlük kaydı getirilemedi')
  }

  /**
   * Yeni günlük kaydı oluştur
   */
  async createEntry(entryData) {
    return await safeQuery(async () => {
      const now = new Date()
      const entryDate = entryData.entry_date || now.toISOString().split('T')[0]
      const dayOfWeek = this.getDayOfWeek(new Date(entryDate))
      
      const wordCount = this.calculateWordCount(entryData.content)
      const readTime = Math.ceil(wordCount / 200) // 200 kelime/dakika okuma hızı

      const newEntry = {
        id: uuidv4(),
        title: entryData.title,
        content: entryData.content,
        encrypted_content: entryData.encrypted_content || null,
        entry_date: entryDate,
        day_of_week: dayOfWeek,
        tags: entryData.tags || [],
        sentiment: entryData.sentiment || 'neutral',
        sentiment_score: entryData.sentiment_score || 0,
        weather: entryData.weather || null,
        location: entryData.location || null,
        is_favorite: entryData.is_favorite || false,
        is_encrypted: !!entryData.encrypted_content,
        word_count: wordCount,
        read_time: readTime,
        created_at: now,
        updated_at: now
      }

      const [insertedEntry] = await db('diary_entries').insert(newEntry).returning('*')
      
      // Etiket kullanım sayısını güncelle
      if (entryData.tags && entryData.tags.length > 0) {
        await this.updateTagUsage(entryData.tags)
      }

      log.info(`✅ Yeni günlük kaydı oluşturuldu: ${insertedEntry.title}`)
      return insertedEntry
    }, 'Günlük kaydı oluşturulamadı')
  }

  /**
   * Günlük kaydını güncelle
   */
  async updateEntry(id, entryData) {
    return await safeQuery(async () => {
      const existingEntry = await this.getEntry(id)
      
      const wordCount = this.calculateWordCount(entryData.content || existingEntry.content)
      const readTime = Math.ceil(wordCount / 200)

      const updatedEntry = {
        title: entryData.title || existingEntry.title,
        content: entryData.content || existingEntry.content,
        encrypted_content: entryData.encrypted_content || existingEntry.encrypted_content,
        tags: entryData.tags || existingEntry.tags,
        sentiment: entryData.sentiment || existingEntry.sentiment,
        sentiment_score: entryData.sentiment_score || existingEntry.sentiment_score,
        weather: entryData.weather !== undefined ? entryData.weather : existingEntry.weather,
        location: entryData.location !== undefined ? entryData.location : existingEntry.location,
        is_favorite: entryData.is_favorite !== undefined ? entryData.is_favorite : existingEntry.is_favorite,
        is_encrypted: entryData.encrypted_content ? true : existingEntry.is_encrypted,
        word_count: wordCount,
        read_time: readTime,
        updated_at: new Date()
      }

      const [updated] = await db('diary_entries')
        .where('id', id)
        .update(updatedEntry)
        .returning('*')

      // Etiket kullanım sayısını güncelle
      if (entryData.tags) {
        await this.updateTagUsage(entryData.tags)
      }

      log.info(`✅ Günlük kaydı güncellendi: ${updated.title}`)
      return updated
    }, 'Günlük kaydı güncellenemedi')
  }

  /**
   * Günlük kaydını sil
   */
  async deleteEntry(id) {
    return await safeQuery(async () => {
      const entry = await this.getEntry(id)
      
      await db('diary_entries').where('id', id).del()
      
      log.info(`🗑️ Günlük kaydı silindi: ${entry.title}`)
      return { success: true, deletedEntry: entry }
    }, 'Günlük kaydı silinemedi')
  }

  /**
   * Tüm günlük kayıtlarını sil
   */
  async deleteAllEntries() {
    return await safeQuery(async () => {
      const entriesCount = await db('diary_entries').count('id as count').first()
      
      await db('diary_entries').del()
      
      // Etiket kullanım sayılarını sıfırla
      await db('diary_tags').update({ usage_count: 0 })
      
      log.info(`🗑️ Tüm günlük kayıtları silindi: ${entriesCount.count} adet`)
      return { success: true, deletedCount: parseInt(entriesCount.count) }
    }, 'Tüm günlük kayıtları silinemedi')
  }

  /**
   * Etiketleri getir
   */
  async getTags() {
    return await safeQuery(async () => {
      return await db('diary_tags').select('*').orderBy('usage_count', 'desc')
    }, 'Etiketler getirilemedi')
  }

  /**
   * Yeni etiket oluştur
   */
  async createTag(tagData) {
    return await safeQuery(async () => {
      const newTag = {
        id: uuidv4(),
        name: tagData.name,
        color: tagData.color || '#007bff',
        description: tagData.description || null,
        usage_count: 0,
        created_at: new Date()
      }

      const [insertedTag] = await db('diary_tags').insert(newTag).returning('*')
      
      log.info(`🏷️ Yeni etiket oluşturuldu: ${insertedTag.name}`)
      return insertedTag
    }, 'Etiket oluşturulamadı')
  }

  /**
   * Dashboard istatistiklerini getir
   */
  async getDashboardStats() {
    return await safeQuery(async () => {
      const totalEntries = await db('diary_entries').count('id as count').first()
      const favoriteEntries = await db('diary_entries').where('is_favorite', true).count('id as count').first()
      const encryptedEntries = await db('diary_entries').where('is_encrypted', true).count('id as count').first()
      
      // Duygu dağılımı
      const sentimentStats = await db('diary_entries')
        .select('sentiment')
        .count('id as count')
        .groupBy('sentiment')
      
      // En çok kullanılan etiketler
      const topTags = await db('diary_tags')
        .select('name', 'color', 'usage_count')
        .orderBy('usage_count', 'desc')
        .limit(10)
      
      // Aylık yazı sayısı (son 12 ay)
      const monthlyStats = await db('diary_entries')
        .select(db.raw("DATE_TRUNC('month', entry_date) as month"))
        .count('id as count')
        .where('entry_date', '>=', db.raw("CURRENT_DATE - INTERVAL '12 months'"))
        .groupBy(db.raw("DATE_TRUNC('month', entry_date)"))
        .orderBy('month')
      
      // Toplam kelime sayısı
      const totalWords = await db('diary_entries').sum('word_count as total').first()

      return {
        totals: {
          entries: parseInt(totalEntries.count),
          favorites: parseInt(favoriteEntries.count),
          encrypted: parseInt(encryptedEntries.count),
          words: parseInt(totalWords.total) || 0
        },
        sentimentDistribution: sentimentStats,
        topTags,
        monthlyStats
      }
    }, 'Dashboard istatistikleri getirilemedi')
  }

  /**
   * Backup oluştur
   */
  async createBackup() {
    return await safeQuery(async () => {
      const entries = await db('diary_entries').select('*')
      const tags = await db('diary_tags').select('*')
      const settings = await db('user_settings').select('*')

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          entries,
          tags,
          settings
        }
      }

      const backupFileName = `diary_backup_${new Date().toISOString().slice(0, 10)}.json`
      const backupPath = path.join(process.cwd(), 'backups', backupFileName)
      
      // Backup klasörünü oluştur
      await fs.mkdir(path.dirname(backupPath), { recursive: true })
      
      // Backup dosyasını yaz
      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2))

      log.info(`💾 Backup oluşturuldu: ${backupPath}`)
      return { success: true, filePath: backupPath, fileName: backupFileName }
    }, 'Backup oluşturulamadı')
  }

  /**
   * Backup'tan geri yükle
   */
  async restoreBackup(filePath) {
    return await safeQuery(async () => {
      const backupData = JSON.parse(await fs.readFile(filePath, 'utf8'))
      
      if (!backupData.data) {
        throw new Error('Geçersiz backup dosyası')
      }

      // Transaction ile geri yükleme
      await db.transaction(async (trx) => {
        // Mevcut verileri temizle
        await trx('diary_entries').del()
        await trx('diary_tags').del()
        await trx('user_settings').del()

        // Yeni verileri ekle
        if (backupData.data.entries.length > 0) {
          await trx('diary_entries').insert(backupData.data.entries)
        }
        if (backupData.data.tags.length > 0) {
          await trx('diary_tags').insert(backupData.data.tags)
        }
        if (backupData.data.settings.length > 0) {
          await trx('user_settings').insert(backupData.data.settings)
        }
      })

      log.info(`📥 Backup geri yüklendi: ${filePath}`)
      return { success: true, restoredEntries: backupData.data.entries.length }
    }, 'Backup geri yüklenemedi')
  }

  // Yardımcı metodlar
  getDayOfWeek(date) {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
    return days[date.getDay()]
  }

  calculateWordCount(text) {
    if (!text) return 0
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  async updateTagUsage(tags) {
    for (const tagName of tags) {
      await db('diary_tags')
        .where('name', tagName)
        .increment('usage_count', 1)
    }
  }
}

module.exports = new DiaryService() 