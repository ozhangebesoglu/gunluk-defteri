# 🔑 Supabase API Keys Alma Rehberi

## 🎯 **AMAÇ:** Doğru API keys alıp Invalid API key hatasını çözmek

### 📍 **Adım 1: Supabase Dashboard**
1. [Supabase Dashboard](https://app.supabase.com/) → Giriş yap
2. Proje seç: **`nbjnmhtgluctoeyrbgkd`**

### 📍 **Adım 2: API Settings**
1. Sol menü → **Settings** ⚙️
2. **API** sekmesine tıkla

### 📍 **Adım 3: Keys Kopyala**

#### **A) Project URL:**
```
https://nbjnmhtgluctoeyrbgkd.supabase.co
```

#### **B) anon public Key:** 
```
Project API keys > anon public > [COPY] butonuna tıkla
```

**Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (çok uzun) eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iam5taHRnbHVjdG9leXJiZ2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NDc3MzEsImV4cCI6MjA2NjUyMzczMX0.84GFmIzKFUL6c2I370yyPNVwi9d6IRtXkZAt2ZNAr4Q

#### **C) service_role Key (opsiyonel):**
```
Project API keys > service_role > [COPY] butonuna tıkla  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iam5taHRnbHVjdG9leXJiZ2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDk0NzczMSwiZXhwIjoyMDY2NTIzNzMxfQ.NWTlcL56pDZ6igHOQaKafSYwVgYq_VXh2ScZa6WGzMw
```

### 📍 **Adım 4: .env Dosyasını Güncelle**

**Yol:** `frontend/.env`

```env
# ✅ Gerçek keys ile değiştir:
VITE_SUPABASE_URL=https://nbjnmhtgluctoeyrbgkd.supabase.co
VITE_SUPABASE_ANON_KEY=[BURAYA_GERÇEK_ANON_KEY_YAPIŞTR]

# Google OAuth
VITE_GOOGLE_CLIENT_ID=68665965882-ifavfbsuqlhjvfk2pekrtgsvpn3cag9t.apps.googleusercontent.com

# Development
VITE_APP_ENV=development
VITE_LOG_LEVEL=info
```

### 📍 **Adım 5: Test Et**
```bash
cd frontend
npm run dev
```

## 🚨 **ÖNEMLİ NOT:**
- **anon key** çok uzun (200+ karakter)
- Copy-paste sırasında kesik alınmamalı
- Başında/sonunda boşluk olmamalı

## ✅ **BAŞARI GÖSTERGELER:**
1. Console'da: `[SUPABASE] Client initialized` ✅
2. Environment warnings kaybolur ✅
3. `Invalid API key` hatası gider ✅ 