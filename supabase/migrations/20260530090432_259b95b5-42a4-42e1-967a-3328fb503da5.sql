
CREATE TABLE public.short_links (
  code TEXT PRIMARY KEY,
  target_url TEXT NOT NULL,
  job_id UUID,
  hits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

GRANT SELECT ON public.short_links TO anon;
GRANT SELECT ON public.short_links TO authenticated;
GRANT ALL ON public.short_links TO service_role;

ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

-- Anyone with the code can read (it's a URL shortener; the code IS the secret)
CREATE POLICY "Anyone can read short links"
  ON public.short_links FOR SELECT
  USING (true);
