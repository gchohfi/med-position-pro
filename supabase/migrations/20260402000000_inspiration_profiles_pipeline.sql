-- Formal pipeline for inspiration discovery -> verification -> analysis

CREATE TABLE IF NOT EXISTS public.inspiration_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  discovered_handle TEXT NOT NULL,
  normalized_handle TEXT NOT NULL,
  profile_url TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'ai_discovery', 'library')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_review')),
  verification_method TEXT,
  verification_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (verification_confidence >= 0 AND verification_confidence <= 1),
  notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, normalized_handle)
);

CREATE TABLE IF NOT EXISTS public.inspiration_profile_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  normalized_handle TEXT NOT NULL,
  analysis_status TEXT NOT NULL DEFAULT 'queued' CHECK (analysis_status IN ('queued', 'running', 'done', 'failed')),
  raw_research JSONB,
  structured_analysis JSONB,
  generated_ideas JSONB,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, normalized_handle)
);

ALTER TABLE public.inspiration_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_profile_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inspiration profiles"
  ON public.inspiration_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inspiration profiles"
  ON public.inspiration_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspiration profiles"
  ON public.inspiration_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspiration profiles"
  ON public.inspiration_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own inspiration analyses"
  ON public.inspiration_profile_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inspiration analyses"
  ON public.inspiration_profile_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspiration analyses"
  ON public.inspiration_profile_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inspiration analyses"
  ON public.inspiration_profile_analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_inspiration_profiles_updated_at
  BEFORE UPDATE ON public.inspiration_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspiration_profile_analyses_updated_at
  BEFORE UPDATE ON public.inspiration_profile_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
