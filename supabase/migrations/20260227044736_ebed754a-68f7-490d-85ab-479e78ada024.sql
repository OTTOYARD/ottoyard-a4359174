
-- Create public storage bucket for AI-generated vehicle renders
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-renders', 'vehicle-renders', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from vehicle-renders (public bucket)
CREATE POLICY "Vehicle renders are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-renders');

-- Allow service role (edge functions) to insert renders
CREATE POLICY "Service role can upload vehicle renders"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-renders');

-- Allow service role to update/overwrite renders
CREATE POLICY "Service role can update vehicle renders"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-renders');
