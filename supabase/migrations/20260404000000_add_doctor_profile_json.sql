-- Store the full DoctorProfile as JSONB in the profiles table.
-- This solves the dual-storage problem where DoctorProfile only lived in localStorage
-- and was lost on browser clear or device change.
-- localStorage remains as a fast cache; Supabase is the source of truth.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS doctor_profile JSONB;
