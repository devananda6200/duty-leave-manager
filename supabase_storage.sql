-- 1. Add document URLs to the leaves table
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS permission_slip_url TEXT;
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS certificate_url TEXT;

-- 2. Create a Storage Bucket for Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true) 
ON CONFLICT DO NOTHING;

-- 3. Add Security Policies for Storage
-- Allow anyone to view documents
CREATE POLICY "Public Read Documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated students to upload documents
CREATE POLICY "Auth Upload Documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update Documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
