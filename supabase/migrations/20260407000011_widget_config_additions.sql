-- Add new widget_config fields for incentive text and exit capture
-- These are stored in the existing widget_config JSONB column (no column changes needed)
-- This migration just documents the new fields and sets defaults for any existing rows.

-- Set defaults for new widget_config keys on existing assistants that don't have them
UPDATE assistants
SET widget_config = widget_config || jsonb_build_object(
  'incentiveText', COALESCE(widget_config->>'incentiveText', ''),
  'exitCaptureEnabled', COALESCE((widget_config->>'exitCaptureEnabled')::boolean, false),
  'exitCaptureMessage', COALESCE(widget_config->>'exitCaptureMessage', 'Before you go — can I help you with anything else?')
)
WHERE widget_config IS NOT NULL;
