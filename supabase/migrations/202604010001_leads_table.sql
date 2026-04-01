-- Leads table for capturing visitor contact info via chat widget
CREATE TABLE IF NOT EXISTS public.leads (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id uuid NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  session_id   text NOT NULL,
  name         text,
  email        text NOT NULL,
  phone        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Assistant owner can read their own leads (authenticated users)
CREATE POLICY "leads_owner_select" ON public.leads
  FOR SELECT USING (
    assistant_id IN (
      SELECT id FROM public.assistants WHERE user_id = auth.uid()
    )
  );

-- Widget submissions are unauthenticated — allow service role inserts
CREATE POLICY "leads_service_insert" ON public.leads
  FOR INSERT WITH CHECK (true);
