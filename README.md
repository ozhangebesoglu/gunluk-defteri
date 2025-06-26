# 📖 Günlük Defteri - Modern Diary Application

Modern, güvenli ve şifrelenmiş günlük defteri uygulaması. Electron + React + PostgreSQL ile geliştirilmiştir.

## 💿 Download / İndir

### 🖥️ Desktop Uygulaması (EXE)
**Windows kullanıcıları için hazır kurulum dosyası:**

📥 **[En Son Sürümü İndir](https://github.com/ozhangebesoglu/gunluk-defteri/releases/latest)**

**Kurulum Adımları:**
1. Yukarıdaki linkten `Günce-1.0.0-Setup.exe` dosyasını indirin
2. Dosyayı çalıştırın ve kurulum talimatlarını takip edin
3. Masaüstünüzde veya Başlat menüsünde "Günce" kısayolunu bulun
4. Uygulamayı açın ve günce yazmaya başlayın!

### 🌐 Web Uygulaması
**Anında kullanım için:**

🔗 **[Web Versiyonu - gunluk-defteri.vercel.app](https://gunluk-defteri.vercel.app)**

*Not: Web versiyonu sınırlı özelliklere sahiptir. Tam deneyim için desktop uygulamasını indirin.*

## ✨ Özellikler

### 🔒 Güvenlik
- **Güvenli Electron Yapılandırması**: `contextIsolation: true`, `nodeIntegration: false`
- **Şifreleme Desteği**: AES-256 ile günlük içerikleri şifreleme
- **Güvenli IPC İletişimi**: Preload script ile güvenli API exposure
- **Argon2 Parola Hash'leme**: Modern, güvenli parola algoritması

### 📊 Özellikler
- **Dashboard**: İstatistikler ve hızlı erişim
- **Günlük Yönetimi**: CRUD işlemleri, arama, filtreleme
- **Etiket Sistemi**: Renk kodlu etiketleme
- **Duygu Analizi**: Yazı tonu otomatik analizi
- **Full-text Search**: PostgreSQL tabanlı Türkçe arama
- **Backup/Restore**: JSON formatında yedekleme
- **İstatistikler**: Duygu dağılımı, kelime sayısı, etiket kullanımı

### 🎨 Modern UI
- **Material-UI**: Modern, responsive tasarım
- **TypeScript**: Tip güvenliği
- **React Query**: Akıllı cache yönetimi
- **Dark/Light Mode**: Tema desteği
- **Keyboard Shortcuts**: Hızlı erişim

### 🗄️ Veritabanı
- **PostgreSQL**: Güçlü ve güvenilir
- **Knex.js**: Migration ve seed sistemi
- **UUID Primary Keys**: Güvenli kimlik doğrulama
- **Indexleme**: Performans optimizasyonu

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 13+
- npm veya yarn

### Adım 1: Repository'yi klonlayın
```bash
git clone <repository-url>
cd gunluk-defteri
```

### Adım 2: Bağımlılıkları yükleyin
```bash
# Ana bağımlılıklar
npm install

# Frontend bağımlılıkları
cd frontend && npm install && cd ..
```

### Adım 3: PostgreSQL kurulumu
1. PostgreSQL'i yükleyin ve başlatın
2. Yeni veritabanı oluşturun:
```sql
CREATE DATABASE diary_app;
CREATE USER diary_user WITH PASSWORD 'secure_password_123';
GRANT ALL PRIVILEGES ON DATABASE diary_app TO diary_user;
```

### Adım 4: Environment ayarları
`.env` dosyası oluşturun:
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=diary_user
DB_PASSWORD=secure_password_123
DB_NAME=diary_app
DB_SSL=false
NODE_ENV=development
```

### Adım 5: Veritabanını hazırlayın
```bash
# Migration'ları çalıştır ve demo verileri ekle
npm run db:fresh

# Veya adım adım:
npm run db:migrate
npm run db:seed
```

### Adım 6: Uygulamayı başlatın
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run build:all
```

## 📁 Proje Yapısı

```
gunluk-defteri/
├── src/main/               # Electron main process
│   ├── main.js            # Ana Electron dosyası
│   ├── preload.js         # Güvenli preload script
│   ├── database.js        # Veritabanı bağlantısı
│   └── services/          # Backend servisler
│       ├── diaryService.js
│       └── encryptionService.js
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React bileşenleri
│   │   ├── pages/         # Sayfa bileşenleri
│   │   └── App.tsx        # Ana uygulama
├── db/                    # Veritabanı dosyaları
│   ├── migrations/        # Knex migration'ları
│   └── seeds/            # Seed verileri
├── build/                # Build dosyaları
└── package.json          # Ana paket yapılandırması
```

## 🗄️ Veritabanı Komutları

```bash
# Tüm veritabanını sıfırdan kur (demo veriler dahil)
npm run db:fresh

# Sadece migration'ları çalıştır  
npm run db:migrate

# Sadece seed verilerini ekle
npm run db:seed

# Migration durumunu kontrol et
npm run db:status

# Migration geri alma
npm run db:rollback
```

## 🛡️ Güvenlik Özellikleri

### Electron Güvenlik
- ✅ Context Isolation aktif
- ✅ Node Integration kapalı
- ✅ Remote Module kapalı
- ✅ Web Security aktif
- ✅ CSP (Content Security Policy) ayarları
- ✅ Güvenli IPC handlers

### Veri Güvenliği
- ✅ AES-256 şifreleme
- ✅ Argon2 parola hash'leme
- ✅ SQL injection koruması
- ✅ XSS koruması
- ✅ CSRF koruması

## 🧪 Test ve Kalite

```bash
# ESLint kontrolü
npm run lint

# Type kontrolü
npm run type-check

# Güvenlik taraması
npm run security:audit

# Format kontrolü
npm run format
```

## 📦 Build ve Dağıtım

```bash
# Tüm platformlar için build
npm run build:all

# Sadece Windows
npm run build:win

# Sadece macOS
npm run build:mac

# Sadece Linux
npm run build:linux
```

Build sonrası dosyalar `dist-electron/` klasöründe bulunur.

## 🔧 Geliştirme

### Hot Reload
Development mode'da hem Electron hem React hot reload destekler:
```bash
npm run dev
```

### Debugging
- React DevTools: Browser geliştirici araçlarında mevcut
- Electron DevTools: Development mode'da otomatik açılır
- Database debugging: pgAdmin veya psql kullanın

### Linting ve Formatting
```bash
npm run lint        # ESLint kontrolü
npm run format      # Prettier formatting
```

## 📝 API Dokümantasyonu

### electronAPI Global Interface
Frontend'de `window.electronAPI` üzerinden erişilebilir:

```typescript
// Günlük işlemleri
await electronAPI.diary.createEntry(entryData)
await electronAPI.diary.getEntries(filters)

// Güvenlik
await electronAPI.security.encryptText(text, password)

// Backup
await electronAPI.backup.create()
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🆘 Destek

Sorun yaşarsanız:
1. GitHub Issues'a bakın
2. Yeni issue oluşturun
3. Detaylı açıklama ve hata logları ekleyin

## 🚀 Gelecek Özellikler

- [ ] Mobil uygulama (React Native)
- [ ] Cloud sync (Google Drive, Dropbox)
- [ ] Ses kaydı desteği
- [ ] Resim ekleme ve galeri
- [ ] AI destekli yazı önerileri
- [ ] Çoklu dil desteği
- [ ] Plugin sistemi

---

**Not**: Bu uygulama kişisel verilerinizi yerel olarak saklar. Verileriniz hiçbir sunucuya gönderilmez. 