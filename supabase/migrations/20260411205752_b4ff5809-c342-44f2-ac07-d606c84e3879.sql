
-- Add essential searchable/filterable columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crm text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estado text;

-- Add index on specialty for future filtering
CREATE INDEX IF NOT EXISTS idx_profiles_specialty ON public.profiles (specialty);
