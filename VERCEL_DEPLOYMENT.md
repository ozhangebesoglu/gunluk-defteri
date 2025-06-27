# 🚀 Vercel Deployment Guide

## 🔐 Environment Variables Setup

**⚠️ IMPORTANT:** API keys artık `vercel.json`'da hardcoded değil! 
Environment variables Vercel Dashboard'dan ayarlanmalı.

### 📋 **Vercel Dashboard'da Environment Variables:**

1. **Vercel Dashboard'a Git:**
   ```
   https://vercel.com/dashboard
   ```

2. **Projenizi Seçin** → **Settings** → **Environment Variables**

3. **Şu değerleri ekleyin:**

#### 🔑 **Production Environment Variables:**
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Frontend Vite Variables
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=https://your-vercel-app.vercel.app/api/v1

# Node Environment
NODE_ENV=production
```

#### 🎯 **Environment Scope:**
- ✅ **Production**: Ana deployment için
- ✅ **Preview**: PR'lar için (opsiyonel)
- ⚠️ **Development**: Local dev için (opsiyonel)

### 🛠️ **Deployment Commands:**

```bash
# Manual deploy
vercel --prod

# Environment variables ile deploy
vercel --prod --env SUPABASE_URL=your_url

# Build check
vercel build
```

### 🔒 **Security Best Practices:**

#### ✅ **YAPILMASI GEREKENLER:**
- ✅ Environment variables Vercel Dashboard'dan ayarla
- ✅ Production'da farklı Supabase project kullan
- ✅ Service role key'i backend endpoint'lerde kullan
- ✅ CORS settings'i production domain'e ayarla

#### ❌ **YAPILMAMASI GEREKENLER:**
- ❌ API keys'leri vercel.json'a yazma
- ❌ Secrets'ları commit etme
- ❌ Development keys'leri production'da kullanma

### 🌐 **Production Supabase Setup:**

1. **Yeni Supabase Project Oluştur** (production için)
2. **RLS Policies Aktive Et:**
   ```sql
   ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view own entries" ON diary_entries
   FOR SELECT USING (auth.uid() = user_id);
   ```

3. **CORS Settings:**
   ```
   https://your-vercel-app.vercel.app
   ```

### 📊 **Build Configuration:**

`vercel.json` artık güvenli:
```json
{
  "env": {
    "NODE_ENV": "production"
  }
}
```

Environment variables Vercel Dashboard'dan okunur.

### 🔍 **Deployment Check:**

Deploy sonrası kontrol:
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Environment check
curl https://your-app.vercel.app/api/v1/health
```

### 🆘 **Troubleshooting:**

#### **❌ "Environment variable missing" Error:**
1. Vercel Dashboard → Settings → Environment Variables
2. Gerekli değerleri ekle
3. Redeploy: `vercel --prod`

#### **❌ "CORS Error":**
1. Supabase Dashboard → Settings → API
2. Site URL'i ekle: `https://your-app.vercel.app`

#### **❌ "Database Connection Failed":**
1. Supabase project aktif mi kontrol et
2. Environment variables doğru mu kontrol et
3. RLS policies kontrol et

---

## 🎉 **Production-Ready Deployment!**

Artık güvenli bir şekilde deploy edebilirsiniz! 🚀 