# 🔧 Supabase Google OAuth Provider Kurulumu

## 🎯 **AMAÇ:** Google ile giriş çalışır hale getirmek

### 📍 **Mevcut Durum:**
- ✅ Google OAuth popup açılıyor
- ✅ Hesap seçimi yapılıyor
- ✅ İzin veriliyor
- ❌ **ANCAK** giriş başarısız, auth modal'a geri dönüyor

### 📍 **SEBEP:** Supabase'de Google provider etkin değil

## 🔧 **ÇÖZÜM ADIMLARI:**

### **Adım 1: Supabase Dashboard**
1. [Supabase Dashboard](https://app.supabase.com/) → Giriş yap
2. Proje seç: **`nbjnmhtgluctoeyrbgkd`**

### **Adım 2: Authentication Provider Ayarları**
1. Sol menü → **Authentication** 🔐
2. **Providers** sekmesine tıkla
3. **Google** provider'ını bul

### **Adım 3: Google Provider Etkinleştir**
1. **Google** kutusuna tıkla
2. **Enable Sign in with Google** → **Enabled** yap ✅

### **Adım 4: Credentials Gir**
```
Client ID: 68665965882-ifavfbsuqlhjvfk2pekrtgsvpn3cag9t.apps.googleusercontent.com
Client Secret: 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
```

### **Adım 5: Redirect URLs Kontrol**
**Authorize redirect URLs** bölümünde şu URL'ler olmalı:
```
https://nbjnmhtgluctoeyrbgkd.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
```

### **Adım 6: Kaydet**
**SAVE** butonuna tıkla

## ✅ **TEST SONRASI BEKLENTİLER:**

### **Başarılı Google OAuth Akışı:**
1. "Google ile Giriş Yap" → Popup açılır ✅
2. Hesap seç → Gmail hesabını seç ✅
3. İzin ver → "nbjnmhtgluctoeyrbgkd.supabase.co hesabında..." → İzin ver ✅
4. **YENİ:** Modal kapanır, Dashboard'a yönlendirilir ✅
5. Console'da: `✅ [AUTH] User signed in with Google` ✅

### **Başarısızlık Durumunda:**
- Tekrar auth modal'a dönerse → **Provider ayarları kontrol et**
- Console'da OAuth error → **Credentials kontrol et**

## 🔗 **REFERANSLAR:**
- Context7 Pattern: Provider-based authentication
- Supabase Auth: External OAuth providers
- Security: PKCE + state validation

## ⚡ **HİZLI TEST:**
1. Supabase provider'ı etkinleştir
2. `npm run dev` yeniden başlat
3. Google ile giriş dene
4. Console loglarını kontrol et 