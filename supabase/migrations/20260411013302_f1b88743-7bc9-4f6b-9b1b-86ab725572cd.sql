CREATE TABLE public.content_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content_output_id uuid REFERENCES public.content_outputs(id) ON DELETE CASCADE,
  benchmark_preset text,
  visual_style text,
  outcome_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  satisfaction smallint CHECK (satisfaction BETWEEN 1 AND 5),
  clarity_score smallint CHECK (clarity_score BETWEEN 1 AND 5),
  authority_score smallint CHECK (authority_score BETWEEN 1 AND 5),
  aesthetic_score smallint CHECK (aesthetic_score BETWEEN 1 AND 5),
  posted boolean NOT NULL DEFAULT false,
  reuse_direction boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.content_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own feedback"
  ON public.content_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback"
  ON public.content_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback"
  ON public.content_feedback FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_content_feedback_updated_at
  BEFORE UPDATE ON public.content_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();