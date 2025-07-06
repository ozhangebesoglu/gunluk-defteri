# Google Authentication Kurulum Rehberi

## 🚀 Hızlı Başlangıç

Google Auth çalışmıyor çünkü Supabase'de Google provider henüz etkinleştirilmemiş. İşte adımlar:

### 1. Google Cloud Console Kurulumu (5 dakika)

1. [Google Cloud Console](https://console.cloud.google.com/) git
2. Yeni proje oluştur veya mevcut projeyi seç
3. **APIs & Services > Credentials** gir
4. **Create Credentials > OAuth 2.0 Client IDs** tıkla
5. **Web application** seç
6. **Authorized redirect URIs** ekle:
   ```
   https://nbjnmhtgluctoeyrbgkd.supabase.co/auth/v1/callback
   ```

### 2. Supabase Kurulumu (2 dakika)

1. [Supabase Dashboard](https://supabase.com/dashboard) git
2. Proje: `nbjnmhtgluctoeyrbgkd` seç
3. **Authentication > Providers** git
4. **Google** etkinleştir
5. Google Console'dan aldığın değerleri gir:
   - **Client ID**: `your-google-client-id`
   - **Client Secret**: `your-google-client-secret`

### 3. Test (1 dakika)

Sayfayı yenile ve "Google ile Giriş Yap" butonunu test et.

## 🔧 Development Redirect URLs

Development için ayrıca şu URL'leri de ekle:

```
http://localhost:5173
http://localhost:3000
http://localhost:5174
```

## ✅ Doğrulama

Başarılı kurulum sonrası:
- Google butonu çalışacak
- OAuth popup açılacak
- Otomatik olarak Dashboard'a yönlendirilecek
- Kullanıcı profili oluşturulacak

## 🚨 Yaygın Hatalar

**Error: "Unsupported provider"**
→ Supabase'de Google provider etkin değil

**Error: "redirect_uri_mismatch"**
→ Google Console'da redirect URI eksik

**Error: "unauthorized_client"**
→ Client ID/Secret yanlış

## 📋 Konfigürasyon Kontrol

Mevcut ayarlar:
- Supabase URL: `https://nbjnmhtgluctoeyrbgkd.supabase.co`
- Redirect: Ana sayfa (`http://localhost:5173`)
- Environment: Development

---

**Kurulum sonrası Authentication modal ile Google giriş tamamen çalışacak!** 