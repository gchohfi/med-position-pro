
-- Inspiration references table
CREATE TABLE public.inspiration_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('layout', 'conteudo', 'golden_case_starter')),
  title TEXT NOT NULL,
  segment TEXT,
  suggestion_reason TEXT,
  what_to_absorb TEXT,
  what_to_avoid TEXT,
  adherence_level TEXT NOT NULL DEFAULT 'moderada' CHECK (adherence_level IN ('alta', 'moderada', 'experimental')),
  strategic_pattern TEXT,
  feedback TEXT CHECK (feedback IN ('relevante', 'nao_relevante', 'quero_adaptar', 'rejeitar')),
  assimilated BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'ai_suggested',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inspiration_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own references" ON public.inspiration_references FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own references" ON public.inspiration_references FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own references" ON public.inspiration_references FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own references" ON public.inspiration_references FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_inspiration_references_updated_at BEFORE UPDATE ON public.inspiration_references FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
