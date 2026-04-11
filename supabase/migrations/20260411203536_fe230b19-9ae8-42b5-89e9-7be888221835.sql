
CREATE TABLE public.topic_clusters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  specialty text NOT NULL,
  cluster_name text NOT NULL,
  description text,
  intent text NOT NULL DEFAULT 'educar',
  priority text NOT NULL DEFAULT 'media',
  benchmark_affinity jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_visual_styles jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtopics jsonb NOT NULL DEFAULT '[]'::jsonb,
  contraindications jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, specialty, cluster_name)
);

ALTER TABLE public.topic_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clusters" ON public.topic_clusters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clusters" ON public.topic_clusters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clusters" ON public.topic_clusters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clusters" ON public.topic_clusters FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_topic_clusters_updated_at
BEFORE UPDATE ON public.topic_clusters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
