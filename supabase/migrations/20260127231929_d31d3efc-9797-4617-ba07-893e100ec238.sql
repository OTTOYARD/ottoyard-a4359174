-- Part 1: Clean up duplicate depots (Depot 1, Depot 2 variants)
DELETE FROM ottoq_resources 
WHERE depot_id IN (
  SELECT id FROM ottoq_depots 
  WHERE name LIKE '%Depot 1%' OR name LIKE '%Depot 2%'
);

DELETE FROM ottoq_depots 
WHERE name LIKE '%Depot 1%' OR name LIKE '%Depot 2%';

-- Part 2: Create new cities for the city search bar options
INSERT INTO ottoq_cities (name, tz) VALUES
  ('Seattle', 'America/Los_Angeles'),
  ('San Francisco', 'America/Los_Angeles'),
  ('Denver', 'America/Denver'),
  ('Chicago', 'America/Chicago'),
  ('New York', 'America/New_York'),
  ('Miami', 'America/New_York')
ON CONFLICT (name) DO NOTHING;

-- Part 3: Create Mini and Max depots for each city that doesn't have them yet
-- This uses a DO block to iterate through cities and create depots with resources

DO $$
DECLARE
  city_record RECORD;
  mini_depot_id UUID;
  max_depot_id UUID;
  city_lat NUMERIC;
  city_lng NUMERIC;
  i INT;
BEGIN
  -- Define city coordinates
  FOR city_record IN 
    SELECT id, name FROM ottoq_cities 
    WHERE name IN ('Seattle', 'San Francisco', 'Denver', 'Chicago', 'New York', 'Miami', 'Nashville', 'Austin', 'LA')
  LOOP
    -- Set coordinates based on city
    CASE city_record.name
      WHEN 'Seattle' THEN city_lat := 47.6062; city_lng := -122.3321;
      WHEN 'San Francisco' THEN city_lat := 37.7749; city_lng := -122.4194;
      WHEN 'Denver' THEN city_lat := 39.7392; city_lng := -104.9903;
      WHEN 'Chicago' THEN city_lat := 41.8781; city_lng := -87.6298;
      WHEN 'New York' THEN city_lat := 40.7128; city_lng := -74.0060;
      WHEN 'Miami' THEN city_lat := 25.7617; city_lng := -80.1918;
      WHEN 'Nashville' THEN city_lat := 36.1627; city_lng := -86.7816;
      WHEN 'Austin' THEN city_lat := 30.2672; city_lng := -97.7431;
      WHEN 'LA' THEN city_lat := 34.0522; city_lng := -118.2437;
      ELSE city_lat := 40.0; city_lng := -100.0;
    END CASE;

    -- Check if Mini depot exists, if not create it
    IF NOT EXISTS (
      SELECT 1 FROM ottoq_depots 
      WHERE city_id = city_record.id AND name LIKE '%Mini%'
    ) THEN
      INSERT INTO ottoq_depots (city_id, name, address, lat, lon)
      VALUES (
        city_record.id, 
        'OTTOYARD Mini - ' || city_record.name,
        city_record.name || ' Mini Depot Address',
        city_lat,
        city_lng
      )
      RETURNING id INTO mini_depot_id;

      -- Create resources for Mini depot (smaller capacity)
      -- 12 charge stalls
      FOR i IN 1..12 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (mini_depot_id, 'CHARGE_STALL', i, 'AVAILABLE');
      END LOOP;
      -- 4 clean/detail stalls
      FOR i IN 1..4 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (mini_depot_id, 'CLEAN_DETAIL_STALL', i, 'AVAILABLE');
      END LOOP;
      -- 2 maintenance bays
      FOR i IN 1..2 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (mini_depot_id, 'MAINTENANCE_BAY', i, 'AVAILABLE');
      END LOOP;
      -- 6 staging stalls
      FOR i IN 1..6 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (mini_depot_id, 'STAGING_STALL', i, 'AVAILABLE');
      END LOOP;
    END IF;

    -- Check if Max depot exists, if not create it
    IF NOT EXISTS (
      SELECT 1 FROM ottoq_depots 
      WHERE city_id = city_record.id AND name LIKE '%Max%'
    ) THEN
      INSERT INTO ottoq_depots (city_id, name, address, lat, lon)
      VALUES (
        city_record.id, 
        'OTTOYARD Max - ' || city_record.name,
        city_record.name || ' Max Depot Address',
        city_lat + 0.02,
        city_lng - 0.02
      )
      RETURNING id INTO max_depot_id;

      -- Create resources for Max depot (larger capacity)
      -- 20 charge stalls
      FOR i IN 1..20 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (max_depot_id, 'CHARGE_STALL', i, 'AVAILABLE');
      END LOOP;
      -- 6 clean/detail stalls
      FOR i IN 1..6 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (max_depot_id, 'CLEAN_DETAIL_STALL', i, 'AVAILABLE');
      END LOOP;
      -- 2 maintenance bays
      FOR i IN 1..2 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (max_depot_id, 'MAINTENANCE_BAY', i, 'AVAILABLE');
      END LOOP;
      -- 8 staging stalls
      FOR i IN 1..8 LOOP
        INSERT INTO ottoq_resources (depot_id, resource_type, index, status)
        VALUES (max_depot_id, 'STAGING_STALL', i, 'AVAILABLE');
      END LOOP;
    END IF;
  END LOOP;
END $$;