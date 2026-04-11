-- Strategic memory per user
CREATE TABLE public.strategic_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  preferred_presets jsonb NOT NULL DEFAULT '[]'::jsonb,
  rejected_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_visual_styles jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  cta_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  hook_intensity text NOT NULL DEFAULT 'moderado',
  last_accepted_directions jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_rejected_directions jsonb NOT NULL DEFAULT '[]'::jsonb,
  rewrite_count integer NOT NULL DEFAULT 0,
  export_count integer NOT NULL DEFAULT 0,
  notes_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategic memory"
  ON public.strategic_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategic memory"
  ON public.strategic_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategic memory"
  ON public.strategic_memory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_strategic_memory_updated_at
  BEFORE UPDATE ON public.strategic_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();