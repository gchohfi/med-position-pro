
-- 1. Uploaded assets table for visual asset management
CREATE TABLE public.uploaded_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  note TEXT,
  linked_module TEXT,
  linked_series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  linked_calendar_item_id UUID REFERENCES public.calendar_items(id) ON DELETE SET NULL,
  favorite BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets" ON public.uploaded_assets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assets" ON public.uploaded_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.uploaded_assets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own assets" ON public.uploaded_assets FOR DELETE USING (auth.uid() = user_id);

-- 2. Refresh logs for observability
CREATE TABLE public.refresh_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  source_module TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.refresh_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.refresh_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.refresh_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Recommended actions (persistent, consumable)
CREATE TABLE public.recommended_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  action_type TEXT NOT NULL,
  reason TEXT,
  priority TEXT NOT NULL DEFAULT 'media',
  related_module TEXT,
  action_path TEXT,
  consumed BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recommended_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions" ON public.recommended_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actions" ON public.recommended_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own actions" ON public.recommended_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own actions" ON public.recommended_actions FOR DELETE USING (auth.uid() = user_id);

-- 4. Storage bucket for user assets
INSERT INTO storage.buckets (id, name, public) VALUES ('user-assets', 'user-assets', true);

-- Storage RLS: users can manage their own folder
CREATE POLICY "Users can upload own assets" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own assets" ON storage.objects FOR SELECT USING (
  bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own assets" ON storage.objects FOR DELETE USING (
  bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view assets" ON storage.objects FOR SELECT USING (
  bucket_id = 'user-assets'
);

-- 5. DB function to log events (callable from client or triggers)
CREATE OR REPLACE FUNCTION public.log_strategic_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_source_module TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.refresh_logs (user_id, event_type, source_module, details)
  VALUES (p_user_id, p_event_type, p_source_module, p_details)
  RETURNING id INTO log_id;
  RETURN log_id;
END;
$$;
