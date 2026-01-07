-- Clean up any existing mock jobs and reset resources
UPDATE ottoq_resources SET status = 'AVAILABLE', current_job_id = NULL WHERE status IN ('BUSY', 'RESERVED');
DELETE FROM ottoq_jobs WHERE state = 'ACTIVE';
DELETE FROM ottoq_task_confirmations;

-- Get a depot ID and create mock occupied stalls
DO $$
DECLARE
  depot_uuid UUID;
  vehicle_ids UUID[];
  v_id UUID;
  job_uuid UUID;
  resource_uuid UUID;
BEGIN
  -- Get the Nashville Max depot
  SELECT id INTO depot_uuid FROM ottoq_depots WHERE name ILIKE '%Max%Nashville%' OR name ILIKE '%Nashville%Max%' LIMIT 1;
  
  IF depot_uuid IS NULL THEN
    SELECT id INTO depot_uuid FROM ottoq_depots LIMIT 1;
  END IF;

  -- Get random vehicles
  SELECT ARRAY(SELECT id FROM ottoq_vehicles ORDER BY RANDOM() LIMIT 10) INTO vehicle_ids;

  -- Create 5 occupied charging stalls
  FOR i IN 1..5 LOOP
    v_id := vehicle_ids[i];
    
    -- Get an available charging stall
    SELECT id INTO resource_uuid FROM ottoq_resources 
    WHERE depot_id = depot_uuid AND resource_type = 'CHARGE_STALL' AND status = 'AVAILABLE' 
    ORDER BY index LIMIT 1;
    
    IF resource_uuid IS NOT NULL AND v_id IS NOT NULL THEN
      INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at)
      VALUES (v_id, depot_uuid, resource_uuid, 'CHARGE', 'ACTIVE', NOW())
      RETURNING id INTO job_uuid;
      
      UPDATE ottoq_resources SET status = 'BUSY', current_job_id = job_uuid WHERE id = resource_uuid;
    END IF;
  END LOOP;

  -- Create 3 occupied cleaning stalls
  FOR i IN 6..8 LOOP
    v_id := vehicle_ids[i];
    
    SELECT id INTO resource_uuid FROM ottoq_resources 
    WHERE depot_id = depot_uuid AND resource_type = 'CLEAN_DETAIL_STALL' AND status = 'AVAILABLE' 
    ORDER BY index LIMIT 1;
    
    IF resource_uuid IS NOT NULL AND v_id IS NOT NULL THEN
      INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at)
      VALUES (v_id, depot_uuid, resource_uuid, 'DETAILING', 'ACTIVE', NOW())
      RETURNING id INTO job_uuid;
      
      UPDATE ottoq_resources SET status = 'BUSY', current_job_id = job_uuid WHERE id = resource_uuid;
    END IF;
  END LOOP;

  -- Create 1 occupied maintenance bay
  v_id := vehicle_ids[9];
  SELECT id INTO resource_uuid FROM ottoq_resources 
  WHERE depot_id = depot_uuid AND resource_type = 'MAINTENANCE_BAY' AND status = 'AVAILABLE' 
  ORDER BY index LIMIT 1;
  
  IF resource_uuid IS NOT NULL AND v_id IS NOT NULL THEN
    INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at)
    VALUES (v_id, depot_uuid, resource_uuid, 'MAINTENANCE', 'ACTIVE', NOW())
    RETURNING id INTO job_uuid;
    
    UPDATE ottoq_resources SET status = 'BUSY', current_job_id = job_uuid WHERE id = resource_uuid;
  END IF;

  -- Create 1 occupied staging stall
  v_id := vehicle_ids[10];
  SELECT id INTO resource_uuid FROM ottoq_resources 
  WHERE depot_id = depot_uuid AND resource_type = 'STAGING_STALL' AND status = 'AVAILABLE' 
  ORDER BY index LIMIT 1;
  
  IF resource_uuid IS NOT NULL AND v_id IS NOT NULL THEN
    INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at)
    VALUES (v_id, depot_uuid, resource_uuid, 'DOWNTIME_PARK', 'ACTIVE', NOW())
    RETURNING id INTO job_uuid;
    
    UPDATE ottoq_resources SET status = 'BUSY', current_job_id = job_uuid WHERE id = resource_uuid;
  END IF;
END $$;