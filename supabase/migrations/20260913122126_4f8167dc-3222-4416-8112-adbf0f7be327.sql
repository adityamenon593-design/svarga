CREATE TABLE public.user_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('preference','fact')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 3 AND 300),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, content)
);
CREATE INDEX user_memory_user_created_idx ON public.user_memory (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_memory TO authenticated;
GRANT ALL ON public.user_memory TO service_role;
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_memory_own" ON public.user_memory FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);