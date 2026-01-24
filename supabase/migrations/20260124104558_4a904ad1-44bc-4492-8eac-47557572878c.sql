-- Create table for in-app chat messages between customers and drivers
CREATE TABLE public.job_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'driver')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

-- Customers can read/write messages for their jobs
CREATE POLICY "Customers can read messages for their jobs"
ON public.job_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_messages.job_id 
    AND jobs.customer_id = auth.uid()
  )
);

CREATE POLICY "Customers can send messages for their jobs"
ON public.job_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  sender_type = 'customer' AND
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = job_messages.job_id 
    AND jobs.customer_id = auth.uid()
  )
);

-- Drivers can read/write messages for their assigned jobs
CREATE POLICY "Drivers can read messages for their jobs"
ON public.job_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.drivers d ON j.driver_id = d.id
    WHERE j.id = job_messages.job_id 
    AND d.user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can send messages for their jobs"
ON public.job_messages FOR INSERT
WITH CHECK (
  sender_type = 'driver' AND
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.drivers d ON j.driver_id = d.id
    WHERE j.id = job_messages.job_id 
    AND d.user_id = auth.uid()
  )
);

-- Enable realtime for job_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_messages;

-- Create index for faster queries
CREATE INDEX idx_job_messages_job_id ON public.job_messages(job_id);
CREATE INDEX idx_job_messages_created_at ON public.job_messages(created_at DESC);