CREATE TABLE IF NOT EXISTS public.agent_workflows (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id    UUID REFERENCES public.assistants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  trigger_action  TEXT NOT NULL,
  steps           JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  run_count       INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id      UUID REFERENCES public.agent_workflows(id) ON DELETE CASCADE,
  assistant_id     UUID,
  session_id       TEXT,
  visitor_email    TEXT,
  trigger_payload  JSONB,
  current_step     INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'paused', 'completed', 'failed')),
  next_run_at      TIMESTAMPTZ,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

ALTER TABLE public.agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_workflows"
  ON public.agent_workflows FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_read_workflow_runs"
  ON public.workflow_runs FOR SELECT
  USING (
    workflow_id IN (
      SELECT id FROM public.agent_workflows WHERE user_id = auth.uid()
    )
  );

-- Service role can write runs (cron job)
CREATE POLICY "service_manage_workflow_runs"
  ON public.workflow_runs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS workflow_runs_status_next_idx ON public.workflow_runs (status, next_run_at)
  WHERE status = 'paused';
CREATE INDEX IF NOT EXISTS agent_workflows_assistant_id_idx ON public.agent_workflows (assistant_id);
