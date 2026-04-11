ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_data jsonb DEFAULT '{}'::jsonb;