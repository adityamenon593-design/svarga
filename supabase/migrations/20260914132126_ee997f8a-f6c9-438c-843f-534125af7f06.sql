ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS training_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_consent_at timestamptz;