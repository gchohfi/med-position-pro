-- Visual references table
CREATE TABLE public.visual_references (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  ref_type text NOT NULL DEFAULT 'capa',
  description text,
  tags text[] NOT NULL DEFAULT '{}',
  benchmark_preset text,
  visual_style text,
  suggested_use text,
  image_url text,
  link text,
  favorite boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.visual_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own references" ON public.visual_references FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own references" ON public.visual_references FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own references" ON public.visual_references FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own references" ON public.visual_references FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_visual_references_user ON public.visual_references (user_id);
CREATE INDEX idx_visual_references_type ON public.visual_references (ref_type);

CREATE TRIGGER update_visual_references_updated_at
  BEFORE UPDATE ON public.visual_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Collections table
CREATE TABLE public.visual_reference_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.visual_reference_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collections" ON public.visual_reference_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own collections" ON public.visual_reference_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON public.visual_reference_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON public.visual_reference_collections FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_visual_ref_collections_updated_at
  BEFORE UPDATE ON public.visual_reference_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Collection items junction table
CREATE TABLE public.visual_reference_collection_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.visual_reference_collections(id) ON DELETE CASCADE,
  reference_id uuid NOT NULL REFERENCES public.visual_references(id) ON DELETE CASCADE,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (collection_id, reference_id)
);

ALTER TABLE public.visual_reference_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own collection items" ON public.visual_reference_collection_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.visual_reference_collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can insert own collection items" ON public.visual_reference_collection_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.visual_reference_collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can delete own collection items" ON public.visual_reference_collection_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.visual_reference_collections c WHERE c.id = collection_id AND c.user_id = auth.uid()));