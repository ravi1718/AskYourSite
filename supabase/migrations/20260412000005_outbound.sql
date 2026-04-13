CREATE TABLE IF NOT EXISTS public.outbound_messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE CASCADE,
  visitor_id   TEXT,
  channel      TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  to_address   TEXT NOT NULL,
  subject      TEXT,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered')),
  triggered_by TEXT,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.outbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_read_outbound"
  ON public.outbound_messages FOR SELECT
  USING (
    assistant_id IN (
      SELECT id FROM public.assistants WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS outbound_messages_assistant_id_idx ON public.outbound_messages (assistant_id);
CREATE INDEX IF NOT EXISTS outbound_messages_sent_at_idx ON public.outbound_messages (sent_at DESC);
