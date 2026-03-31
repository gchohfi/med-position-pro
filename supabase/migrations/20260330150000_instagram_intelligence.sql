-- Instagram Intelligence Module
-- Tables for tracking competitor profiles and storing AI-generated analyses

-- 1. Tracked Instagram profiles (own + competitors)
CREATE TABLE IF NOT EXISTS instagram_tracked_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  profile_type TEXT NOT NULL DEFAULT 'competitor' CHECK (profile_type IN ('own', 'competitor')),
  display_name TEXT,
  bio TEXT,
  followers_count INTEGER,
  following_count INTEGER,
  media_count INTEGER,
  profile_picture_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, username)
);

-- 2. Instagram analyses (AI-generated intelligence reports)
CREATE TABLE IF NOT EXISTS instagram_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'full' CHECK (analysis_type IN ('full', 'trends', 'competitors', 'performance')),
  summary TEXT,
  trends JSONB DEFAULT '[]'::jsonb,
  competitor_insights JSONB DEFAULT '[]'::jsonb,
  performance_analysis JSONB DEFAULT '{}'::jsonb,
  visual_suggestions JSONB DEFAULT '[]'::jsonb,
  content_patterns JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for instagram_tracked_profiles
ALTER TABLE instagram_tracked_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracked profiles"
  ON instagram_tracked_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracked profiles"
  ON instagram_tracked_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked profiles"
  ON instagram_tracked_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked profiles"
  ON instagram_tracked_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for instagram_analyses
ALTER TABLE instagram_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON instagram_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON instagram_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON instagram_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON instagram_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at triggers
CREATE TRIGGER update_instagram_tracked_profiles_updated_at
  BEFORE UPDATE ON instagram_tracked_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instagram_analyses_updated_at
  BEFORE UPDATE ON instagram_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_instagram_tracked_profiles_user_id ON instagram_tracked_profiles(user_id);
CREATE INDEX idx_instagram_analyses_user_id ON instagram_analyses(user_id);
CREATE INDEX idx_instagram_analyses_created_at ON instagram_analyses(created_at DESC);
