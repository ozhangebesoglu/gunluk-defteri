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

// node-fetch'i dinamik olarak import et
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const db = require('../database'); // Yerel veritabanı modülünü dahil et

// Uygulamanın genel internet durumu
let isOnline = true; // Başlangıçta online varsayalım

const fetchWithAuth = async (url, options = {}, apiConfig) => {
  const { token, baseUrl } = apiConfig
  if (!token || !baseUrl) {
    throw new Error('API token or base URL is not configured.')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }

  const response = await fetch(`${baseUrl}${url}`, { ...options, headers })

  if (!response.ok) {
    const errorBody = await response.text()
    log.error(`API Error: ${response.status} ${response.statusText}`, errorBody)
    throw new Error(`API request failed: ${response.statusText}`)
  }
  
  // 204 No Content gibi durumlarda body parse etme
  if (response.status === 204) {
    return null
  }

  return response.json()
}

class DiaryService {
  constructor() {
    this.apiConfig = null;
    this.syncInProgress = false;
  }

  // İnternet durumunu güncelleyen metod
  setOnlineStatus(status) {
    log.info(`İnternet durumu değişti: ${status ? 'Çevrimiçi' : 'Çevrimdışı'}`);
    isOnline = status;
    if (status && this.apiConfig) {
      this.synchronize(); // İnternet geldiğinde senkronizasyonu başlat
    }
  }

  // API yapılandırmasını saklayan metod
  setApiConfig(config) {
    log.info('API yapılandırması ayarlandı.');
    this.apiConfig = config;
  }

  /**
   * Günlük kayıtlarını getir.
   * Çevrimiçi ise API'den, çevrimdışı ise yerel DB'den getirir.
   */
  async getEntries(filters = {}) {
    if (isOnline && this.apiConfig) {
      try {
        log.info('Çevrimiçi: Kayıtlar API\'den getiriliyor.');
        const queryParams = new URLSearchParams(filters).toString();
        const remoteEntries = await fetchWithAuth(`/entries?${queryParams}`, {}, this.apiConfig);
        // İdeal olarak, burada yerel DB'yi de güncelleyebiliriz. Şimdilik sadece API'den dönüyoruz.
        return remoteEntries;
      } catch (error) {
        log.error('API\'den kayıtlar getirilemedi, yerel veritabanına dönülüyor.', error);
        return db.getEntries(filters);
      }
    } else {
      log.info('Çevrimdışı: Kayıtlar yerel veritabanından getiriliyor.');
      return db.getEntries(filters);
    }
  }

  /**
   * Tek günlük kaydını getir.
   */
  async getEntry(id) {
    if (isOnline && this.apiConfig) {
      try {
        log.info(`Çevrimiçi: Kayıt (${id}) API'den getiriliyor.`);
        return await fetchWithAuth(`/entries/${id}`, {}, this.apiConfig);
      } catch (error) {
        log.error(`API'den kayıt (${id}) getirilemedi, yerel veritabanına dönülüyor.`, error);
        return db.getEntryById(id);
      }
    } else {
      log.info(`Çevrimdışı: Kayıt (${id}) yerel veritabanından getiriliyor.`);
      return db.getEntryById(id);
    }
  }

  /**
   * Yeni günlük kaydı oluştur.
   */
  async createEntry(entryData) {
    const localEntryData = { ...entryData, sync_status: 'created', updated_at: new Date().toISOString() };
    const localEntry = await db.createEntry(localEntryData);
    log.info(`Yerel veritabanına yeni kayıt eklendi: ${localEntry.id}`);

    if (isOnline && this.apiConfig) {
      this.synchronize(); // Anında senkronizasyonu tetikle
    }
    
    return localEntry;
  }

  /**
   * Günlük kaydını güncelle.
   */
  async updateEntry(id, entryData) {
     const localEntryData = { ...entryData, sync_status: 'updated', updated_at: new Date().toISOString() };
     const updatedEntry = await db.updateEntry(id, localEntryData);
     log.info(`Yerel veritabanında kayıt güncellendi: ${id}`);

     if (isOnline && this.apiConfig) {
       this.synchronize();
     }
     
     return updatedEntry;
  }

  /**
   * Günlük kaydını sil.
   * Yerel veritabanında hemen silmek yerine, senkronizasyon için işaretleyeceğiz.
   */
  async deleteEntry(id) {
    const result = await db.markEntryAsDeleted(id);
    log.info(`Yerel veritabanında kayıt silinmek üzere işaretlendi: ${id}`);
    
    if (isOnline && this.apiConfig) {
      this.synchronize();
    }
    
    return { success: true, deletedId: id, status: 'marked_for_deletion' };
  }

