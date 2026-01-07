-- Update existing SCHEDULED jobs to ACTIVE
UPDATE ottoq_jobs 
SET state = 'ACTIVE', started_at = NOW()
WHERE state = 'SCHEDULED';

-- Update linked resources from RESERVED to BUSY (BUSY means actively in use)
UPDATE ottoq_resources 
SET status = 'BUSY'
WHERE status = 'RESERVED' AND current_job_id IS NOT NULL;

-- Create mock occupied stalls for testing
DO $$
DECLARE
  v_depot_id UUID;
  v_city_id UUID;
  v_vehicle_id UUID;
  v_resource_id UUID;
  v_job_id UUID;
BEGIN
  -- Get any depot with resources
  SELECT d.id, d.city_id INTO v_depot_id, v_city_id
  FROM ottoq_depots d
  JOIN ottoq_cities c ON d.city_id = c.id
  LIMIT 1;

  -- Create occupied CHARGE_STALLs (indices 2 and 3)
  FOR i IN 2..3 LOOP
    SELECT id INTO v_resource_id
    FROM ottoq_resources
    WHERE depot_id = v_depot_id 
      AND resource_type = 'CHARGE_STALL' 
      AND status = 'AVAILABLE'
      AND index = i
    LIMIT 1;
    
    IF v_resource_id IS NOT NULL THEN
      SELECT id INTO v_vehicle_id
      FROM ottoq_vehicles
      WHERE city_id = v_city_id AND status = 'IDLE'
      LIMIT 1;
      
      IF v_vehicle_id IS NOT NULL THEN
        INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at)
        VALUES (v_vehicle_id, v_depot_id, v_resource_id, 'CHARGE', 'ACTIVE', NOW())
        RETURNING id INTO v_job_id;
        
        UPDATE ottoq_resources 
        SET status = 'BUSY', current_job_id = v_job_id
        WHERE id = v_resource_id;
        
        UPDATE ottoq_vehicles SET status = 'AT_DEPOT' WHERE id = v_vehicle_id;
      END IF;
    END IF;
  END LOOP;

  -- Create occupied CLEAN_DETAIL_STALLs (indices 41 and 42)
  FOR i IN 41..42 LOOP
    SELECT id INTO v_resource_id
    FROM ottoq_resources
    WHERE depot_id = v_depot_id 
      AND resource_type = 'CLEAN_DETAIL_STALL' 
      AND status = 'AVAILABLE'
      AND index = i
    LIMIT 1;
    
    IF v_resource_id IS NOT NULL THEN
      SELECT id INTO v_vehicle_id
      FROM ottoq_vehicles
      WHERE city_id = v_city_id AND status = 'IDLE'
      LIMIT 1;
      
      IF v_vehicle_id IS NOT NULL THEN
        INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at)
        VALUES (v_vehicle_id, v_depot_id, v_resource_id, 'DETAILING', 'ACTIVE', NOW())
        RETURNING id INTO v_job_id;
        
        UPDATE ottoq_resources 
        SET status = 'BUSY', current_job_id = v_job_id
        WHERE id = v_resource_id;
        
        UPDATE ottoq_vehicles SET status = 'AT_DEPOT' WHERE id = v_vehicle_id;
      END IF;
    END IF;
  END LOOP;

  -- Create occupied MAINTENANCE_BAY (bay 1)
  SELECT id INTO v_resource_id
  FROM ottoq_resources
  WHERE depot_id = v_depot_id 
    AND resource_type = 'MAINTENANCE_BAY' 
    AND status = 'AVAILABLE'
    AND index = 1
  LIMIT 1;
  
  IF v_resource_id IS NOT NULL THEN
    SELECT id INTO v_vehicle_id
    FROM ottoq_vehicles
    WHERE city_id = v_city_id AND status = 'IDLE'
    LIMIT 1;
    
    IF v_vehicle_id IS NOT NULL THEN
      INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at, metadata_jsonb)
      VALUES (v_vehicle_id, v_depot_id, v_resource_id, 'MAINTENANCE', 'ACTIVE', NOW(), '{"maintenance_type": "Routine Maintenance"}')
      RETURNING id INTO v_job_id;
      
      UPDATE ottoq_resources 
      SET status = 'BUSY', current_job_id = v_job_id
      WHERE id = v_resource_id;
      
      UPDATE ottoq_vehicles SET status = 'AT_DEPOT' WHERE id = v_vehicle_id;
    END IF;
  END IF;

  -- Create STAGING_STALL resources (10 spots)
  FOR i IN 1..10 LOOP
    INSERT INTO ottoq_resources (depot_id, resource_type, index, capabilities_jsonb, status)
    VALUES (v_depot_id, 'STAGING_STALL', i, '{"type": "parking", "covered": true}', 'AVAILABLE')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Occupy 2 staging stalls
  FOR i IN 1..2 LOOP
    SELECT id INTO v_resource_id
    FROM ottoq_resources
    WHERE depot_id = v_depot_id 
      AND resource_type = 'STAGING_STALL' 
      AND status = 'AVAILABLE'
      AND index = i
    LIMIT 1;
    
    IF v_resource_id IS NOT NULL THEN
      SELECT id INTO v_vehicle_id
      FROM ottoq_vehicles
      WHERE city_id = v_city_id AND status = 'IDLE'
      LIMIT 1;
      
      IF v_vehicle_id IS NOT NULL THEN
        INSERT INTO ottoq_jobs (vehicle_id, depot_id, resource_id, job_type, state, started_at)
        VALUES (v_vehicle_id, v_depot_id, v_resource_id, 'DOWNTIME_PARK', 'ACTIVE', NOW())
        RETURNING id INTO v_job_id;
        
        UPDATE ottoq_resources 
        SET status = 'BUSY', current_job_id = v_job_id
        WHERE id = v_resource_id;
        
        UPDATE ottoq_vehicles SET status = 'AT_DEPOT' WHERE id = v_vehicle_id;
      END IF;
    END IF;
  END LOOP;
  
END $$;