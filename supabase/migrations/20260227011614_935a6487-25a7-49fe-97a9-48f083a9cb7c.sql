
-- OTTO-Q Predictive Scheduling Engine: Foundation Schema
-- Enums
CREATE TYPE public.ottoq_ev_vehicle_type AS ENUM ('member_ev', 'autonomous');
CREATE TYPE public.ottoq_ev_vehicle_status AS ENUM ('active', 'in_service', 'charging', 'staged', 'offline');
CREATE TYPE public.ottoq_stall_type AS ENUM ('charge_standard', 'charge_fast', 'clean_detail', 'service_bay', 'staging');
CREATE TYPE public.ottoq_stall_status AS ENUM ('available', 'occupied', 'reserved', 'maintenance');
CREATE TYPE public.ottoq_service_type AS ENUM ('charge', 'detail_clean', 'tire_rotation', 'battery_health_check', 'full_service');
CREATE TYPE public.ottoq_service_status AS ENUM ('predicted', 'notified', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled', 'declined');

-- 1. depots (separate from existing ottoq_depots, this is for the predictive scheduling pilot)
CREATE TABLE public.ottoq_ps_depots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location_address text,
  lat numeric,
  lng numeric,
  charge_stalls_count int NOT NULL DEFAULT 40,
  clean_stalls_count int NOT NULL DEFAULT 10,
  service_bays_count int NOT NULL DEFAULT 1,
  staging_stalls_count int NOT NULL DEFAULT 10,
  energy_rate_schedule jsonb DEFAULT '[]'::jsonb,
  operating_hours jsonb DEFAULT '{"open":"06:00","close":"22:00"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ottoq_ps_depots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ottoq_ps_depots" ON public.ottoq_ps_depots FOR SELECT USING (true);
CREATE POLICY "Admin write ottoq_ps_depots" ON public.ottoq_ps_depots FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. vehicles (named ottoq_ps_vehicles to avoid conflict with existing vehicles table)
CREATE TABLE public.ottoq_ps_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  vehicle_type public.ottoq_ev_vehicle_type NOT NULL DEFAULT 'member_ev',
  make text,
  model text,
  year int,
  battery_capacity_kwh numeric DEFAULT 75,
  current_soc_percent numeric DEFAULT 100 CHECK (current_soc_percent >= 0 AND current_soc_percent <= 100),
  current_range_miles numeric DEFAULT 300,
  odometer_miles numeric DEFAULT 0,
  last_charge_date timestamptz,
  last_detail_date timestamptz,
  last_tire_rotation_date timestamptz,
  last_battery_health_check timestamptz,
  avg_daily_miles numeric DEFAULT 30,
  status public.ottoq_ev_vehicle_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ottoq_ps_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ottoq_ps_vehicles" ON public.ottoq_ps_vehicles FOR SELECT USING (true);
CREATE POLICY "Owners update own vehicles" ON public.ottoq_ps_vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admin write ottoq_ps_vehicles" ON public.ottoq_ps_vehicles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. depot_stalls
CREATE TABLE public.ottoq_ps_depot_stalls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id uuid NOT NULL REFERENCES public.ottoq_ps_depots(id) ON DELETE CASCADE,
  stall_number int NOT NULL,
  stall_type public.ottoq_stall_type NOT NULL,
  status public.ottoq_stall_status NOT NULL DEFAULT 'available',
  current_vehicle_id uuid REFERENCES public.ottoq_ps_vehicles(id) ON DELETE SET NULL,
  charger_power_kw numeric,
  current_session_start timestamptz,
  estimated_completion timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(depot_id, stall_number)
);
ALTER TABLE public.ottoq_ps_depot_stalls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ottoq_ps_depot_stalls" ON public.ottoq_ps_depot_stalls FOR SELECT USING (true);
CREATE POLICY "Admin write ottoq_ps_depot_stalls" ON public.ottoq_ps_depot_stalls FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. service_thresholds
CREATE TABLE public.ottoq_ps_service_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type public.ottoq_service_type NOT NULL,
  trigger_condition text NOT NULL,
  threshold_value numeric NOT NULL,
  threshold_unit text NOT NULL,
  priority_weight numeric NOT NULL CHECK (priority_weight >= 1 AND priority_weight <= 10),
  estimated_duration_minutes int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ottoq_ps_service_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ottoq_ps_service_thresholds" ON public.ottoq_ps_service_thresholds FOR SELECT USING (true);
