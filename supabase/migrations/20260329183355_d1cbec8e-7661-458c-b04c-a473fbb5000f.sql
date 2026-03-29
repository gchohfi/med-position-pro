
-- Add golden_case flag to content_outputs
ALTER TABLE public.content_outputs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.content_outputs ADD COLUMN IF NOT EXISTS golden_case BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.content_outputs ADD COLUMN IF NOT EXISTS golden_reason TEXT;
ALTER TABLE public.content_outputs ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;

-- Living memory table (one per user, AI-generated)
CREATE TABLE public.living_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  memory JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.living_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memory" ON public.living_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memory" ON public.living_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memory" ON public.living_memory FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_living_memory_updated_at BEFORE UPDATE ON public.living_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Positioning snapshots for evolution tracking
CREATE TABLE public.positioning_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cycle_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.positioning_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots" ON public.positioning_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON public.positioning_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow updating content_outputs (needed for golden_case marking)
CREATE POLICY "Users can update own content" ON public.content_outputs FOR UPDATE USING (auth.uid() = user_id);
