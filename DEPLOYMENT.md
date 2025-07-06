# 📦 Günce Defteri - Sunucuya Kurulum (Deployment) Rehberi

Bu rehber, Günce Defteri uygulamasının backend ve frontend'ini standart bir Node.js ortamına (örneğin bir Ubuntu sunucusu, DigitalOcean Droplet, Heroku vb.) nasıl kurup çalıştıracağınızı adım adım açıklar.

Bu yapılandırma, Docker **gerektirmez**.

---

## ✅ Gereksinimler

- **Node.js**: v18.x veya daha yeni bir sürüm.
- **npm**: Node.js ile birlikte gelir.
- **Git**: Projeyi sunucuya klonlamak için.
- **PM2**: Node.js uygulamalarını production'da yönetmek için global olarak kurulmuş bir süreç yöneticisi.

---

## 🚀 Kurulum Adımları

### 1. Sunucu Hazırlığı ve PM2 Kurulumu

Eğer sunucunuzda `pm2` yüklü değilse, aşağıdaki komutla global olarak yükleyin:
```bash
npm install pm2 -g
```

### 2. Projeyi Klonlama ve Bağımlılıkları Yükleme

Projeyi sunucunuza klonlayın ve tüm bağımlılıkları yükleyin.

```bash
# Projeyi klonlayın
git clone <projenizin-git-adresi> gunce-defteri
cd gunce-defteri

# Ana projenin bağımlılıklarını yükleyin
npm install

# Backend bağımlılıklarını yükleyin
npm install --prefix backend

# Frontend bağımlılıklarını yükleyin
npm install --prefix frontend
```

### 3. Frontend Uygulamasını Build Etme

Frontend (React) uygulamasının production için optimize edilmiş statik dosyalarını oluşturun.

```bash
npm run build --prefix frontend
```
Bu komut, `frontend/dist` klasörünü oluşturacaktır. Backend sunucumuz bu klasörü sunacak şekilde ayarlanmıştır.

### 4. Ortam Değişkenlerini Ayarlama (`.env`)

Projenin ana dizininde `.env` adında bir dosya oluşturun. Bu dosya, uygulamanın production'da ihtiyaç duyacağı hassas bilgileri içerecektir. `env.example` dosyasını kopyalayarak başlayabilirsiniz.

```bash
cp env.example .env
```

Şimdi `.env` dosyasını bir metin düzenleyici ile açıp (`nano .env`) gerekli alanları doldurun:

```ini
# .env dosyası

# Backend için Sunucu Ayarları
NODE_ENV=production
PORT=8080 # Uygulamanın çalışacağı port

# Supabase Anahtarları (Production)
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Sentry (Hata Takibi için - Opsiyonel)
SENTRY_DSN=your-backend-sentry-dsn

# --- Frontend için ---
# VITE_ öneki Vite tarafından kullanılır

VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL="http://<sunucu-ip-adresiniz>:8080/api/v1" # Backend API adresiniz
VITE_SENTRY_DSN=your-frontend-sentry-dsn

# Sentry Kaynak Haritası Yüklemesi için (Build sırasında kullanılır)
SENTRY_ORG=your-sentry-organization-slug
SENTRY_PROJECT=your-sentry-project-slug
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```
**Önemli:** `VITE_API_BASE_URL`'i sunucunuzun IP adresine veya alan adına göre doğru şekilde ayarladığınızdan emin olun.

---

## ✨ Uygulamayı PM2 ile Başlatma

Tüm kurulum tamamlandıktan sonra, uygulamayı `pm2` ile başlatabilirsiniz. Projenin ana dizininde bulunan `ecosystem.config.js` dosyası tüm ayarları içerir.

```bash
# Uygulamayı production modunda başlat
pm2 start ecosystem.config.js --env production
```

### Faydalı PM2 Komutları

- **Uygulama durumunu ve logları görüntüleme:**
  ```bash
  pm2 monit
  ```

- **Tüm uygulamaları listeleme:**
  ```bash
  pm2 list
  ```

- **Uygulamayı yeniden başlatma:**
  ```bash
  pm2 restart gunce-defteri-app
  ```

- **Uygulamayı durdurma:**
  ```bash
  pm2 stop gunce-defteri-app
  ```

- **Uygulama loglarını canlı izleme:**
  ```bash
  pm2 logs gunce-defteri-app
  ```

- **Sunucu yeniden başladığında PM2'nin otomatik başlaması için:**
  ```bash
  pm2 startup
  # Yukarıdaki komutun çıktısındaki komutu kopyalayıp çalıştırın
  pm2 save
  ```

Artık uygulamanız `http://<sunucu-ip-adresiniz>:8080` adresinde çalışıyor olmalı. 