-- Fix security: Set search_path for OTTOQ function
CREATE OR REPLACE FUNCTION create_ottoq_depot_resources(depot_uuid UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;