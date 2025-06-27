# 🔐 Environment Variables Setup Guide

Bu dosya Günce Defteri uygulaması için environment variables yapılandırmasını açıklar.

## 📋 Hızlı Başlangıç

### 1. Template Dosyalarını Kopyala

```bash
# Root .env dosyası
cp env.example .env

# Frontend .env dosyası  
cp frontend/env.example frontend/.env

# Backend .env dosyası
cp backend/env.example backend/.env
```

### 2. Supabase Credentials Al

1. [Supabase Dashboard](https://supabase.com/dashboard)'a git
2. Projenizi seçin
3. **Settings** > **API** bölümüne git
4. Aşağıdaki değerleri kopyala:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` 
   - **service_role** → `SUPABASE_SERVICE_KEY`

### 3. Environment Variables Doldur

#### 🔧 Root `.env`
```bash
# Database (Development PostgreSQL)
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=diary_app
DB_SSL=false

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Security (auto-generated)
APP_SECRET=your_32_char_secret
ENCRYPTION_KEY=your_256_bit_key
```

#### 🎨 Frontend `frontend/.env`
```bash
# Supabase Client
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

#### 🚀 Backend `backend/.env`
```bash
# Server
NODE_ENV=development
PORT=3001

# Supabase (Service Role)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Security
JWT_SECRET=your_jwt_secret
```

### 4. Environment Check

Environment variables'ların doğru olup olmadığını kontrol et:

```bash
node scripts/env-check.js
```

## 🔒 Güvenlik Best Practices

### ✅ **YAPILMASI GEREKENLER**

- ✅ `.env` dosyalarını **GİTİGNORE**'a ekle (✓ Yapıldı)
- ✅ Production'da farklı credentials kullan
- ✅ Service role key'i sadece backend'de kullan
- ✅ Anon key'i frontend'de kullan
- ✅ Secrets'ları environment'a göre ayır

### ❌ **YAPILMAMASI GEREKENLER**

- ❌ `.env` dosyalarını commit etme
- ❌ Keys'leri kod içinde hardcode etme
- ❌ Service role key'i frontend'de kullanma
- ❌ Production keys'leri development'da kullanma

## 🌍 Environment Yapılandırması

### 🔧 **Development Mode**
```bash
NODE_ENV=development
# PostgreSQL kullanır
# Debug logs aktif
# Hot reload aktif
```

### 🚀 **Production Mode**
```bash
NODE_ENV=production
# SQLite kullanır (Electron)
# Logs minimize
# Optimized build
```

## 📊 Environment Variables Listesi

### **Root Environment**
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Public anon key |
| `SUPABASE_SERVICE_KEY` | ⚠️ | Service role key (backend only) |
| `DB_HOST` | 🔧 | PostgreSQL host (dev only) |
| `DB_PASSWORD` | 🔧 | PostgreSQL password (dev only) |
| `APP_SECRET` | 🔐 | App encryption secret |

### **Frontend Environment**
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Public anon key |
| `VITE_API_BASE_URL` | 🔧 | Backend API endpoint |
| `VITE_ENABLE_PWA` | 🎛️ | Enable PWA features |
| `VITE_ENABLE_ANALYTICS` | 🎛️ | Enable analytics |

### **Backend Environment**
| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Service role key |
| `PORT` | 🔧 | Server port |
| `JWT_SECRET` | 🔐 | JWT signing secret |
| `ALLOWED_ORIGINS` | 🔒 | CORS origins |

## 🎯 Deployment Environments

### **Vercel (Web Frontend)**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=https://your-backend.herokuapp.com/api/v1
```

### **Heroku (Backend)**
```bash
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
PROD_ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### **Electron (Desktop)**
```bash
NODE_ENV=production
ELECTRON_ENV=production
# Uses SQLite automatically
```

## 🛠️ Troubleshooting

### **❌ "Supabase configuration missing" Error**
```bash
# Check .env files exist
ls -la .env frontend/.env backend/.env

# Run environment check
node scripts/env-check.js
```

### **❌ "CORS Error" in Development**
```bash
# Check backend ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### **❌ Database Connection Failed**
```bash
# Development PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_password

# Or use Supabase URL directly
SUPABASE_URL=https://your-project.supabase.co
```

## 📚 Related Files

- `env.example` - Root environment template
- `frontend/env.example` - Frontend environment template  
- `backend/env.example` - Backend environment template
- `scripts/env-check.js` - Environment validation script
- `src/main/config/env.js` - Electron environment config
- `frontend/src/config/env.ts` - Frontend environment config
- `backend/config/env.js` - Backend environment config

## 🔄 Auto-Loading

Environment variables otomatik olarak şu şekilde yüklenir:

1. **Electron**: `src/main/config/env.js` ile
2. **Frontend**: Vite tarafından (`VITE_` prefix)
3. **Backend**: `backend/config/env.js` ile

## 🆘 Yardım

Environment variables ile ilgili sorun yaşıyorsan:

1. `node scripts/env-check.js` çalıştır
2. Template dosyalarını kontrol et
3. Supabase dashboard'dan keys'leri tekrar al
4. `.env` dosyalarının gitignore'da olduğunu kontrol et 