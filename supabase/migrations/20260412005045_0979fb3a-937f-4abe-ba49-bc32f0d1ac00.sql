CREATE TABLE public.brand_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanations JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand scores"
ON public.brand_scores FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand scores"
ON public.brand_scores FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand scores"
ON public.brand_scores FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_brand_scores_user_created ON public.brand_scores (user_id, created_at DESC);