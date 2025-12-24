-- Create storage bucket for bot media
INSERT INTO storage.buckets (id, name, public)
VALUES ('bot-media', 'bot-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view bot media"
ON storage.objects FOR SELECT
USING (bucket_id = 'bot-media');

-- Allow admins to upload
CREATE POLICY "Admins can upload bot media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'bot-media' AND is_admin());

-- Allow admins to update
CREATE POLICY "Admins can update bot media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'bot-media' AND is_admin());

-- Allow admins to delete
CREATE POLICY "Admins can delete bot media"
ON storage.objects FOR DELETE
USING (bucket_id = 'bot-media' AND is_admin());