# Supabase Schema Güncelleme - Profiles Tablosu Ekleme

## Problem
Şu anda `"relation public.profiles does not exist"` hatası alıyorsunuz çünkü Supabase auth sistemi için gerekli `profiles` tablosu eksik.

## Çözüm Adımları

### 1. Supabase Dashboard'a Git
1. [Supabase Dashboard](https://supabase.com/dashboard)
2. Projenizi seçin: **ozhangebesoglu's Project**
3. Sol menüden **SQL Editor**'a tıklayın

### 2. Schema'yı Güncelle
1. **New Query** butonuna tıklayın
2. Aşağıdaki SQL kodunu kopyalayıp yapıştırın ve çalıştırın:

```sql
-- Profiles Tablosu Ekleme
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diary Entries tablosuna user_id ekleme
ALTER TABLE diary_entries 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- RLS Ayarları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Diary Entries Policies Güncelleme
DROP POLICY IF EXISTS "Enable all access for anonymous users" ON diary_entries;

CREATE POLICY "Users can view own entries" ON diary_entries
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own entries" ON diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON diary_entries
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own entries" ON diary_entries
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Profile Auto-Creation Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-Creation Trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at Trigger
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Mevcut Kullanıcı İçin Profile Oluştur
Eğer zaten giriş yaptıysanız, mevcut kullanıcınız için manuel olarak profile oluşturun:

```sql
-- Mevcut auth.users'dan profiles oluştur
INSERT INTO profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### 4. Test Et
1. Uygulamanızı yeniden başlatın
2. Giriş yapmayı deneyin
3. Console'da hata olup olmadığını kontrol edin

## Beklenen Sonuç
- ✅ "relation public.profiles does not exist" hatası çözülecek
- ✅ Google OAuth giriş işlemi tamamlanacak
- ✅ Kullanıcıya özel entry'ler görüntülenecek
- ✅ Multi-user sync sistemi aktif olacak

## Önemli Notlar
- Bu güncelleme sonrası her kullanıcı sadece kendi entry'lerini görecek
- Mevcut demo entry'ler user_id olmadığı için görünmeyebilir (bu normaldir)
- Yeni entry'ler otomatik olarak giriş yapan kullanıcıya atanacak

## Sorun Yaşarsanız
Eğer SQL çalıştırırken hata alırsanız:
1. Mevcut `supabase-schema.sql` dosyasını tamamen çalıştırın
2. Veya her SQL bloğunu tek tek çalıştırın
3. Hataları kontrol edin ve benimle paylaşın 