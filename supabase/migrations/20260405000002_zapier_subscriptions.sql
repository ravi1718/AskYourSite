-- Zapier REST hook subscriptions.
-- When a user activates a Zapier trigger, Zapier POSTs a target_url here.
-- We store it and POST event payloads to it when events fire.

CREATE TABLE IF NOT EXISTS zapier_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
  trigger_event VARCHAR(50) NOT NULL,  -- e.g. "lead.captured", "intent.detected"
  target_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_zapier_subs_user_event ON zapier_subscriptions(user_id, trigger_event) WHERE is_active = TRUE;
CREATE INDEX idx_zapier_subs_user ON zapier_subscriptions(user_id);

-- RLS: users manage their own subscriptions
ALTER TABLE zapier_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own Zapier subscriptions"
  ON zapier_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
