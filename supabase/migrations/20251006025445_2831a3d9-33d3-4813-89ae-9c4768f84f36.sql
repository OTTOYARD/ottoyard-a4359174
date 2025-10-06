-- Create function to get random vehicles for a city
CREATE OR REPLACE FUNCTION get_random_vehicles_for_city(p_city_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  city_id UUID,
  soc NUMERIC,
  odometer_km INTEGER,
  health_jsonb JSONB,
  status TEXT,
  last_telemetry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  oem TEXT,
  external_ref TEXT,
  vin TEXT,
  plate TEXT,
  city_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.city_id,
    v.soc,
    v.odometer_km,
    v.health_jsonb,
    v.status::TEXT,
    v.last_telemetry_at,
    v.created_at,
    v.updated_at,
    v.oem,
    v.external_ref,
    v.vin,
    v.plate,
    c.name as city_name
  FROM ottoq_vehicles v
  JOIN ottoq_cities c ON v.city_id = c.id
  WHERE v.city_id = p_city_id
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;