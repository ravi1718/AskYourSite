-- Add widget_config JSONB column to assistants for appearance customization
alter table public.assistants
add column if not exists widget_config jsonb not null default '{
  "primaryColor": "#3b82f6",
  "bgColor": "#0f172a",
  "textColor": "#f8fafc",
  "fontFamily": "Inter",
  "systemPrompt": "",
  "logoUrl": "",
  "tone": "helpful",
  "placeholder": "Ask me anything...",
  "welcomeMessage": "Hi! How can I help you today?"
}'::jsonb;
