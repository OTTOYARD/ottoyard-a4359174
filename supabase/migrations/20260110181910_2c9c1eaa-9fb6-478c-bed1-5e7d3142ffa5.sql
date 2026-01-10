-- Add receipt tracking columns to service_orders table
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS receipt_pdf_url text,
ADD COLUMN IF NOT EXISTS receipt_generated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_name text;

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_service_orders_user_status ON public.service_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON public.service_orders(created_at DESC);