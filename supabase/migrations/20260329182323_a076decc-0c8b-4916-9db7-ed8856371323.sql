
CREATE TABLE public.diagnosis_outputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  diagnosis JSONB NOT NULL DEFAULT '{}'::jsonb,
  estrategia JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnosis_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diagnosis" ON public.diagnosis_outputs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diagnosis" ON public.diagnosis_outputs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diagnosis" ON public.diagnosis_outputs FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_diagnosis_outputs_updated_at BEFORE UPDATE ON public.diagnosis_outputs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
