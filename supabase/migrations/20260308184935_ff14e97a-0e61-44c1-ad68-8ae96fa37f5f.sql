ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_offline boolean DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone DEFAULT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS offline_draft_id text DEFAULT NULL;