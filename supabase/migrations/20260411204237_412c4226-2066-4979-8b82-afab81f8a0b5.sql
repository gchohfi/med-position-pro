
CREATE TABLE public.content_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content_output_id uuid REFERENCES public.content_outputs(id) ON DELETE CASCADE,
  external_post_id text,
  external_post_url text,
  published_at timestamp with time zone,
  source text NOT NULL DEFAULT 'manual',
  sync_status text NOT NULL DEFAULT 'pending',
  synced_at timestamp with time zone,
  reach integer,
  impressions integer,
  saves integer,
  shares integer,
  comments integer,
  clicks integer,
  follows integer,
  retention_rate numeric,
  engagement_rate numeric,
  predicted_score integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_output_id)
);

ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own performance" ON public.content_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own performance" ON public.content_performance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own performance" ON public.content_performance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own performance" ON public.content_performance FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_content_performance_updated_at
BEFORE UPDATE ON public.content_performance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
