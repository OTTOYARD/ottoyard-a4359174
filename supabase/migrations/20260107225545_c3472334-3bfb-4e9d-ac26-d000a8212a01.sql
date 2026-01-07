-- Add STAGING_STALL to resource type enum
ALTER TYPE ottoq_resource_type ADD VALUE IF NOT EXISTS 'STAGING_STALL';

-- Create task confirmations table
CREATE TABLE public.ottoq_task_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.ottoq_jobs(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.ottoq_resources(id) ON DELETE CASCADE,
  task_key TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  automation_source TEXT DEFAULT 'manual',
  notes TEXT,
  metadata_jsonb JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, resource_id, task_key)
);

-- Create movement queue table for inter-site vehicle transfers
CREATE TABLE public.ottoq_movement_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.ottoq_vehicles(id) ON DELETE CASCADE,
  current_resource_id UUID REFERENCES public.ottoq_resources(id) ON DELETE SET NULL,
  target_resource_type ottoq_resource_type NOT NULL,
  target_depot_id UUID NOT NULL REFERENCES public.ottoq_depots(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_task_confirmations_job ON public.ottoq_task_confirmations(job_id);
CREATE INDEX idx_task_confirmations_resource ON public.ottoq_task_confirmations(resource_id);
CREATE INDEX idx_movement_queue_vehicle ON public.ottoq_movement_queue(vehicle_id);
CREATE INDEX idx_movement_queue_status ON public.ottoq_movement_queue(status);
CREATE INDEX idx_movement_queue_depot ON public.ottoq_movement_queue(target_depot_id);

-- Enable RLS
ALTER TABLE public.ottoq_task_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ottoq_movement_queue ENABLE ROW LEVEL SECURITY;

-- RLS policies for task confirmations (allow all for now, can be restricted later)
CREATE POLICY "Allow all on ottoq_task_confirmations"
ON public.ottoq_task_confirmations
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS policies for movement queue
CREATE POLICY "Allow all on ottoq_movement_queue"
ON public.ottoq_movement_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at on movement queue
CREATE TRIGGER update_ottoq_movement_queue_updated_at
BEFORE UPDATE ON public.ottoq_movement_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();