CREATE POLICY "Admin write ottoq_ps_service_thresholds" ON public.ottoq_ps_service_thresholds FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed service thresholds
INSERT INTO public.ottoq_ps_service_thresholds (service_type, trigger_condition, threshold_value, threshold_unit, priority_weight, estimated_duration_minutes) VALUES
  ('charge', 'Battery SOC drops below 30%', 30, 'percent', 8, 120),
  ('charge', 'Battery SOC drops below 20% (critical)', 20, 'percent', 10, 90),
  ('detail_clean', 'More than 7 days since last detail', 7, 'days', 5, 60),
  ('detail_clean', 'More than 500 miles since last detail', 500, 'miles', 5, 60),
  ('tire_rotation', 'More than 7500 miles since last rotation', 7500, 'miles', 4, 45),
  ('battery_health_check', 'More than 90 days since last check', 90, 'days', 6, 30),
  ('full_service', 'More than 15000 miles since last full service', 15000, 'miles', 7, 240);

-- 5. scheduled_services
CREATE TABLE public.ottoq_ps_scheduled_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.ottoq_ps_vehicles(id) ON DELETE CASCADE,
  stall_id uuid REFERENCES public.ottoq_ps_depot_stalls(id) ON DELETE SET NULL,
  service_type public.ottoq_service_type NOT NULL,
  status public.ottoq_service_status NOT NULL DEFAULT 'predicted',
  predicted_need_date timestamptz NOT NULL,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  priority_score numeric NOT NULL DEFAULT 5,
  trigger_reason text,
  notification_sent_at timestamptz,
  user_response_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ottoq_ps_scheduled_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ottoq_ps_scheduled_services" ON public.ottoq_ps_scheduled_services FOR SELECT USING (true);
CREATE POLICY "Owners manage own vehicle services" ON public.ottoq_ps_scheduled_services FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.ottoq_ps_vehicles v WHERE v.id = vehicle_id AND v.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ottoq_ps_vehicles v WHERE v.id = vehicle_id AND v.owner_id = auth.uid()));
CREATE POLICY "Admin write ottoq_ps_scheduled_services" ON public.ottoq_ps_scheduled_services FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. member_preferences
CREATE TABLE public.ottoq_ps_member_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_charge_times jsonb DEFAULT '[{"start":"22:00","end":"06:00"}]'::jsonb,
  preferred_days jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb,
  auto_accept_charges boolean NOT NULL DEFAULT false,
  auto_accept_cleans boolean NOT NULL DEFAULT false,
  notification_lead_time_hours int NOT NULL DEFAULT 24,
  calendar_sync_enabled boolean NOT NULL DEFAULT false,
  calendar_provider text,
  home_zip text,
  commute_miles_estimate numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.ottoq_ps_member_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own preferences" ON public.ottoq_ps_member_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own preferences" ON public.ottoq_ps_member_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. energy_pricing
CREATE TABLE public.ottoq_ps_energy_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id uuid NOT NULL REFERENCES public.ottoq_ps_depots(id) ON DELETE CASCADE,
  period_name text NOT NULL,
  start_hour int NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour int NOT NULL CHECK (end_hour >= 0 AND end_hour <= 23),
  rate_per_kwh numeric NOT NULL,
  days_applicable jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ottoq_ps_energy_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ottoq_ps_energy_pricing" ON public.ottoq_ps_energy_pricing FOR SELECT USING (true);
CREATE POLICY "Admin write ottoq_ps_energy_pricing" ON public.ottoq_ps_energy_pricing FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.ottoq_ps_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_ottoq_ps_vehicles_updated_at BEFORE UPDATE ON public.ottoq_ps_vehicles FOR EACH ROW EXECUTE FUNCTION public.ottoq_ps_update_timestamp();
CREATE TRIGGER trg_ottoq_ps_scheduled_services_updated_at BEFORE UPDATE ON public.ottoq_ps_scheduled_services FOR EACH ROW EXECUTE FUNCTION public.ottoq_ps_update_timestamp();
CREATE TRIGGER trg_ottoq_ps_member_preferences_updated_at BEFORE UPDATE ON public.ottoq_ps_member_preferences FOR EACH ROW EXECUTE FUNCTION public.ottoq_ps_update_timestamp();
