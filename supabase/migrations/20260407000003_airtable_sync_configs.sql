-- Airtable sync config per bot.
-- Users select which Airtable tables to sync per assistant.
-- Each table is { id, title, baseId, baseName }.

CREATE TABLE IF NOT EXISTS airtable_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_tables JSONB NOT NULL DEFAULT '[]',  -- [{ id, title, baseId, baseName }]
  sync_frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_airtable_sync_pending ON airtable_sync_configs(next_sync_at) WHERE status = 'active';
CREATE INDEX idx_airtable_sync_bot ON airtable_sync_configs(bot_id);
CREATE INDEX idx_airtable_sync_user ON airtable_sync_configs(user_id);
CREATE UNIQUE INDEX idx_airtable_sync_bot_unique ON airtable_sync_configs(bot_id);

ALTER TABLE airtable_sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own Airtable sync configs"
  ON airtable_sync_configs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
