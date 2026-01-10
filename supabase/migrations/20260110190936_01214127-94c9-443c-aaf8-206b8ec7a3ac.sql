-- Add default payment method tracking to billing_customers
ALTER TABLE public.billing_customers 
ADD COLUMN IF NOT EXISTS default_payment_method_id TEXT;

-- Add payment method details to service_orders for receipt display
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS payment_method_last4 TEXT,
ADD COLUMN IF NOT EXISTS payment_method_brand TEXT;