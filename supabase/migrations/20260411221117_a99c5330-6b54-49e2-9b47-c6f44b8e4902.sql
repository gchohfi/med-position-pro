ALTER TABLE public.content_outputs
ADD COLUMN derived_from uuid REFERENCES public.content_outputs(id) ON DELETE SET NULL;

CREATE INDEX idx_content_outputs_derived ON public.content_outputs (derived_from) WHERE derived_from IS NOT NULL;