
-- jobs: source + whatsapp phone
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app',
  ADD COLUMN IF NOT EXISTS wa_phone text;

CREATE INDEX IF NOT EXISTS jobs_wa_phone_idx ON public.jobs(wa_phone) WHERE wa_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_source_idx ON public.jobs(source);

-- profiles: phone index for fast lookup from WhatsApp
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone) WHERE phone IS NOT NULL;

-- Conversation state machine
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  profile_id uuid,
  step text NOT NULL DEFAULT 'idle',
  draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Message log
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  profile_id uuid,
  job_id uuid,
  direction text NOT NULL CHECK (direction IN ('in','out')),
  message_type text NOT NULL DEFAULT 'text',
  body text,
  payload jsonb,
  wa_message_id text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wa_messages_phone_idx ON public.whatsapp_messages(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS wa_messages_job_idx ON public.whatsapp_messages(job_id) WHERE job_id IS NOT NULL;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers read their whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (profile_id = auth.uid());

-- Terms consent log
CREATE TABLE IF NOT EXISTS public.terms_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  profile_id uuid,
  terms_version text NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  accepted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS terms_consents_phone_idx ON public.terms_consents(phone);

ALTER TABLE public.terms_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read consents"
  ON public.terms_consents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger for conversations
DROP TRIGGER IF EXISTS trg_wa_conv_updated_at ON public.whatsapp_conversations;
CREATE TRIGGER trg_wa_conv_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed config row (terms URL / version / business number; admin can edit later)
INSERT INTO public.app_settings (key, value, description)
VALUES (
  'whatsapp_config',
  jsonb_build_object(
    'business_number', '',
    'terms_url', 'https://nownowassist.co.za/terms',
    'terms_version', 'v1.0',
    'welcome_message', 'Welcome to Now-Now Assist. We''ll get help to you, now-now.'
  ),
  'WhatsApp Business channel configuration'
)
ON CONFLICT (key) DO NOTHING;
