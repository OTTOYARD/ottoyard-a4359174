-- OTTOQ: Vehicle-to-Depot Queuing & Reservation System
-- Migration: Initialize OTTOQ schema with prefixed tables

-- ============================================================================
-- ENUMS & TYPES
-- ============================================================================

CREATE TYPE public.ottoq_resource_type AS ENUM (
  'CHARGE_STALL',
  'CLEAN_DETAIL_STALL',
  'MAINTENANCE_BAY'
);

CREATE TYPE public.ottoq_resource_status AS ENUM (
  'AVAILABLE',
  'RESERVED',
  'BUSY',
  'OUT_OF_SERVICE'
);

CREATE TYPE public.ottoq_job_type AS ENUM (
  'CHARGE',
  'MAINTENANCE',
  'DETAILING',
  'DOWNTIME_PARK'
);

CREATE TYPE public.ottoq_job_state AS ENUM (
  'PENDING',
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE public.ottoq_vehicle_status AS ENUM (
  'IDLE',
  'ENROUTE_DEPOT',
  'AT_DEPOT',
  'IN_SERVICE',
  'ON_TRIP'
);

CREATE TYPE public.ottoq_entity_type AS ENUM (
  'VEHICLE',
  'DEPOT',
  'RESOURCE',
  'JOB',
  'SCHEDULE',
  'SIMULATOR'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Cities
CREATE TABLE public.ottoq_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tz TEXT NOT NULL DEFAULT 'America/Chicago',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Depots
CREATE TABLE public.ottoq_depots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.ottoq_cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat NUMERIC(10, 7),
  lon NUMERIC(10, 7),
  config_jsonb JSONB NOT NULL DEFAULT '{"charge_stalls":40,"clean_detail_stalls":10,"maintenance_bays":2,"ottoq_branding":"Powered by OTTOQ Technology","charge_threshold_soc":0.20}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resources (stalls and bays)
CREATE TABLE public.ottoq_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id UUID NOT NULL REFERENCES public.ottoq_depots(id) ON DELETE CASCADE,
  resource_type public.ottoq_resource_type NOT NULL,
  index INTEGER NOT NULL,
  capabilities_jsonb JSONB DEFAULT '{}',
  status public.ottoq_resource_status NOT NULL DEFAULT 'AVAILABLE',
  current_job_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(depot_id, resource_type, index)
);

-- Vehicles
CREATE TABLE public.ottoq_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.ottoq_cities(id) ON DELETE CASCADE,
  oem TEXT NOT NULL DEFAULT 'OTTO',
  external_ref TEXT UNIQUE,
  vin TEXT,
  plate TEXT,
  soc NUMERIC(5, 4) NOT NULL DEFAULT 1.0 CHECK (soc >= 0 AND soc <= 1),
  odometer_km INTEGER NOT NULL DEFAULT 0,
  health_jsonb JSONB DEFAULT '{}',
  status public.ottoq_vehicle_status NOT NULL DEFAULT 'IDLE',
  last_telemetry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs (reservations and work orders)
CREATE TABLE public.ottoq_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.ottoq_vehicles(id) ON DELETE CASCADE,
  depot_id UUID NOT NULL REFERENCES public.ottoq_depots(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.ottoq_resources(id) ON DELETE SET NULL,
  job_type public.ottoq_job_type NOT NULL,
  state public.ottoq_job_state NOT NULL DEFAULT 'PENDING',
  requested_start_at TIMESTAMPTZ,
  scheduled_start_at TIMESTAMPTZ,
  eta_seconds INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata_jsonb JSONB DEFAULT '{}',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedules (periodic maintenance rules)
CREATE TABLE public.ottoq_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.ottoq_vehicles(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  rule_jsonb JSONB NOT NULL,
  next_due_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events (append-only audit log)
CREATE TABLE public.ottoq_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type public.ottoq_entity_type NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  payload_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhooks (future outbound integrations)
CREATE TABLE public.ottoq_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Simulator state
CREATE TABLE public.ottoq_simulator_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_running BOOLEAN NOT NULL DEFAULT false,
  mode TEXT NOT NULL DEFAULT 'auto',
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  config_jsonb JSONB NOT NULL DEFAULT '{
    "reservation_interval_seconds": 45,
    "reset_interval_seconds": 420,
    "utilization_target": 0.5,
    "cities": ["Nashville", "Austin", "LA"],
    "job_durations": {
      "CHARGE": {"avg": 2400, "variance": 600},
      "DETAILING": {"avg": 5400, "variance": 1800},
      "MAINTENANCE": {"avg": 10800, "variance": 3600},
      "DOWNTIME_PARK": {"avg": 3600, "variance": 900}
    }
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_ottoq_depots_city ON public.ottoq_depots(city_id);
CREATE INDEX idx_ottoq_resources_depot_type_status ON public.ottoq_resources(depot_id, resource_type, status);
CREATE INDEX idx_ottoq_resources_status ON public.ottoq_resources(status);
CREATE INDEX idx_ottoq_vehicles_city_status ON public.ottoq_vehicles(city_id, status);
CREATE INDEX idx_ottoq_vehicles_soc ON public.ottoq_vehicles(soc);
CREATE INDEX idx_ottoq_vehicles_external_ref ON public.ottoq_vehicles(external_ref);
CREATE INDEX idx_ottoq_jobs_vehicle_state ON public.ottoq_jobs(vehicle_id, state);
CREATE INDEX idx_ottoq_jobs_depot_state ON public.ottoq_jobs(depot_id, state);
CREATE INDEX idx_ottoq_jobs_state ON public.ottoq_jobs(state);
CREATE INDEX idx_ottoq_jobs_scheduled_start ON public.ottoq_jobs(scheduled_start_at) WHERE state IN ('PENDING', 'SCHEDULED');
CREATE INDEX idx_ottoq_schedules_vehicle ON public.ottoq_schedules(vehicle_id);
CREATE INDEX idx_ottoq_schedules_next_due ON public.ottoq_schedules(next_due_at);
CREATE INDEX idx_ottoq_events_entity ON public.ottoq_events(entity_type, entity_id);
CREATE INDEX idx_ottoq_events_created ON public.ottoq_events(created_at DESC);

-- Add foreign key for resources.current_job_id
ALTER TABLE public.ottoq_resources ADD CONSTRAINT fk_ottoq_resources_current_job 
  FOREIGN KEY (current_job_id) REFERENCES public.ottoq_jobs(id) ON DELETE SET NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_ottoq_depots_updated_at BEFORE UPDATE ON public.ottoq_depots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ottoq_resources_updated_at BEFORE UPDATE ON public.ottoq_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ottoq_vehicles_updated_at BEFORE UPDATE ON public.ottoq_vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ottoq_jobs_updated_at BEFORE UPDATE ON public.ottoq_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ottoq_schedules_updated_at BEFORE UPDATE ON public.ottoq_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ottoq_simulator_state_updated_at BEFORE UPDATE ON public.ottoq_simulator_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (dev-relaxed for now)
-- ============================================================================

ALTER TABLE public.ottoq_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_simulator_state ENABLE ROW LEVEL SECURITY;

-- Dev-friendly policies (allow all for now)
CREATE POLICY "Allow all on ottoq_cities" ON public.ottoq_cities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_depots" ON public.ottoq_depots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_resources" ON public.ottoq_resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_vehicles" ON public.ottoq_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_jobs" ON public.ottoq_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_schedules" ON public.ottoq_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_events" ON public.ottoq_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_webhooks" ON public.ottoq_webhooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ottoq_simulator_state" ON public.ottoq_simulator_state FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert cities
INSERT INTO public.ottoq_cities (name, tz) VALUES
  ('Nashville', 'America/Chicago'),
  ('Austin', 'America/Chicago'),
  ('LA', 'America/Los_Angeles');

-- Helper function to create resources for a depot
CREATE OR REPLACE FUNCTION create_ottoq_depot_resources(depot_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- 40 charging stalls (index 1-40)
  FOR i IN 1..40 LOOP
    INSERT INTO public.ottoq_resources (depot_id, resource_type, index, capabilities_jsonb)
    VALUES (depot_uuid, 'CHARGE_STALL', i, '{"power_kw": 150, "connector": "CCS"}');
  END LOOP;

  -- 10 clean/detail stalls (index 41-50)
  FOR i IN 41..50 LOOP
    INSERT INTO public.ottoq_resources (depot_id, resource_type, index, capabilities_jsonb)
    VALUES (depot_uuid, 'CLEAN_DETAIL_STALL', i, '{"has_wash": true, "has_vacuum": true}');
  END LOOP;

  -- 2 maintenance bays (index 1-2)
  FOR i IN 1..2 LOOP
    INSERT INTO public.ottoq_resources (depot_id, resource_type, index, capabilities_jsonb)
    VALUES (depot_uuid, 'MAINTENANCE_BAY', i, '{"has_lift": true, "has_diagnostics": true}');
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert depots (2 per city)
DO $$
DECLARE
  city_nashville UUID;
  city_austin UUID;
  city_la UUID;
  depot_id UUID;
BEGIN
  SELECT id INTO city_nashville FROM public.ottoq_cities WHERE name = 'Nashville';
  SELECT id INTO city_austin FROM public.ottoq_cities WHERE name = 'Austin';
  SELECT id INTO city_la FROM public.ottoq_cities WHERE name = 'LA';

  -- Nashville depots
  INSERT INTO public.ottoq_depots (city_id, name, address, lat, lon) VALUES
    (city_nashville, 'OTTOYARD Mini - Nashville', '1200 Broadway, Nashville, TN 37203', 36.1627, -86.7816)
    RETURNING id INTO depot_id;
  PERFORM create_ottoq_depot_resources(depot_id);

  INSERT INTO public.ottoq_depots (city_id, name, address, lat, lon) VALUES
    (city_nashville, 'OTTOYARD Max - Nashville', '5001 Centennial Blvd, Nashville, TN 37209', 36.1447, -86.8022)
    RETURNING id INTO depot_id;
  PERFORM create_ottoq_depot_resources(depot_id);

  -- Austin depots
  INSERT INTO public.ottoq_depots (city_id, name, address, lat, lon) VALUES
    (city_austin, 'OTTOYARD Mini - Austin', '1600 E 6th St, Austin, TX 78702', 30.2672, -97.7431)
    RETURNING id INTO depot_id;
  PERFORM create_ottoq_depot_resources(depot_id);

  INSERT INTO public.ottoq_depots (city_id, name, address, lat, lon) VALUES
    (city_austin, 'OTTOYARD Max - Austin', '2901 S Lamar Blvd, Austin, TX 78704', 30.2466, -97.7697)
    RETURNING id INTO depot_id;
  PERFORM create_ottoq_depot_resources(depot_id);

  -- LA depots
  INSERT INTO public.ottoq_depots (city_id, name, address, lat, lon) VALUES
    (city_la, 'OTTOYARD Mini - LA', '1234 W Olympic Blvd, Los Angeles, CA 90015', 34.0407, -118.2468)
    RETURNING id INTO depot_id;
  PERFORM create_ottoq_depot_resources(depot_id);

  INSERT INTO public.ottoq_depots (city_id, name, address, lat, lon) VALUES
    (city_la, 'OTTOYARD Max - LA', '5600 Wilshire Blvd, Los Angeles, CA 90036', 34.0622, -118.3510)
    RETURNING id INTO depot_id;
  PERFORM create_ottoq_depot_resources(depot_id);
END $$;

-- Seed vehicles (300 per city = 900 total)
DO $$
DECLARE
  city_rec RECORD;
  vehicle_count INTEGER := 300;
BEGIN
  FOR city_rec IN SELECT id, name FROM public.ottoq_cities LOOP
    FOR i IN 1..vehicle_count LOOP
      INSERT INTO public.ottoq_vehicles (
        city_id,
        oem,
        external_ref,
        vin,
        plate,
        soc,
        odometer_km,
        health_jsonb,
        status,
        last_telemetry_at
      ) VALUES (
        city_rec.id,
        'OTTO',
        city_rec.name || '-' || LPAD(i::TEXT, 5, '0'),
        'VIN' || LPAD((random() * 10000000)::INTEGER::TEXT, 8, '0'),
        'PLATE' || LPAD(i::TEXT, 4, '0'),
        (0.15 + random() * 0.85)::NUMERIC(5, 4),
        (random() * 50000)::INTEGER,
        '{"battery_health": 95, "tire_pressure": "OK"}',
        'IDLE',
        now() - (random() * INTERVAL '1 hour')
      );
    END LOOP;
  END LOOP;
END $$;

-- Create initial schedules for periodic maintenance
INSERT INTO public.ottoq_schedules (vehicle_id, rule_type, rule_jsonb, next_due_at)
SELECT 
  id,
  'odometer_interval',
  '{"interval_km": 5000, "job_type": "MAINTENANCE", "task": "tire_rotation"}'::jsonb,
  now() + (random() * INTERVAL '30 days')
FROM public.ottoq_vehicles
WHERE random() < 0.3;

-- Initialize simulator state
INSERT INTO public.ottoq_simulator_state (is_running, mode) VALUES (false, 'auto');

-- Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ottoq_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ottoq_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ottoq_vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ottoq_events;