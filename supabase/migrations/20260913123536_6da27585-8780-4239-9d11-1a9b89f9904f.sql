CREATE TABLE public.usage_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('question','image')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_events_select_own ON public.usage_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX usage_events_user_kind_created_idx
  ON public.usage_events (user_id, kind, created_at DESC);