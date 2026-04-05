-- Notion sync configuration per bot.
-- Stores which Notion pages/databases a bot should learn from,
-- sync frequency, and state from the last sync run.

CREATE TABLE IF NOT EXISTS notion_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notion_integration_id UUID REFERENCES user_integrations(id) ON DELETE SET NULL,
  selected_pages JSONB NOT NULL DEFAULT '[]',    -- [{ id, title, last_edited }]
  selected_databases JSONB NOT NULL DEFAULT '[]', -- [{ id, title, last_edited }]
  sync_frequency VARCHAR(20) NOT NULL DEFAULT 'daily', -- 'daily' | 'hourly'
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,       -- SHA-256 of concatenated content; skip re-embed if unchanged
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'syncing' | 'error'
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notion_sync_pending ON notion_sync_configs(next_sync_at) WHERE status = 'active';
CREATE INDEX idx_notion_sync_bot ON notion_sync_configs(bot_id);
CREATE INDEX idx_notion_sync_user ON notion_sync_configs(user_id);

-- Only one sync config per bot
CREATE UNIQUE INDEX idx_notion_sync_bot_unique ON notion_sync_configs(bot_id);

-- RLS
ALTER TABLE notion_sync_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own Notion sync configs"
  ON notion_sync_configs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
