# 🗄️ Supabase Database Schema Kurulumu - ACİL

## ❌ **SORUN:**
```
relation "public.profiles" does not exist
```

## ✅ **HIZLI ÇÖZÜM:**

### **Adım 1: Supabase SQL Editor**
1. [Supabase Dashboard](https://app.supabase.com/) → `nbjnmhtgluctoeyrbgkd`
2. Sol menü → **SQL Editor** 📝

### **Adım 2: Schema Script Çalıştır**
**Aşağıdaki SQL'i kopyala-yapıştır ve RUN ET:**

```sql
-- ==========================================
-- GÜNCE DEFTERI - Database Schema (Hızlı Kurulum)
-- ==========================================

-- 1. Profiles table (User bilgileri)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. Enhanced diary_entries (user-specific)
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entry_date DATE NOT NULL,
  day_of_week TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  sentiment TEXT CHECK (sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  sentiment_score DECIMAL(3,2),
  weather TEXT,
  location TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  word_count INTEGER DEFAULT 0,
  read_time INTEGER DEFAULT 0,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict', 'error')),
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Diary tags (user-specific)
CREATE TABLE IF NOT EXISTS public.diary_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#007bff',
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_tags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Diary entries policies
CREATE POLICY "Users can view own diary entries" ON public.diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diary entries" ON public.diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diary entries" ON public.diary_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diary entries" ON public.diary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Diary tags policies
CREATE POLICY "Users can view own tags" ON public.diary_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON public.diary_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON public.diary_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON public.diary_tags
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- SAMPLE DATA (İlk kullanıcı için)
-- ==========================================

-- Otomatik profile oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Yeni kullanıcı kayıt olduğunda otomatik profile oluştur
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mevcut kullanıcı için profile oluştur
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

### **Adım 3: Script Çalıştır**
- **RUN** butonuna tıkla
- **Success** mesajını bekle

### **Adım 4: Test Et**
- Uygulamayı yenile (`Ctrl+F5`)
- Profile error'ları kaybolmalı

## ✅ **BAŞARI GÖSTERGELERİ:**
```
✅ [AUTH] User profile loaded
✅ [AUTH] Profile load success
❌ relation "public.profiles" does not exist → KAYBOLUR
``` 