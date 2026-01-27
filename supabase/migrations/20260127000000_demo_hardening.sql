-- =====================================================
-- DEMO HARDENING MIGRATION
-- Ensures backend is complete and demo-ready
-- Safe to run multiple times (idempotent)
-- =====================================================

-- 1. Create ottoq_sim_set_state RPC if not exists
-- This RPC is used by the frontend to control the simulator
CREATE OR REPLACE FUNCTION public.ottoq_sim_set_state(
    p_is_running BOOLEAN DEFAULT NULL,
    p_mode TEXT DEFAULT NULL,
    p_config JSONB DEFAULT NULL
  )
RETURNS VOID AS $$
DECLARE
  v_state_id UUID;
BEGIN
  -- Get or create the singleton state row
  SELECT id INTO v_state_id FROM public.ottoq_simulator_state LIMIT 1;

  IF v_state_id IS NULL THEN
    INSERT INTO public.ottoq_simulator_state (is_running, mode, config_jsonb)
    VALUES (
          COALESCE(p_is_running, false),
          COALESCE(p_mode, 'auto'),
          COALESCE(p_config, '{}'::jsonb)
        )
    RETURNING id INTO v_state_id;
  ELSE
    UPDATE public.ottoq_simulator_state
    SET
      is_running = COALESCE(p_is_running, is_running),
      mode = COALESCE(p_mode, mode),
      config_jsonb = COALESCE(p_config, config_jsonb),
      updated_at = now()
    WHERE id = v_state_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ensure staging stalls exist for ALL depots (not just the first one)
DO $$
DECLARE
  depot_rec RECORD;
  existing_count INTEGER;
BEGIN
  FOR depot_rec IN SELECT id FROM public.ottoq_depots LOOP
    -- Check if staging stalls already exist for this depot
    SELECT COUNT(*) INTO existing_count
    FROM public.ottoq_resources
    WHERE depot_id = depot_rec.id AND resource_type = 'STAGING_STALL';

    -- If no staging stalls, create 10
    IF existing_count = 0 THEN
      FOR i IN 1..10 LOOP
        INSERT INTO public.ottoq_resources (depot_id, resource_type, index, capabilities_jsonb, status)
        VALUES (depot_rec.id, 'STAGING_STALL', i, '{"type": "parking", "covered": true}'::jsonb, 'AVAILABLE')
        ON CONFLICT (depot_id, resource_type, index) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 3. Diversify vehicle statuses and SOC levels for better demo experience
DO $$
DECLARE
  city_rec RECORD;
  vehicle_ids UUID[];
  v_count INTEGER;
BEGIN
  FOR city_rec IN SELECT id, name FROM public.ottoq_cities LOOP
    SELECT ARRAY_AGG(id ORDER BY RANDOM()) INTO vehicle_ids
    FROM public.ottoq_vehicles
    WHERE city_id = city_rec.id;

    v_count := COALESCE(array_length(vehicle_ids, 1), 0);

    IF v_count > 0 THEN
      -- Set ~20% to ON_TRIP (active on deliveries)
      FOR i IN 1..LEAST(GREATEST(v_count / 5, 10), v_count) LOOP
        UPDATE public.ottoq_vehicles
        SET status = 'ON_TRIP', soc = (0.40 + random() * 0.55)::NUMERIC(5,4),
            last_telemetry_at = now() - (random() * INTERVAL '10 minutes')
        WHERE id = vehicle_ids[i];
      END LOOP;

      -- Set ~15% to IN_SERVICE
      FOR i IN (LEAST(GREATEST(v_count / 5, 10), v_count) + 1)..LEAST(GREATEST(v_count / 3, 20), v_count) LOOP
        UPDATE public.ottoq_vehicles
        SET status = 'IN_SERVICE', soc = (0.30 + random() * 0.60)::NUMERIC(5,4),
            last_telemetry_at = now() - (random() * INTERVAL '5 minutes')
        WHERE id = vehicle_ids[i];
      END LOOP;

      -- Set ~15% to AT_DEPOT
      FOR i IN (LEAST(GREATEST(v_count / 3, 20), v_count) + 1)..LEAST(GREATEST(v_count / 2, 40), v_count) LOOP
        UPDATE public.ottoq_vehicles
        SET status = 'AT_DEPOT', soc = (0.15 + random() * 0.40)::NUMERIC(5,4),
            last_telemetry_at = now() - (random() * INTERVAL '2 minutes')
        WHERE id = vehicle_ids[i];
      END LOOP;

      -- Set ~10% to ENROUTE_DEPOT
      FOR i IN (LEAST(GREATEST(v_count / 2, 40), v_count) + 1)..LEAST(GREATEST(v_count * 3 / 5, 60), v_count) LOOP
        UPDATE public.ottoq_vehicles
        SET status = 'ENROUTE_DEPOT', soc = (0.10 + random() * 0.25)::NUMERIC(5,4),
            last_telemetry_at = now() - (random() * INTERVAL '3 minutes')
        WHERE id = vehicle_ids[i];
      END LOOP;

      -- Remaining stay IDLE
      FOR i IN (LEAST(GREATEST(v_count * 3 / 5, 60), v_count) + 1)..v_count LOOP
        UPDATE public.ottoq_vehicles
        SET status = 'IDLE', soc = (0.20 + random() * 0.75)::NUMERIC(5,4),
            last_telemetry_at = now() - (random() * INTERVAL '30 minutes')
        WHERE id = vehicle_ids[i];
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 4. Diversify vehicle OEMs for visual variety
DO $$
DECLARE
  oems TEXT[] := ARRAY['Waymo', 'Cruise', 'Zoox', 'Nuro', 'Aurora', 'Motional', 'May Mobility', 'Tesla', 'Aptiv'];
  vehicle_rec RECORD;
  oem_idx INTEGER;
