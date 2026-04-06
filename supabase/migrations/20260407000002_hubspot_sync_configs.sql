-- HubSpot sync config per bot.
-- Users select which HubSpot content sources to sync (KB articles, blog posts).
-- Each source is represented as { id, title, type: "kb" | "blog" }.

CREATE TABLE IF NOT EXISTS hubspot_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_sources JSONB NOT NULL DEFAULT '[]',  -- [{ id, title, type: "kb"|"blog" }]
  sync_frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hubspot_sync_pending ON hubspot_sync_configs(next_sync_at) WHERE status = 'active';
CREATE INDEX idx_hubspot_sync_bot ON hubspot_sync_configs(bot_id);
CREATE INDEX idx_hubspot_sync_user ON hubspot_sync_configs(user_id);
CREATE UNIQUE INDEX idx_hubspot_sync_bot_unique ON hubspot_sync_configs(bot_id);

ALTER TABLE hubspot_sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own HubSpot sync configs"
  ON hubspot_sync_configs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
