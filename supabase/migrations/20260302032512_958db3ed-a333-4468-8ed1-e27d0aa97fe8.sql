
-- ============================================================
-- Tighten OTTOQ tables: drop permissive "Allow all" policies,
-- keep public SELECT, restrict writes to admins only.
-- Edge functions use SERVICE_ROLE_KEY so bypass RLS.
-- ============================================================

-- ottoq_cities
DROP POLICY IF EXISTS "Allow all on ottoq_cities" ON public.ottoq_cities;
CREATE POLICY "Admin write ottoq_cities" ON public.ottoq_cities
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ottoq_depots
DROP POLICY IF EXISTS "Allow all on ottoq_depots" ON public.ottoq_depots;
CREATE POLICY "Admin write ottoq_depots" ON public.ottoq_depots
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ottoq_resources
DROP POLICY IF EXISTS "Allow all on ottoq_resources" ON public.ottoq_resources;
CREATE POLICY "Admin write ottoq_resources" ON public.ottoq_resources
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ottoq_vehicles
DROP POLICY IF EXISTS "Allow all on ottoq_vehicles" ON public.ottoq_vehicles;
CREATE POLICY "Admin write ottoq_vehicles" ON public.ottoq_vehicles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ottoq_jobs
DROP POLICY IF EXISTS "Allow all on ottoq_jobs" ON public.ottoq_jobs;
CREATE POLICY "Admin write ottoq_jobs" ON public.ottoq_jobs
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ottoq_events
DROP POLICY IF EXISTS "Allow all on ottoq_events" ON public.ottoq_events;
CREATE POLICY "Admin write ottoq_events" ON public.ottoq_events
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ottoq_schedules
DROP POLICY IF EXISTS "Allow all on ottoq_schedules" ON public.ottoq_schedules;
CREATE POLICY "Admin write ottoq_schedules" ON public.ottoq_schedules
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Add read policy for authenticated users
CREATE POLICY "Authenticated read ottoq_schedules" ON public.ottoq_schedules
  FOR SELECT USING (auth.role() = 'authenticated');

-- ottoq_task_confirmations
DROP POLICY IF EXISTS "Allow all on ottoq_task_confirmations" ON public.ottoq_task_confirmations;
CREATE POLICY "Admin write ottoq_task_confirmations" ON public.ottoq_task_confirmations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Add read policy for authenticated users
CREATE POLICY "Authenticated read ottoq_task_confirmations" ON public.ottoq_task_confirmations
  FOR SELECT USING (auth.role() = 'authenticated');

-- ottoq_movement_queue
DROP POLICY IF EXISTS "Allow all on ottoq_movement_queue" ON public.ottoq_movement_queue;
CREATE POLICY "Admin write ottoq_movement_queue" ON public.ottoq_movement_queue
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Add read policy for authenticated users
CREATE POLICY "Authenticated read ottoq_movement_queue" ON public.ottoq_movement_queue
  FOR SELECT USING (auth.role() = 'authenticated');

-- ottoq_simulator_state
DROP POLICY IF EXISTS "Allow all on ottoq_simulator_state" ON public.ottoq_simulator_state;
CREATE POLICY "Admin write ottoq_simulator_state" ON public.ottoq_simulator_state
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
