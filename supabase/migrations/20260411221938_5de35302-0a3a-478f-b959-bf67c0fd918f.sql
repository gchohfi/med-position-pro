
CREATE TABLE public.patient_personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_interno TEXT NOT NULL,
  faixa_etaria TEXT NOT NULL DEFAULT '30-45',
  momento_vida TEXT NOT NULL DEFAULT '',
  dor_principal TEXT NOT NULL DEFAULT '',
  objecoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  desejo TEXT NOT NULL DEFAULT '',
  gatilhos_confianca JSONB NOT NULL DEFAULT '[]'::jsonb,
  linguagem_ideal TEXT NOT NULL DEFAULT '',
  cta_ideal TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personas" ON public.patient_personas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personas" ON public.patient_personas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personas" ON public.patient_personas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own personas" ON public.patient_personas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_patient_personas_updated_at
  BEFORE UPDATE ON public.patient_personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
