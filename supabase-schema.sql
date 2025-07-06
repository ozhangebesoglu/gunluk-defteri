-- Günlük Defteri Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table (Supabase Auth Integration)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diary Entries Table
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  encrypted_content TEXT,
  entry_date DATE NOT NULL,
  day_of_week VARCHAR(20),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  sentiment VARCHAR(20) CHECK (sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  sentiment_score FLOAT DEFAULT 0,
  weather VARCHAR(50),
  location VARCHAR(255),
  is_favorite BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  word_count INTEGER DEFAULT 0,
  read_time INTEGER DEFAULT 0, -- minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diary Tags Table
CREATE TABLE IF NOT EXISTS diary_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) NOT NULL DEFAULT '#007bff',
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  data_type VARCHAR(20) DEFAULT 'string',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, setting_key) -- Ensures a user has only one value for each setting
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries (entry_date);
CREATE INDEX IF NOT EXISTS idx_diary_entries_sentiment ON diary_entries (sentiment);
CREATE INDEX IF NOT EXISTS idx_diary_entries_favorite ON diary_entries (is_favorite);
CREATE INDEX IF NOT EXISTS idx_diary_entries_tags_gin ON diary_entries USING GIN (tags);

-- Full-text search index (Turkish support)
CREATE INDEX IF NOT EXISTS idx_diary_entries_search ON diary_entries USING GIN (
  to_tsvector('simple', title || ' ' || content)
);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_diary_entries_date_sentiment ON diary_entries (entry_date, sentiment);

-- Row Level Security (RLS) - Multi-user support
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (secure multi-user)
-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Diary Entries: Users can only access their own entries
CREATE POLICY "Users can view own entries" ON diary_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entries" ON diary_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" ON diary_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" ON diary_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Tags: Shared across all users (read-only for now)
CREATE POLICY "All users can view tags" ON diary_tags
  FOR SELECT USING (true);

-- User Settings: Users can only access their own settings
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diary_entries_updated_at BEFORE UPDATE ON diary_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo data
INSERT INTO diary_tags (id, name, color, description) VALUES
  (uuid_generate_v4(), 'Mutluluk', '#FFD700', 'Mutlu anları etiketlemek için'),
  (uuid_generate_v4(), 'Üzgün', '#4169E1', 'Üzgün hissettiğim günler'),
  (uuid_generate_v4(), 'İş', '#FF6347', 'İş ile ilgili günlük kayıtları'),
  (uuid_generate_v4(), 'Aile', '#32CD32', 'Aile ile geçirilen zamanlar'),
  (uuid_generate_v4(), 'Seyahat', '#FF69B4', 'Seyahat anıları'),
  (uuid_generate_v4(), 'Başarı', '#9370DB', 'Başarı hikayeleri'),
  (uuid_generate_v4(), 'Öğrenme', '#20B2AA', 'Yeni öğrenilen şeyler'),
  (uuid_generate_v4(), 'Sağlık', '#228B22', 'Sağlık ve spor kayıtları')
ON CONFLICT (name) DO NOTHING;

-- Insert demo entries
INSERT INTO diary_entries (id, title, content, entry_date, day_of_week, tags, sentiment, sentiment_score, weather, location, is_favorite, word_count, read_time) VALUES
  (
    uuid_generate_v4(),
    'Güzel Bir Başlangıç',
    'Bugün yeni günlük uygulamama ilk girişimi yapıyorum. Oldukça heyecanlıyım! Bu dijital günlük sayesinde düşüncelerimi daha düzenli tutabileceğimi umuyorum.',
    CURRENT_DATE - INTERVAL '7 days',
    'Pazartesi',
    ARRAY['Mutluluk', 'Başarı'],
    'positive',
    0.8,
    'Güneşli',
    'İstanbul',
    true,
    32,
    1
  ),
  (
    uuid_generate_v4(),
    'İş Yoğunluğu',
    'Bugün işte çok yoğun bir gün geçirdim. Proje deadline''ı yaklaşıyor ve takım olarak epey stres altındayız. Ancak iyi bir ekip çalışması sergiliyoruz.',
    CURRENT_DATE - INTERVAL '6 days',
    'Salı',
    ARRAY['İş'],
    'neutral',
    0.5,
    'Bulutlu',
    'Ankara',
    false,
    28,
    1
  ),
  (
    uuid_generate_v4(),
    'Aile Yemeği',
    'Akşam ailecek toplandık ve uzun zamandır hasret kaldığımız ev yemeklerini yedik. Annemin yaptığı dolma ve baklava muhteşemdi. Bu tür anların kıymetini bilmek lazım.',
    CURRENT_DATE - INTERVAL '5 days',
    'Çarşamba',
    ARRAY['Aile', 'Mutluluk'],
    'very_positive',
    0.9,
    'Yağmurlu',
    'İzmir',
    true,
    35,
    1
  ),
  (
    uuid_generate_v4(),
    'Yeni Şeyler Öğreniyorum',
    'Bugün Supabase ve modern web development hakkında çok şey öğrendim. Özellikle real-time özellikleri ve database entegrasyonu çok etkileyici.',
    CURRENT_DATE - INTERVAL '4 days',
    'Perşembe',
    ARRAY['Öğrenme', 'İş'],
    'positive',
    0.7,
    'Güneşli',
    'İstanbul',
    false,
    25,
    1
  ),
  (
    uuid_generate_v4(),
    'Hafta Sonu Keyfi',
    'Harika bir hafta sonu geçiriyorum! Arkadaşlarımla pikniğe gittik, doğanın içinde nefes aldık. Şehir hayatının stresinden uzaklaşmak bazen çok iyi geliyor.',
    CURRENT_DATE - INTERVAL '2 days',
    'Cumartesi',
    ARRAY['Mutluluk', 'Seyahat'],
    'very_positive',
    0.85,
    'Güneşli',
    'Bolu',
    true,
    26,
    1
  )
ON CONFLICT (id) DO NOTHING;

-- Insert default settings
INSERT INTO user_settings (id, setting_key, setting_value, data_type) VALUES
  (uuid_generate_v4(), 'theme', 'dark', 'string'),
  (uuid_generate_v4(), 'language', 'tr', 'string'),
  (uuid_generate_v4(), 'auto_backup', 'true', 'boolean'),
  (uuid_generate_v4(), 'backup_frequency', '7', 'number'),
  (uuid_generate_v4(), 'enable_encryption', 'false', 'boolean'),
  (uuid_generate_v4(), 'sentiment_analysis', 'true', 'boolean'),
  (uuid_generate_v4(), 'entries_per_page', '10', 'number'),
  (uuid_generate_v4(), 'default_view', 'list', 'string'),
  (uuid_generate_v4(), 'reminder_enabled', 'false', 'boolean'),
  (uuid_generate_v4(), 'reminder_time', '20:00', 'string')
ON CONFLICT (setting_key) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Günlük Defteri database schema created successfully!';
  RAISE NOTICE '📊 Tables: diary_entries, diary_tags, user_settings';
  RAISE NOTICE '🔍 Indexes: Full-text search, performance indexes';
  RAISE NOTICE '🛡️ RLS: Enabled with anonymous access policies';
  RAISE NOTICE '📝 Demo data: 5 entries, 8 tags, 10 settings';
END $$; 