-- Update all vehicles with properly randomized OEM names
DO $$
DECLARE
  vehicle_record RECORD;
  random_oem TEXT;
  serial TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  random_num FLOAT;
BEGIN
  FOR vehicle_record IN SELECT id FROM ottoq_vehicles LOOP
    -- Generate new random number for each vehicle
    random_num := random();
    
    -- Distribute evenly: 0-0.33 = Waymo, 0.33-0.67 = Zoox, 0.67-1 = Motional
    IF random_num < 0.33 THEN
      random_oem := 'Waymo';
    ELSIF random_num < 0.67 THEN
      random_oem := 'Zoox';
    ELSE
      random_oem := 'Motional';
    END IF;
    
    -- Generate unique serial like "657AGH" for each vehicle
    serial := '';
    serial := serial || floor(random() * 10)::text;
    serial := serial || floor(random() * 10)::text;
    serial := serial || floor(random() * 10)::text;
    serial := serial || substr(chars, 1 + floor(random() * 26)::int, 1);
    serial := serial || substr(chars, 1 + floor(random() * 26)::int, 1);
    serial := serial || substr(chars, 1 + floor(random() * 26)::int, 1);
    
    -- Update vehicle
    UPDATE ottoq_vehicles
    SET 
      oem = random_oem,
      external_ref = random_oem || ' ' || serial
    WHERE id = vehicle_record.id;
  END LOOP;
END $$;
