
-- Allow authenticated users (admin) to manage licenses from the frontend
CREATE POLICY "Authenticated users can read licenses"
ON public.licenses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert licenses"
ON public.licenses FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update licenses"
ON public.licenses FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read activations"
ON public.license_activations FOR SELECT
TO authenticated
USING (true);
