-- Update all vehicles with randomized OEM names (Waymo, Zoox, Motional)
DO $$
DECLARE
  vehicle_record RECORD;
  oems TEXT[] := ARRAY['Waymo', 'Zoox', 'Motional'];
  random_oem TEXT;
  serial TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  i INTEGER;
BEGIN
  FOR vehicle_record IN SELECT id FROM ottoq_vehicles LOOP
    -- Pick random OEM
    random_oem := oems[1 + floor(random() * 3)::int];
    
    -- Generate serial like "657AGH"
    serial := '';
    FOR i IN 1..3 LOOP
      serial := serial || floor(random() * 10)::text;
    END LOOP;
    FOR i IN 1..3 LOOP
      serial := serial || substr(chars, 1 + floor(random() * 26)::int, 1);
    END LOOP;
    
    -- Update vehicle
    UPDATE ottoq_vehicles
    SET 
      oem = random_oem,
      external_ref = random_oem || ' ' || serial
    WHERE id = vehicle_record.id;
  END LOOP;
END $$;
