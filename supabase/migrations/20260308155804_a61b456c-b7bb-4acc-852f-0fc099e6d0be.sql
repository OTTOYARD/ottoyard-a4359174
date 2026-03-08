
-- ============================================================
-- 1) intelligence_events table
-- ============================================================
CREATE TABLE public.intelligence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL CHECK (source IN ('nws_weather','tomtom_traffic','gdelt_news','newsapi','openfema','manual')),
  source_id text,
  event_type text NOT NULL CHECK (event_type IN ('severe_weather','traffic_incident','road_closure','construction','emergency','news','fire','hazmat')),
  severity text DEFAULT 'low' CHECK (severity IN ('critical','high','medium','low','info')),
  title text NOT NULL,
  description text,
  location_lat double precision,
  location_lng double precision,
  radius_miles double precision,
  geojson jsonb,
  city text CHECK (city IN ('Nashville','Austin','LA','San Francisco')),
  raw_data jsonb,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  threat_score integer DEFAULT 0 CHECK (threat_score >= 0 AND threat_score <= 100),
  vehicles_affected integer DEFAULT 0,
  vehicles_nearby integer DEFAULT 0,
  auto_recommendations jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (source, source_id)
);

ALTER TABLE public.intelligence_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_intelligence_events_active_city ON public.intelligence_events (is_active, city);
CREATE INDEX idx_intelligence_events_source_id ON public.intelligence_events (source, source_id);
CREATE INDEX idx_intelligence_events_severity_active ON public.intelligence_events (severity, is_active);
CREATE INDEX idx_intelligence_events_created_at ON public.intelligence_events (created_at DESC);

-- RLS: Admin write, public read
CREATE POLICY "Admin write intelligence_events" ON public.intelligence_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read intelligence_events" ON public.intelligence_events FOR SELECT
  USING (true);

-- Auto-update trigger for updated_at
CREATE TRIGGER update_intelligence_events_updated_at
  BEFORE UPDATE ON public.intelligence_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.intelligence_events;

-- ============================================================
-- 2) scanner_config table
-- ============================================================
CREATE TABLE public.scanner_config (
  id text PRIMARY KEY DEFAULT 'default',
  weather_enabled boolean DEFAULT true,
  weather_interval_minutes integer DEFAULT 5,
  weather_last_scan_at timestamptz,
  weather_last_status text DEFAULT 'idle',
  weather_last_error text,
  traffic_enabled boolean DEFAULT true,
  traffic_interval_minutes integer DEFAULT 3,
  traffic_last_scan_at timestamptz,
  traffic_last_status text DEFAULT 'idle',
  traffic_last_error text,
  news_enabled boolean DEFAULT true,
  news_interval_minutes integer DEFAULT 10,
  news_last_scan_at timestamptz,
  news_last_status text DEFAULT 'idle',
  news_last_error text,
  emergency_enabled boolean DEFAULT false,
  emergency_interval_minutes integer DEFAULT 15,
  emergency_last_scan_at timestamptz,
  emergency_last_status text DEFAULT 'disabled',
  emergency_last_error text,
  cities text[] DEFAULT ARRAY['Nashville','Austin','LA','San Francisco'],
  auto_expire_hours integer DEFAULT 24,
  threat_score_threshold integer DEFAULT 40,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.scanner_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin write scanner_config" ON public.scanner_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated read scanner_config" ON public.scanner_config FOR SELECT
  USING (auth.role() = 'authenticated'::text);

-- Seed default row
INSERT INTO public.scanner_config (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- ============================================================
-- 3) fleet_commands table
-- ============================================================
CREATE TABLE public.fleet_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  command_type text NOT NULL CHECK (command_type IN ('safe_pullover','recall_to_depot','route_adjustment','pause_operations')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','acknowledged','executing','completed','cancelled')),
  city text NOT NULL,
  zone jsonb,
  target_vehicle_ids jsonb DEFAULT '[]'::jsonb,
  affected_vehicle_count integer DEFAULT 0,
  reason text NOT NULL,
  urgency text DEFAULT 'within_15min' CHECK (urgency IN ('immediate','within_5min','within_15min')),
  issued_by text DEFAULT 'manual' CHECK (issued_by IN ('otto_response','ottocommand','manual')),
  linked_advisory_id text,
  linked_event_id uuid REFERENCES public.intelligence_events(id),
  parameters jsonb DEFAULT '{}'::jsonb,
  result jsonb,
  issued_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.fleet_commands ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fleet_commands_active ON public.fleet_commands (status) WHERE status NOT IN ('completed','cancelled');

CREATE POLICY "Admin write fleet_commands" ON public.fleet_commands FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated read fleet_commands" ON public.fleet_commands FOR SELECT
  USING (auth.role() = 'authenticated'::text);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fleet_commands;
