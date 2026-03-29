
CREATE TABLE public.market_radar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  saturation jsonb NOT NULL DEFAULT '[]'::jsonb,
  opportunities jsonb NOT NULL DEFAULT '[]'::jsonb,
  alerts jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  segment_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_radar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own radar" ON public.market_radar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own radar" ON public.market_radar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own radar" ON public.market_radar FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_market_radar_updated_at
  BEFORE UPDATE ON public.market_radar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
