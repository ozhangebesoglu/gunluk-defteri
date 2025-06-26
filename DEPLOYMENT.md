# 📦 Günce Defteri - Deployment Rehberi

## 🚀 Platform Launch Seçenekleri

### Option A: Desktop-Only Launch (Hızlı)
- ✅ Electron desktop uygulaması
- ✅ Local PostgreSQL database
- ⏱️ **Şu anda hazır!**

### Option B: Full Platform Launch (Önerilen) ⭐
- ✅ Electron desktop uygulaması  
- ✅ Web PWA uygulaması
- ✅ Hybrid API service layer
- ✅ Offline-first architecture
- ⏱️ **Şu anda hazır!**

---

## 🖥️ Desktop App Deployment

### Windows Build
```bash
# Build desktop app
npm run build

# Package for Windows
npm run build:electron
# Output: dist-electron/win-unpacked/Günlük Defteri.exe
```

### Cross-Platform Build
```bash
# All platforms (Windows, macOS, Linux)
npm run build:all
```

---

## 🌐 Web App Deployment

### Vercel Deployment
```bash
# 1. Vercel CLI ile deploy et
npm i -g vercel
vercel --prod

# 2. Veya GitHub ile otomatik deploy
# - Repository'yi Vercel'e bağla
# - vercel.json konfigürasyonu mevcut
```

### Netlify Deployment
```bash
# 1. Netlify CLI ile deploy et
npm i -g netlify-cli
netlify deploy --prod --dir=frontend/dist

# 2. Veya GitHub ile otomatik deploy
# - Repository'yi Netlify'a bağla
# - netlify.toml konfigürasyonu mevcut
```

### Manual Static Hosting
```bash
cd frontend && npm run build
# frontend/dist/ klasörünü herhangi bir static host'a yükle
```

---

## 🔧 Backend API (Web Mode İçin)

### Option 1: Railway Deployment
```bash
# 1. Backend'i Railway'a deploy et
cd backend
npm install
railway login
railway init
railway deploy
```

### Option 2: Heroku Deployment
```bash
# 1. Heroku'ya backend deploy et
cd backend
heroku create gunce-api
git subtree push --prefix backend heroku main
```

### Option 3: Local Backend (Development)
```bash
# Terminal 1: Backend başlat
cd backend
npm install
npm start

# Terminal 2: Frontend başlat
cd frontend  
npm run dev
```

---

## 🔄 Development Workflow

### Full Stack Development
```bash
# Tüm servisleri aynı anda başlat
npm run dev:full
# - Vite dev server (frontend): http://localhost:5173
# - Express API server (backend): http://localhost:3001  
# - Electron app: Desktop penceresi
```

### Frontend Only
```bash
npm run dev:vite
# http://localhost:5173 (web mode)
```

### Desktop Only
```bash
npm run dev
# Electron + Frontend
```

---

## 📱 PWA Features

### Manual PWA Installation
1. Web browser'da uygulamayı aç
2. Adres çubuğundaki "Install" butonuna tıkla
3. Veya Chrome menüsünden "Install Günce..."

### PWA Capabilities
- ✅ Offline çalışma
- ✅ Service Worker cache
- ✅ Responsive design
- ✅ App-like experience
- ✅ Push notifications hazır altyapısı

---

## 🌍 Production Environment Variables

### Frontend (.env.production)
```env
VITE_API_URL=https://your-api-domain.com/api/v1
VITE_APP_NAME=Günce
```

### Backend (.env.production)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:port/dbname
CORS_ORIGIN=https://your-domain.com
```

---

## 📊 Deployment Checklist

### Desktop App
- [x] Electron build config
- [x] PostgreSQL bundled
- [x] Auto-updater ready
- [x] Security policies (CSP)
- [x] Code signing ready

### Web App  
- [x] PWA manifest
- [x] Service Worker
- [x] Static hosting config
- [x] HTTPS redirect
- [x] Security headers

### Backend API
- [x] Express.js server
- [x] CORS configuration
- [x] Rate limiting
- [x] Security middleware
- [x] Error handling

---

## 🎯 Quick Launch Commands

### Desktop Launch
```bash
npm run build && npm run build:electron
# Tek komutla desktop app hazır
```

### Web Launch
```bash
cd frontend && npm run build
# Build'i static hosting'e yükle
```

### Full Platform Launch
```bash
# 1. Backend deploy et (Railway/Heroku)
cd backend && npm start

# 2. Frontend build et  
cd frontend && npm run build

# 3. Vercel/Netlify'a deploy et
vercel --prod
```

---

## 🔒 Security Notes

- Desktop app: Local encryption aktif
- Web app: HTTPS gerekli
- API: Rate limiting ve CORS koruması
- PWA: Secure contexts only
- Database: Connection encryption

---

**🎉 Günce Defteri her iki platformda da canlıya çıkmaya hazır!** 