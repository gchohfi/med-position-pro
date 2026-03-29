
CREATE TABLE public.series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  strategic_role TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'semanal',
  tone TEXT,
  visual_identity TEXT,
  opening_pattern TEXT,
  closing_pattern TEXT,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own series" ON public.series FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own series" ON public.series FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own series" ON public.series FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own series" ON public.series FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.calendar_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  thesis TEXT,
  strategic_objective TEXT,
  visual_direction TEXT,
  status TEXT NOT NULL DEFAULT 'planejado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar items" ON public.calendar_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calendar items" ON public.calendar_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar items" ON public.calendar_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar items" ON public.calendar_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_calendar_items_updated_at BEFORE UPDATE ON public.calendar_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
