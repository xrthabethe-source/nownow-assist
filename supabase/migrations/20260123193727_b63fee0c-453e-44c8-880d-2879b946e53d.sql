-- Allow drivers to view pending (unassigned) jobs so they can accept them
CREATE POLICY "Drivers can view pending jobs" 
ON public.jobs 
FOR SELECT 
USING (
  status = 'pending' 
  AND driver_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM public.drivers 
    WHERE drivers.user_id = auth.uid() 
    AND drivers.status = 'approved'
    AND drivers.is_online = true
  )
);