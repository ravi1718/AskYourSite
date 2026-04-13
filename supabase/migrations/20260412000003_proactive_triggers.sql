CREATE TABLE IF NOT EXISTS public.proactive_triggers (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id    UUID REFERENCES public.assistants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN (
    'time_on_page', 'scroll_depth', 'exit_intent',
    'inactivity', 'return_visit', 'page_contains'
  )),
  condition_value JSONB NOT NULL DEFAULT '{}',
  url_pattern     TEXT,
  message         TEXT NOT NULL,
  cooldown_hours  INTEGER NOT NULL DEFAULT 24,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  fire_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proactive_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_triggers"
  ON public.proactive_triggers FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS proactive_triggers_assistant_id_idx ON public.proactive_triggers (assistant_id);
