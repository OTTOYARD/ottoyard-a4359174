-- Create tables for fleet data and AI analytics

-- Vehicles table for storing vehicle information
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_number TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year INTEGER,
  vin TEXT,
  license_plate TEXT,
  vehicle_type TEXT DEFAULT 'truck',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive', 'out_of_service')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fuel_level INTEGER DEFAULT 100,
  mileage INTEGER DEFAULT 0,
  engine_hours DECIMAL(8, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles
CREATE POLICY "Users can view their own vehicles" 
ON public.vehicles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles" 
ON public.vehicles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fleet analytics table for AI insights
CREATE TABLE public.fleet_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('route_optimization', 'predictive_maintenance', 'anomaly_detection', 'performance_insights', 'cost_analysis')),
  vehicle_id UUID REFERENCES public.vehicles(id),
  insights JSONB NOT NULL,
  recommendations JSONB,
  severity_level TEXT DEFAULT 'low' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for fleet analytics
CREATE POLICY "Users can view their own analytics" 
ON public.fleet_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analytics" 
ON public.fleet_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" 
ON public.fleet_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Voice commands table for logging voice interactions
CREATE TABLE public.voice_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  command_text TEXT NOT NULL,
  command_type TEXT NOT NULL CHECK (command_type IN ('dispatch', 'status_check', 'route_query', 'maintenance_alert', 'general_query')),
  response_text TEXT,
  executed_successfully BOOLEAN DEFAULT false,
  execution_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;

-- Create policies for voice commands
CREATE POLICY "Users can view their own voice commands" 
ON public.voice_commands 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice commands" 
ON public.voice_commands 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Routes table for route optimization
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  route_name TEXT NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  waypoints JSONB,
  estimated_duration INTEGER, -- in minutes
  estimated_distance DECIMAL(8, 2), -- in miles/km
  fuel_consumption_estimate DECIMAL(6, 2),
  optimized_by_ai BOOLEAN DEFAULT false,
  optimization_score INTEGER, -- 1-100
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Create policies for routes
CREATE POLICY "Users can view their own routes" 
ON public.routes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routes" 
ON public.routes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routes" 
ON public.routes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Maintenance records table
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id),
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('scheduled', 'preventive', 'emergency', 'inspection')),
  description TEXT NOT NULL,
  cost DECIMAL(10, 2),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_due_date TIMESTAMP WITH TIME ZONE,
  ai_predicted BOOLEAN DEFAULT false,
  prediction_confidence INTEGER, -- 1-100
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for maintenance records
CREATE POLICY "Users can view their own maintenance records" 
ON public.maintenance_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own maintenance records" 
ON public.maintenance_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenance records" 
ON public.maintenance_records 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fleet_analytics_updated_at
BEFORE UPDATE ON public.fleet_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
BEFORE UPDATE ON public.routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_fleet_analytics_user_id ON public.fleet_analytics(user_id);
CREATE INDEX idx_fleet_analytics_type ON public.fleet_analytics(analysis_type);
CREATE INDEX idx_fleet_analytics_severity ON public.fleet_analytics(severity_level);
CREATE INDEX idx_voice_commands_user_id ON public.voice_commands(user_id);
CREATE INDEX idx_routes_user_id ON public.routes(user_id);
CREATE INDEX idx_maintenance_user_id ON public.maintenance_records(user_id);