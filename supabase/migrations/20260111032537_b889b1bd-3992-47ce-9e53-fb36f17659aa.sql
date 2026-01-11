-- =====================================================
-- PHASE 1: USER BACKEND & MEMORY SYSTEM
-- Creates tables for monthly statements, user fleet vehicles,
-- and enhances profiles with account summary
-- =====================================================

-- 1. Create monthly_statements table for storing generated statements
CREATE TABLE public.monthly_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  statement_month DATE NOT NULL, -- First day of month (e.g., 2026-01-01)
  order_count INTEGER DEFAULT 0,
  total_amount INTEGER DEFAULT 0, -- In cents
  tax_amount INTEGER DEFAULT 0,   -- In cents
  currency TEXT DEFAULT 'usd',
  statement_pdf_url TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one statement per user per month
  UNIQUE(user_id, statement_month)
);

-- 2. Create user_fleet_vehicles table for user-owned/managed vehicles
CREATE TABLE public.user_fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_identifier TEXT NOT NULL, -- License plate, VIN, or internal ID
  vehicle_name TEXT NOT NULL,       -- Display name (e.g., "Company Tesla #1")
  vehicle_type TEXT DEFAULT 'EV',
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  status TEXT DEFAULT 'active',     -- active, inactive, sold, maintenance
  notes TEXT,
  metadata_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add account_summary_jsonb to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_summary_jsonb JSONB DEFAULT '{
  "lifetime_spend": 0,
  "total_orders": 0,
  "completed_orders": 0,
  "member_since": null,
  "last_order_at": null,
  "vehicle_count": 0,
  "last_summary_update": null
}'::jsonb;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on monthly_statements
ALTER TABLE public.monthly_statements ENABLE ROW LEVEL SECURITY;

-- Users can view their own statements
CREATE POLICY "Users can view own monthly statements"
  ON public.monthly_statements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own statements (for generation triggers)
CREATE POLICY "Users can insert own monthly statements"
  ON public.monthly_statements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own statements
CREATE POLICY "Users can update own monthly statements"
  ON public.monthly_statements
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable RLS on user_fleet_vehicles
ALTER TABLE public.user_fleet_vehicles ENABLE ROW LEVEL SECURITY;

-- Users can view their own fleet vehicles
CREATE POLICY "Users can view own fleet vehicles"
  ON public.user_fleet_vehicles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own fleet vehicles
CREATE POLICY "Users can insert own fleet vehicles"
  ON public.user_fleet_vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own fleet vehicles
CREATE POLICY "Users can update own fleet vehicles"
  ON public.user_fleet_vehicles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own fleet vehicles
CREATE POLICY "Users can delete own fleet vehicles"
  ON public.user_fleet_vehicles
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_monthly_statements_user_id ON public.monthly_statements(user_id);
CREATE INDEX idx_monthly_statements_month ON public.monthly_statements(statement_month DESC);
CREATE INDEX idx_user_fleet_vehicles_user_id ON public.user_fleet_vehicles(user_id);
CREATE INDEX idx_user_fleet_vehicles_status ON public.user_fleet_vehicles(status);

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================

-- Create or replace the update timestamp function (may already exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for monthly_statements
CREATE TRIGGER update_monthly_statements_updated_at
  BEFORE UPDATE ON public.monthly_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for user_fleet_vehicles  
CREATE TRIGGER update_user_fleet_vehicles_updated_at
  BEFORE UPDATE ON public.user_fleet_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();