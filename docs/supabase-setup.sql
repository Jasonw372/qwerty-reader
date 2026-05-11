-- =============================================================
-- Qwerty Reader - Supabase Schema Setup
-- Run this in Supabase SQL Editor to set up the database
-- =============================================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT DEFAULT NULL,
  language TEXT DEFAULT 'en-US',
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Typing sessions
CREATE TABLE IF NOT EXISTS typing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  wpm NUMERIC(6,1),
  accuracy NUMERIC(5,2),
  duration_seconds INTEGER,
  total_chars INTEGER,
  correct_chars INTEGER,
  incorrect_chars INTEGER,
  backspace_count INTEGER,
  keystrokes JSONB,
  error_heatmap JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Dictionary cache
CREATE TABLE IF NOT EXISTS dict_cache (
  word TEXT PRIMARY KEY,
  phonetic TEXT,
  meanings JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_is_public ON articles(is_public);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_user_id ON typing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_sessions_created_at ON typing_sessions(created_at DESC);

-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

-- Articles: users can only see/update their own
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own articles"
  ON articles FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own articles"
  ON articles FOR DELETE
  USING (auth.uid() = user_id);

-- Typing sessions: users can only see their own
ALTER TABLE typing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own sessions"
  ON typing_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON typing_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Profiles: users can see all profiles but only edit their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Dict cache: public read, authenticated insert/update
ALTER TABLE dict_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dict cache is publicly readable" ON dict_cache;
CREATE POLICY "Dict cache is publicly readable"
  ON dict_cache FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert dict cache" ON dict_cache;
CREATE POLICY "Authenticated users can insert dict cache"
  ON dict_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update dict cache" ON dict_cache;
CREATE POLICY "Authenticated users can update dict cache"
  ON dict_cache FOR UPDATE
  USING (auth.role() = 'authenticated');
