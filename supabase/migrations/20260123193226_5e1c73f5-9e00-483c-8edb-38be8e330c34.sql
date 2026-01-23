-- Enable realtime for jobs table so admin can monitor live
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;