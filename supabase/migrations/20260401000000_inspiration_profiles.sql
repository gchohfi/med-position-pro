-- Table for inspiration profiles
CREATE TABLE IF NOT EXISTS public.inspiration_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL,
  normalized_handle TEXT NOT NULL,
  display_name TEXT,
  specialty TEXT,
  country TEXT DEFAULT 'BR',
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'ai_discovery', 'imported')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_review')),
  verification_method TEXT,
  verification_confidence NUMERIC(3,2),
  verified_at TIMESTAMPTZ,
  profile_url TEXT,
  followers_estimate TEXT,
  content_style TEXT,
  why_inspiring TEXT,
  content_pillars TEXT[],
  standout_formats TEXT[],
  reference_level TEXT DEFAULT 'medio',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for analyses (only on verified profiles)
CREATE TABLE IF NOT EXISTS public.inspiration_profile_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.inspiration_profiles(id) ON DELETE CASCADE,
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'running', 'completed', 'failed')),
  raw_research TEXT,
  structured_analysis JSONB,
  generated_ideas JSONB,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inspiration_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_profile_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage own profiles" ON public.inspiration_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analyses" ON public.inspiration_profile_analyses
  FOR ALL USING (profile_id IN (SELECT id FROM public.inspiration_profiles WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_inspiration_profiles_user ON public.inspiration_profiles(user_id);
CREATE INDEX idx_inspiration_profiles_status ON public.inspiration_profiles(verification_status);
CREATE INDEX idx_inspiration_analyses_profile ON public.inspiration_profile_analyses(profile_id);
