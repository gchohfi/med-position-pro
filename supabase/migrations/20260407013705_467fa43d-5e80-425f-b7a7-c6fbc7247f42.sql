-- ============================================================
-- Cria inspiration_profiles e inspiration_profile_analyses
-- com schema alinhado às Edge Functions
-- ============================================================

-- 1. inspiration_profiles
CREATE TABLE public.inspiration_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  handle TEXT NOT NULL,
  discovered_handle TEXT NOT NULL,
  normalized_handle TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  followers_estimate TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual'
    CONSTRAINT inspiration_profiles_source_type_check
    CHECK (source_type IN ('manual', 'ai_discovery', 'imported', 'library')),
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT inspiration_profiles_verification_status_check
    CHECK (verification_status IN ('pending', 'verified', 'failed', 'skipped')),
  confidence_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT inspiration_profiles_user_id_normalized_handle_key
    UNIQUE (user_id, normalized_handle)
);

ALTER TABLE public.inspiration_profiles ENABLE ROW LEVEL SECURITY;

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

-- Trigger para updated_at
CREATE TRIGGER update_inspiration_profiles_updated_at
  BEFORE UPDATE ON public.inspiration_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. inspiration_profile_analyses
CREATE TABLE public.inspiration_profile_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.inspiration_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  normalized_handle TEXT,
  analysis_status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT inspiration_profile_analyses_analysis_status_check
    CHECK (analysis_status IN ('pending', 'queued', 'running', 'completed', 'done', 'failed')),
  analysis_result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT inspiration_profile_analyses_user_id_normalized_handle_key
    UNIQUE (user_id, normalized_handle)
);

ALTER TABLE public.inspiration_profile_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.inspiration_profile_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.inspiration_profile_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.inspiration_profile_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.inspiration_profile_analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_inspiration_profile_analyses_updated_at
  BEFORE UPDATE ON public.inspiration_profile_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();