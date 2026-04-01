-- Campaign workflow columns for content_outputs
ALTER TABLE public.content_outputs
  ADD COLUMN IF NOT EXISTS campaign_brief_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS campaign_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS visual_system_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS prompt_version TEXT NOT NULL DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS slide_plan_json JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS slide_plan_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_content_outputs_campaign_status
  ON public.content_outputs(user_id, campaign_status);

CREATE INDEX IF NOT EXISTS idx_content_outputs_prompt_version
  ON public.content_outputs(user_id, prompt_version, created_at DESC);
