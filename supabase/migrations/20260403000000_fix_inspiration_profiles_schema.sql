-- Fix conflicting schemas between migration 12 and 13 for inspiration_profiles.
-- Migration 12 created the tables with one schema (handle, display_name, specialty, etc.)
-- Migration 13 tried CREATE TABLE IF NOT EXISTS with a different schema (discovered_handle, etc.)
-- but was a no-op since the tables already existed.
-- This migration reconciles the schemas by adding missing columns from migration 13.

-- Add columns from migration 13 schema that are missing in migration 12
ALTER TABLE public.inspiration_profiles
  ADD COLUMN IF NOT EXISTS discovered_handle TEXT;

-- Backfill discovered_handle from handle for existing rows
UPDATE public.inspiration_profiles
  SET discovered_handle = handle
  WHERE discovered_handle IS NULL;

-- Add UNIQUE constraint if it doesn't exist (migration 13 expected this)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inspiration_profiles_user_id_normalized_handle_key'
  ) THEN
    ALTER TABLE public.inspiration_profiles
      ADD CONSTRAINT inspiration_profiles_user_id_normalized_handle_key
      UNIQUE (user_id, normalized_handle);
  END IF;
END $$;

-- Fix inspiration_profile_analyses: add columns from migration 13 schema
ALTER TABLE public.inspiration_profile_analyses
  ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.inspiration_profile_analyses
  ADD COLUMN IF NOT EXISTS normalized_handle TEXT;

ALTER TABLE public.inspiration_profile_analyses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill user_id and normalized_handle from the parent profile
UPDATE public.inspiration_profile_analyses a
  SET
    user_id = p.user_id,
    normalized_handle = p.normalized_handle
  FROM public.inspiration_profiles p
  WHERE a.profile_id = p.id
    AND a.user_id IS NULL;

-- Add missing analysis_status values (migration 13 uses 'queued'/'done' vs migration 12's 'pending'/'completed')
-- Allow both sets of values
ALTER TABLE public.inspiration_profile_analyses
  DROP CONSTRAINT IF EXISTS inspiration_profile_analyses_analysis_status_check;

ALTER TABLE public.inspiration_profile_analyses
  ADD CONSTRAINT inspiration_profile_analyses_analysis_status_check
  CHECK (analysis_status IN ('pending', 'queued', 'running', 'completed', 'done', 'failed'));

-- Add missing RLS policies from migration 13 (more granular than migration 12's single FOR ALL policy)
-- These are safe to add as additional policies (OR logic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inspiration_profiles' AND policyname = 'Users can view own inspiration profiles'
  ) THEN
    CREATE POLICY "Users can view own inspiration profiles"
      ON public.inspiration_profiles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inspiration_profiles' AND policyname = 'Users can insert own inspiration profiles'
  ) THEN
    CREATE POLICY "Users can insert own inspiration profiles"
      ON public.inspiration_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inspiration_profiles' AND policyname = 'Users can update own inspiration profiles'
  ) THEN
    CREATE POLICY "Users can update own inspiration profiles"
      ON public.inspiration_profiles FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'inspiration_profiles' AND policyname = 'Users can delete own inspiration profiles'
  ) THEN
    CREATE POLICY "Users can delete own inspiration profiles"
      ON public.inspiration_profiles FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add update triggers from migration 13
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_inspiration_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_inspiration_profiles_updated_at
      BEFORE UPDATE ON public.inspiration_profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_inspiration_profile_analyses_updated_at'
  ) THEN
    CREATE TRIGGER update_inspiration_profile_analyses_updated_at
      BEFORE UPDATE ON public.inspiration_profile_analyses
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