BEGIN
  oem_idx := 1;
  FOR vehicle_rec IN 
    SELECT id FROM public.ottoq_vehicles 
    WHERE oem = 'OTTO' OR oem IS NULL
    ORDER BY RANDOM() LIMIT 500
  LOOP
    UPDATE public.ottoq_vehicles
    SET oem = oems[((oem_idx - 1) % array_length(oems, 1)) + 1]
    WHERE id = vehicle_rec.id;
    oem_idx := oem_idx + 1;
  END LOOP;
END $$;

-- 5. Create active jobs to show occupied resources in depot view
DO $$
DECLARE
  depot_rec RECORD;
  vehicle_ids UUID[];
  resource_rec RECORD;
  job_uuid UUID;
  v_idx INTEGER;
BEGIN
  FOR depot_rec IN SELECT id, city_id, name FROM public.ottoq_depots LOOP
    SELECT ARRAY_AGG(v.id ORDER BY RANDOM()) INTO vehicle_ids
    FROM public.ottoq_vehicles v
    WHERE v.city_id = depot_rec.city_id
      AND v.status IN ('IDLE', 'AT_DEPOT')
      AND NOT EXISTS (
          SELECT 1 FROM public.ottoq_jobs j 
          WHERE j.vehicle_id = v.id AND j.state IN ('PENDING', 'SCHEDULED', 'ACTIVE')
        )
    LIMIT 20;

    IF vehicle_ids IS NULL OR array_length(vehicle_ids, 1) IS NULL THEN CONTINUE; END IF;

    v_idx := 1;

    -- Occupy 3-5 charging stalls
    FOR resource_rec IN 
      SELECT id FROM public.ottoq_resources
      WHERE depot_id = depot_rec.id AND resource_type = 'CHARGE_STALL' AND status = 'AVAILABLE'
      ORDER BY index LIMIT 5
    LOOP
      IF v_idx > COALESCE(array_length(vehicle_ids, 1), 0) THEN EXIT; END IF;

      INSERT INTO public.ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at, eta_seconds)
      VALUES (vehicle_ids[v_idx], depot_rec.id, resource_rec.id, 'CHARGE', 'ACTIVE', NOW() - (random() * INTERVAL '30 minutes'), 
              (1800 + random() * 3600)::INTEGER)
      ON CONFLICT DO NOTHING RETURNING id INTO job_uuid;

      IF job_uuid IS NOT NULL THEN
        UPDATE public.ottoq_resources SET status = 'BUSY', current_job_id = job_uuid WHERE id = resource_rec.id;
        UPDATE public.ottoq_vehicles SET status = 'AT_DEPOT' WHERE id = vehicle_ids[v_idx];
      END IF;
      v_idx := v_idx + 1;
    END LOOP;

    -- Occupy 1-2 cleaning stalls
    FOR resource_rec IN 
      SELECT id FROM public.ottoq_resources
      WHERE depot_id = depot_rec.id AND resource_type = 'CLEAN_DETAIL_STALL' AND status = 'AVAILABLE'
      ORDER BY index LIMIT 2
    LOOP
      IF v_idx > COALESCE(array_length(vehicle_ids, 1), 0) THEN EXIT; END IF;

      INSERT INTO public.ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at, eta_seconds)
      VALUES (vehicle_ids[v_idx], depot_rec.id, resource_rec.id, 'DETAILING', 'ACTIVE', NOW() - (random() * INTERVAL '20 minutes'),
                      (2400 + random() * 1800)::INTEGER)
      ON CONFLICT DO NOTHING RETURNING id INTO job_uuid;

      IF job_uuid IS NOT NULL THEN
        UPDATE public.ottoq_resources SET status = 'BUSY', current_job_id = job_uuid WHERE id = resource_rec.id;
        UPDATE public.ottoq_vehicles SET status = 'AT_DEPOT' WHERE id = vehicle_ids[v_idx];
      END IF;
      v_idx := v_idx + 1;
    END LOOP;
  END LOOP;
END $$;

-- 6. Add realtime publication for additional tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ottoq_movement_queue;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ottoq_simulator_state;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 7. Grant execute permissions on RPCs
GRANT EXECUTE ON FUNCTION public.ottoq_sim_set_state(BOOLEAN, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_random_vehicles_for_city(UUID, INTEGER) TO anon, authenticated;
