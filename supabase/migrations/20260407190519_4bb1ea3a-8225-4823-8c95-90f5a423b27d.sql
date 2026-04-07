ALTER TABLE public.inspiration_profiles
  DROP CONSTRAINT IF EXISTS inspiration_profiles_verification_status_check;

ALTER TABLE public.inspiration_profiles
  ADD CONSTRAINT inspiration_profiles_verification_status_check
  CHECK (verification_status IN (
    'pending',
    'verified',
    'failed',
    'skipped',
    'needs_review',
    'rejected'
  ));