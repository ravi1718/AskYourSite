-- Persistent visitor identity (one row per visitor per assistant)
CREATE TABLE IF NOT EXISTS public.visitor_profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id      TEXT NOT NULL,
  assistant_id    UUID REFERENCES public.assistants(id) ON DELETE CASCADE,
  email           TEXT,
  name            TEXT,
  total_sessions  INTEGER NOT NULL DEFAULT 1,
  pages_visited   TEXT[] NOT NULL DEFAULT '{}',
  questions_asked TEXT[] NOT NULL DEFAULT '{}',
  last_action     TEXT,
  sentiment_avg   FLOAT,
  first_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (visitor_id, assistant_id)
);

-- RLS: assistant owners can read their visitor profiles
ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_visitor_profiles"
  ON public.visitor_profiles FOR SELECT
  USING (
    assistant_id IN (
      SELECT id FROM public.assistants WHERE user_id = auth.uid()
    )
  );

-- Public insert/upsert for the embed script (no auth)
CREATE POLICY "public_upsert_visitor_profiles"
  ON public.visitor_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public_update_visitor_profiles"
  ON public.visitor_profiles FOR UPDATE
  USING (true);

CREATE INDEX IF NOT EXISTS visitor_profiles_assistant_id_idx ON public.visitor_profiles (assistant_id);
CREATE INDEX IF NOT EXISTS visitor_profiles_visitor_id_idx   ON public.visitor_profiles (visitor_id);
CREATE INDEX IF NOT EXISTS visitor_profiles_last_seen_idx    ON public.visitor_profiles (last_seen DESC);
