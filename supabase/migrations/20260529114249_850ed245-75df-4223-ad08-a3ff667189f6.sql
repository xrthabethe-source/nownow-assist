ALTER TABLE public.jobs
DROP CONSTRAINT IF EXISTS jobs_customer_id_fkey;

ALTER TABLE public.jobs
ADD CONSTRAINT jobs_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;