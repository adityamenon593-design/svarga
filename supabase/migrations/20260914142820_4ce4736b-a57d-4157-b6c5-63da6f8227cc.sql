CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  path text,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.analytics_events TO anon;
GRANT INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone may record an event"
ON public.analytics_events FOR INSERT TO anon, authenticated
WITH CHECK (
  length(name) between 1 and 64
  and (path is null or length(path) <= 200)
  and (label is null or length(label) <= 120)
  and (user_id is null or user_id = auth.uid())
);

CREATE INDEX analytics_events_name_created_idx ON public.analytics_events (name, created_at DESC);