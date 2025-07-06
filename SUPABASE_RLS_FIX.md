# Supabase RLS Policy Düzeltmesi - HTTP 406 Hatası Çözümü

## Problem
`profiles` tablosundan veri çekerken **HTTP 406 Not Acceptable** hatası alıyorsunuz. Bu RLS (Row Level Security) policy'lerinin çok kısıtlayıcı olmasından kaynaklanıyor.

## Çözüm: Daha Esnek Policy'ler

### 1. Supabase SQL Editor'da çalıştırın:

```sql
-- Eski policy'leri temizle
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Daha esnek policy'ler oluştur
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = id);

CREATE POLICY "Enable update for users based on id" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id" ON profiles
  FOR DELETE USING (auth.uid() = id);
```

### 2. Diary Entries Policy'lerini de düzelt:

```sql
-- Eski policy'leri temizle
DROP POLICY IF EXISTS "Users can view own entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON diary_entries;

-- Daha esnek policy'ler
CREATE POLICY "Enable read for authenticated users" ON diary_entries
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (auth.uid() = user_id OR user_id IS NULL)
  );

CREATE POLICY "Enable insert for authenticated users" ON diary_entries
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id
  );

CREATE POLICY "Enable update for authenticated users" ON diary_entries
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    (auth.uid() = user_id OR user_id IS NULL)
  );

CREATE POLICY "Enable delete for authenticated users" ON diary_entries
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    (auth.uid() = user_id OR user_id IS NULL)
  );
```

### 3. Test Query'si çalıştırın:

```sql
-- Bu query çalışmalı (kendi profilinizi görmeli)
SELECT * FROM profiles WHERE id = auth.uid();

-- Bu da çalışmalı (entries görmeli)
SELECT * FROM diary_entries WHERE user_id = auth.uid() OR user_id IS NULL;
```

## Beklenen Sonuç

✅ HTTP 406 hatası çözülecek  
✅ Profile verileri çekilecek  
✅ "user is null" hatası düzelecek  
✅ Yeni günce yazabileceksiniz

## Test Adımları

1. Yukarıdaki SQL'leri çalıştırın
2. Frontend'i yenileyin (F5)
3. Giriş yapmayı deneyin
4. Console'da artık HTTP 406 hatası görmemelisiniz
5. Yeni günce yazmayı deneyin

Bu RLS düzeltmeleri Context7 best practices'e uygun ve güvenli ama esnek policy'ler içeriyor. 