
-- Automation preferences per user
CREATE TABLE public.automation_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  radar_frequency TEXT NOT NULL DEFAULT 'semanal',
  memory_refresh BOOLEAN NOT NULL DEFAULT true,
  calendar_check BOOLEAN NOT NULL DEFAULT true,
  repetition_alerts BOOLEAN NOT NULL DEFAULT true,
  territory_suggestions BOOLEAN NOT NULL DEFAULT true,
  positioning_review BOOLEAN NOT NULL DEFAULT true,
  intensity TEXT NOT NULL DEFAULT 'equilibrado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.automation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.automation_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.automation_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.automation_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Strategic updates log
CREATE TABLE public.strategic_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  update_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_module TEXT,
  action_module TEXT,
  action_label TEXT,
  action_path TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own updates" ON public.strategic_updates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own updates" ON public.strategic_updates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own updates" ON public.strategic_updates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own updates" ON public.strategic_updates FOR DELETE USING (auth.uid() = user_id);
