-- Google Docs, Google Sheets, and Google Drive sync configs per bot.
-- All three share a single Google OAuth token (provider = "google" in user_integrations).
-- Each has its own config table so assistants can pick different docs/sheets/folders.

-- ─── Google Docs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS google_docs_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_docs JSONB NOT NULL DEFAULT '[]',  -- [{ id, title }]
  sync_frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gdocs_sync_pending ON google_docs_sync_configs(next_sync_at) WHERE status = 'active';
CREATE INDEX idx_gdocs_sync_bot ON google_docs_sync_configs(bot_id);
CREATE INDEX idx_gdocs_sync_user ON google_docs_sync_configs(user_id);
CREATE UNIQUE INDEX idx_gdocs_sync_bot_unique ON google_docs_sync_configs(bot_id);

ALTER TABLE google_docs_sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own Google Docs sync configs"
  ON google_docs_sync_configs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Google Sheets ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS google_sheets_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_sheets JSONB NOT NULL DEFAULT '[]',  -- [{ id, title, sheetName }]
  sync_frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gsheets_sync_pending ON google_sheets_sync_configs(next_sync_at) WHERE status = 'active';
CREATE INDEX idx_gsheets_sync_bot ON google_sheets_sync_configs(bot_id);
CREATE INDEX idx_gsheets_sync_user ON google_sheets_sync_configs(user_id);
CREATE UNIQUE INDEX idx_gsheets_sync_bot_unique ON google_sheets_sync_configs(bot_id);

ALTER TABLE google_sheets_sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own Google Sheets sync configs"
  ON google_sheets_sync_configs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Google Drive ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS google_drive_sync_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_folders JSONB NOT NULL DEFAULT '[]',  -- [{ id, title }]
  sync_frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  last_synced_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ DEFAULT NOW(),
  content_hash TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gdrive_sync_pending ON google_drive_sync_configs(next_sync_at) WHERE status = 'active';
CREATE INDEX idx_gdrive_sync_bot ON google_drive_sync_configs(bot_id);
CREATE INDEX idx_gdrive_sync_user ON google_drive_sync_configs(user_id);
CREATE UNIQUE INDEX idx_gdrive_sync_bot_unique ON google_drive_sync_configs(bot_id);

ALTER TABLE google_drive_sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own Google Drive sync configs"
  ON google_drive_sync_configs FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
