-- Response overrides: owners can pin specific answers to specific trigger phrases
CREATE TABLE IF NOT EXISTS response_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  trigger_phrase TEXT NOT NULL,
  override_response TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS response_overrides_assistant_id_idx ON response_overrides(assistant_id);
CREATE INDEX IF NOT EXISTS response_overrides_active_idx ON response_overrides(assistant_id, is_active);

ALTER TABLE response_overrides ENABLE ROW LEVEL SECURITY;

-- Only the assistant owner can manage overrides
CREATE POLICY "owner_manage_overrides" ON response_overrides
  FOR ALL USING (
    assistant_id IN (
      SELECT id FROM assistants WHERE user_id = auth.uid()
    )
  );
