-- Add benchmark_preset column to calendar_items
ALTER TABLE public.calendar_items
ADD COLUMN benchmark_preset text DEFAULT NULL;

-- Add objetivo column for strategic objective type  
ALTER TABLE public.calendar_items
ADD COLUMN objetivo text DEFAULT NULL;