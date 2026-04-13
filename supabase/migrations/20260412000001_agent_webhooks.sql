-- Agent Webhooks: user-configured outbound webhook endpoints the AI agent can trigger
CREATE TABLE IF NOT EXISTS agent_webhooks (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id      UUID        NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  action            TEXT        NOT NULL CHECK (action IN (
    'capture_lead', 'book_demo', 'recommend_product', 'trigger_discount',
    'send_notification', 'assign_human_agent', 'update_crm', 'track_event', 'personalize_experience'
  )),
  endpoint_url      TEXT        NOT NULL,
  secret_key        TEXT,
  is_active         BOOLEAN     DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  trigger_count     INTEGER     DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_webhooks_assistant ON agent_webhooks(assistant_id);
CREATE INDEX idx_agent_webhooks_user ON agent_webhooks(user_id);
CREATE INDEX idx_agent_webhooks_active ON agent_webhooks(assistant_id, action) WHERE is_active = TRUE;

ALTER TABLE agent_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhooks"
  ON agent_webhooks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Agent Action Log: audit trail of every webhook fired by the agent
CREATE TABLE IF NOT EXISTS agent_action_log (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id    UUID        NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  session_id      TEXT,
  action          TEXT        NOT NULL,
  trigger_reason  TEXT,
  payload         JSONB,
  endpoint_url    TEXT,
  response_status INTEGER,
  fired_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_action_log_assistant ON agent_action_log(assistant_id, fired_at DESC);
CREATE INDEX idx_agent_action_log_session ON agent_action_log(session_id);

ALTER TABLE agent_action_log ENABLE ROW LEVEL SECURITY;

-- Dashboard owners can read logs for their assistants; service role writes
CREATE POLICY "Owners read own action logs"
  ON agent_action_log FOR SELECT
  USING (
    assistant_id IN (
      SELECT id FROM assistants WHERE user_id = auth.uid()
    )
  );
