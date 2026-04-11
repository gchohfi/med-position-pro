
-- Content approval workflow
CREATE TABLE public.content_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_output_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  reviewer_name TEXT,
  reviewer_email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approvals" ON public.content_approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own approvals" ON public.content_approvals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own approvals" ON public.content_approvals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own approvals" ON public.content_approvals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_content_approvals_updated_at BEFORE UPDATE ON public.content_approvals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contextual comments
CREATE TABLE public.content_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_output_id UUID NOT NULL,
  user_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT 'equipe',
  comment TEXT NOT NULL,
  slide_number INTEGER,
  version_label TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comments" ON public.content_comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comments" ON public.content_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.content_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.content_comments FOR DELETE USING (auth.uid() = user_id);

-- Activity log
CREATE TABLE public.content_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_output_id UUID NOT NULL,
  user_id UUID NOT NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON public.content_activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON public.content_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
