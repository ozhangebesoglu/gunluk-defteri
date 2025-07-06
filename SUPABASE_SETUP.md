# 🚀 Supabase Setup Rehberi - Context7 Uyumlu Multi-Platform Sync

## 📋 HIZLI BAŞLANGIÇ

### 1. Supabase Projesi Oluşturun

1. [Supabase](https://app.supabase.com) sitesine gidin
2. "New Project" butonuna tıklayın
3. Proje adı: `gunce-defteri`
4. Database şifresi: Güçlü bir şifre belirleyin
5. Region: En yakın lokasyon (Europe West)

### 2. Environment Variables Ayarlayın

Frontend `.env` dosyası oluşturun:
```bash
# frontend/.env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Değerleri nereden alacağınız:**
- Supabase Dashboard → Settings → API
- URL: `Project URL`
- Anon Key: `anon public` key

### 3. Database Schema Kurulumu

Supabase SQL Editor'da şu scripti çalıştırın:

```sql
-- ==========================================
-- GÜNCE DEFTERI - Database Schema (Context7 Uyumlu)
-- ==========================================

-- 1. Profiles table (User bilgileri)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 2. Enhanced diary_entries (user-specific)
CREATE TABLE public.diary_entries (
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
CREATE TABLE public.diary_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#007bff',
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (Context7 Pattern)
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
-- REAL-TIME SETUP (Context7 Pattern)
-- ==========================================

-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diary_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diary_tags;

-- Real-time broadcast policies (Context7 requirement)
CREATE POLICY "authenticated users can receive broadcasts"
ON "realtime"."messages" 
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "authenticated users can send broadcasts"
ON "realtime"."messages"
FOR INSERT TO authenticated
WITH CHECK (true);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- INDEXES (Performance optimization)
-- ==========================================

-- Diary entries indexes
CREATE INDEX idx_diary_entries_user_id ON public.diary_entries (user_id);
CREATE INDEX idx_diary_entries_entry_date ON public.diary_entries (entry_date DESC);
CREATE INDEX idx_diary_entries_user_date ON public.diary_entries (user_id, entry_date DESC);
CREATE INDEX idx_diary_entries_tags ON public.diary_entries USING GIN (tags);
CREATE INDEX idx_diary_entries_sentiment ON public.diary_entries (sentiment);
CREATE INDEX idx_diary_entries_favorites ON public.diary_entries (user_id, is_favorite) WHERE is_favorite = true;

-- Full-text search index
CREATE INDEX idx_diary_entries_search ON public.diary_entries 
USING GIN (to_tsvector('turkish', title || ' ' || content));

-- Tags indexes
CREATE INDEX idx_diary_tags_user_id ON public.diary_tags (user_id);
CREATE INDEX idx_diary_tags_name ON public.diary_tags (user_id, name);
```

### 4. Google Auth Kurulumu

1. **Google Cloud Console Setup:**
   - [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
   - "Create Credentials" → "OAuth 2.0 Client IDs"
   - Application Type: Web application
   - Authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```

2. **Supabase Auth Setup:**
   - Supabase Dashboard → Authentication → Providers
   - Google toggle'ını aktif edin
   - Client ID ve Client Secret'i girin
   - Redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

### 5. Demo Data (Opsiyonel)

Test için demo data eklemek isterseniz:

```sql
-- Demo profiles (signup sonrası otomatik oluşturulacak)

-- Demo diary entries (user_id'yi kendi kullanıcı ID'nizle değiştirin)
INSERT INTO public.diary_entries (user_id, title, content, entry_date, day_of_week, tags, sentiment, is_favorite, word_count) VALUES
('your-user-id-here', 'İlk Günlük Kaydım', 'Bugün yeni günlük uygulamamı test ediyorum. Context7 dokümantasyonuna uygun şekilde Supabase entegrasyonu harika çalışıyor!', CURRENT_DATE, 'Pazartesi', ARRAY['test', 'başlangıç'], 'positive', true, 25),
('your-user-id-here', 'Multi-Platform Sync', 'Web ve desktop arasında senkronizasyon mükemmel çalışıyor. Real-time updates anında geliyor!', CURRENT_DATE - 1, 'Pazar', ARRAY['teknoloji', 'sync'], 'very_positive', false, 18);

-- Demo tags
INSERT INTO public.diary_tags (user_id, name, color, description) VALUES
('your-user-id-here', 'Test', '#FF6B6B', 'Test kayıtları'),
('your-user-id-here', 'Teknoloji', '#4ECDC4', 'Teknoloji ile ilgili'),
('your-user-id-here', 'Günlük', '#45B7D1', 'Günlük rutinler');
```

## 🔧 TROUBLESHOOTING

### Sık Karşılaşılan Sorunlar:

1. **Environment Variables**
   ```bash
   # .env dosyasında VITE_ prefix olmadan çalışmaz
   VITE_SUPABASE_URL=https://...  # ✅ Doğru
   SUPABASE_URL=https://...       # ❌ Yanlış
   ```

2. **RLS Policies**
   ```sql
   -- auth.uid() null dönüyorsa policy çalışmaz
   -- Kullanıcının giriş yapmış olduğundan emin olun
   ```

3. **Real-time Connection**
   ```typescript
   // setAuth() çağrısı private channels için gerekli
   await supabase.realtime.setAuth()
   ```

## ✅ DOĞRULAMA

Test için şu adımları izleyin:

1. **Authentication Test:**
   - Google ile giriş yapın
   - Profile bilgileriniz profiles tablosunda görünmeli

2. **Real-time Test:**
   - İki farklı browser tab açın
   - Birinde entry oluşturun
   - Diğerinde anında görünmeli

3. **Sync Status:**
   - Sağ üst köşede sync durumu görünmeli
   - Network bağlantısını kesip tekrar açın

## 🚀 PRODUCTION DEPLOYMENT

Production için ek ayarlar:

1. **Security:**
   - RLS policies'i production verisiyle test edin
   - API rate limiting ekleyin

2. **Performance:**
   - Connection pooling aktif edin
   - Database indexes optimize edin

3. **Monitoring:**
   - Supabase Dashboard metrics takip edin
   - Real-time connection sayısını monitör edin

Bu setup ile Context7 uyumlu, production-ready multi-platform sync sisteminiz hazır! 🎉 