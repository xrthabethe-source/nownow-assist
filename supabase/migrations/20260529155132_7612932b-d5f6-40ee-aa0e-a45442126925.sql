-- Ensure the 5 official Now-Now Assist services exist & are active.
-- Add UNIQUE on name first so ON CONFLICT works (idempotent).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_name_key'
  ) THEN
    ALTER TABLE public.services ADD CONSTRAINT services_name_key UNIQUE (name);
  END IF;
END $$;

INSERT INTO public.services (name, description, icon, base_price, price_per_km, eta_minutes, is_active) VALUES
  ('Jump start', 'Battery jump start assistance', 'battery', 349, 0, 30, true),
  ('Tyre change', 'Flat tyre replacement', 'wrench', 399, 0, 30, true),
  ('Fuel delivery', 'Emergency fuel delivery', 'fuel', 449, 0, 30, true),
  ('Tyre inflate', 'Tyre inflation assistance', 'wind', 299, 0, 30, true),
  ('Minor roadside assistance', 'On-site minor mechanical help', 'life-buoy', 499, 0, 30, true)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = true,
  updated_at = now();

-- Deactivate any forbidden services (preserve rows for historical job references).
UPDATE public.services
SET is_active = false, updated_at = now()
WHERE name ILIKE 'Tow%'
   OR name ILIKE '%locksmith%'
   OR name ILIKE '%lockout%'
   OR name ILIKE '%accident%'
   OR name ILIKE '%key replacement%';