  /**
   * Bekleyen değişiklikleri API ile senkronize et.
   */
  async synchronize() {
    if (!isOnline || !this.apiConfig || this.syncInProgress) {
      if (this.syncInProgress) log.warn('Senkronizasyon zaten devam ediyor.');
      return;
    }

    this.syncInProgress = true;
    log.info('Senkronizasyon süreci başlatıldı.');

    try {
      const unsyncedEntries = await db.getUnsyncedEntries();
      if (unsyncedEntries.length === 0) {
        log.info('Senkronize edilecek kayıt bulunmuyor.');
        return;
      }
      
      log.info(`${unsyncedEntries.length} adet senkronize edilmemiş kayıt bulundu.`);

      for (const entry of unsyncedEntries) {
        try {
          // eslint-disable-next-line no-unused-vars
          const { sync_status, ...apiData } = entry;

          if (entry.sync_status === 'created') {
            await fetchWithAuth('/entries', { method: 'POST', body: JSON.stringify(apiData) }, this.apiConfig);
            await db.updateEntry(entry.id, { sync_status: 'synced' });
            log.info(`Oluşturulan kayıt senkronize edildi: ${entry.id}`);
          } else if (entry.sync_status === 'updated') {
            await fetchWithAuth(`/entries/${entry.id}`, { method: 'PUT', body: JSON.stringify(apiData) }, this.apiConfig);
            await db.updateEntry(entry.id, { sync_status: 'synced' });
            log.info(`Güncellenen kayıt senkronize edildi: ${entry.id}`);
          } else if (entry.sync_status === 'deleted') {
            await fetchWithAuth(`/entries/${entry.id}`, { method: 'DELETE' }, this.apiConfig);
            await db.deleteEntry(entry.id); // API'den silindikten sonra yerelden de sil
            log.info(`Silinen kayıt senkronize edildi ve yerelden kaldırıldı: ${entry.id}`);
          }
        } catch (error) {
            log.error(`Kayıt senkronize edilirken hata oluştu: ${entry.id}`, error);
            // Hata durumunda ne yapılacağına karar verilebilir (örn. tekrar deneme mekanizması)
        }
      }
      log.info('Senkronizasyon tamamlandı.');
    } catch (error) {
      log.error('Senkronizasyon sürecinde genel bir hata oluştu.', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Tüm günlük kayıtlarını sil
   */
  async deleteAllEntries(apiConfig) {
    const result = await fetchWithAuth('/api/v1/entries', { method: 'DELETE' }, apiConfig)
    log.info(`🗑️ Tüm günlük kayıtlarını silme isteği gönderildi.`)
    return { success: true, deletedCount: result.deletedCount || 0 }
  }

  /**
   * Etiketleri getir
   */
  async getTags(apiConfig) {
    return fetchWithAuth('/api/v1/tags', {}, apiConfig)
  }

  /**
   * Kaydın favori durumunu değiştir
   */
  async toggleFavorite(apiConfig, id) {
    return fetchWithAuth(`/api/v1/entries/${id}/favorite`, { method: 'POST' }, apiConfig)
  }
  
  /**
   * İstatistikleri getir
   */
  async getDashboardStats(apiConfig) {
     return fetchWithAuth('/api/v1/stats', {}, apiConfig)
  }
  
  // Diğer metodlar (createBackup, restoreBackup vb.) şimdilik aynı kalabilir,
  // çünkü bunlar dosya sistemine erişim gerektiriyor ve API'ye taşınması
  // daha farklı bir mantık gerektirir. Bu konsolidasyonun ilk adımı
  // veritabanı işlemlerini merkezileştirmekti.
  
  /**
   * Creates a backup of the entire diary database.
   * NOTE: This function still interacts directly with the local filesystem and DB.
   * It needs to be decided if backup/restore should be a cloud or local feature.
   */
  async createBackup() {
     // Bu fonksiyonun gözden geçirilmesi gerekiyor.
     log.warn('createBackup function is using direct DB access and needs review.')
     return { success: false, message: "Backup function is not implemented for API." }
  }

  async restoreBackup(filePath) {
    log.warn('restoreBackup function is using direct DB access and needs review.')
    return { success: false, message: "Restore function is not implemented for API." }
  }

  getDayOfWeek(date) {
    return new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(date)
  }

  calculateWordCount(text = '') {
    return text.trim().split(/\s+/).filter(Boolean).length
  }
}

module.exports = new DiaryService() 