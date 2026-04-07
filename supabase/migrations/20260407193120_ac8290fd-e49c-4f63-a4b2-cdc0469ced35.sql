ALTER TABLE public.content_outputs
  ADD COLUMN IF NOT EXISTS carousel_slide_urls jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.content_outputs.carousel_slide_urls IS
  'Array de signed URLs dos slides PNG exportados. Ex: [{"slide": 1, "url": "https://...", "path": "uuid/carrossel/..."}]';