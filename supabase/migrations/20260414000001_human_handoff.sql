-- ─────────────────────────────────────────────────────────────────────────────
-- Human-in-the-Loop (HITL) — Live Chat Handoff
-- ─────────────────────────────────────────────────────────────────────────────

-- handoff_sessions: one row per triggered human handoff
CREATE TABLE IF NOT EXISTS public.handoff_sessions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id        UUID        NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  session_id          TEXT        NOT NULL,
  visitor_id          TEXT,

  -- State machine: waiting → active → resolved | timed_out
  status              TEXT        NOT NULL DEFAULT 'waiting'
                      CHECK (status IN ('waiting', 'active', 'resolved', 'timed_out')),

  -- Why handoff was triggered
  trigger_reason      TEXT        NOT NULL,
  -- CHECK (trigger_reason IN ('frustration','explicit_request','unanswered_streak','urgency','repeated_question')),
  trigger_message     TEXT        NOT NULL DEFAULT '',

  -- Denormalized from visitor_profiles at creation time (fast inbox render, no JOINs)
  ai_summary          TEXT,
  visitor_name        TEXT,
  visitor_email       TEXT,
  visitor_sentiment   FLOAT,

  -- Agent assignment
  claimed_by_user_id  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at          TIMESTAMPTZ,

  -- Shared link for human agent (no dashboard auth required, token is the credential)
  join_token          TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  token_expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '72 hours',

  -- Lifecycle timestamps
  resolved_at         TIMESTAMPTZ,
  timed_out_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for dashboard inbox query (owner's assistants, by status and recency)
CREATE INDEX IF NOT EXISTS idx_handoff_assistant_status
  ON handoff_sessions(assistant_id, status, created_at DESC);

-- Index for widget poll (looks up by session_id)
CREATE INDEX IF NOT EXISTS idx_handoff_session_id
  ON handoff_sessions(session_id);

-- Index for token lookup (/live-chat/[token] page)
CREATE INDEX IF NOT EXISTS idx_handoff_join_token
  ON handoff_sessions(join_token);

-- ─────────────────────────────────────────────────────────────────────────────
-- handoff_messages: messages FROM human agent during handoff
-- Visitor messages during handoff continue to be stored in chat_messages (role='user')
-- Only agent replies and system notices go here
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.handoff_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  handoff_id      UUID        NOT NULL REFERENCES handoff_sessions(id) ON DELETE CASCADE,
  sender_user_id  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  role            TEXT        NOT NULL CHECK (role IN ('agent', 'system')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handoff_messages_handoff_created
  ON handoff_messages(handoff_id, created_at ASC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — all writes go through admin client (service_role) in API routes
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.handoff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handoff_messages ENABLE ROW LEVEL SECURITY;

-- Workspace owners and their team members can read handoff_sessions
CREATE POLICY "owners_read_handoff_sessions"
  ON handoff_sessions FOR SELECT
  USING (
    assistant_id IN (
      SELECT id FROM public.assistants WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.assistants a ON a.user_id = tm.workspace_owner_id
      WHERE a.id = handoff_sessions.assistant_id
        AND tm.member_user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- Workspace owners and team members can read handoff_messages
CREATE POLICY "owners_read_handoff_messages"
  ON handoff_messages FOR SELECT
  USING (
    handoff_id IN (
      SELECT hs.id FROM public.handoff_sessions hs
      JOIN public.assistants a ON a.id = hs.assistant_id
      WHERE a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members tm
          WHERE tm.workspace_owner_id = a.user_id
            AND tm.member_user_id = auth.uid()
            AND tm.status = 'active'
        )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Plan gating: human_handoff feature flag (Business plan only)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE public.subscription_plans
  SET feature_flags = COALESCE(feature_flags, '{}'::jsonb) || '{"human_handoff": false}'::jsonb
  WHERE code = 'starter';

UPDATE public.subscription_plans
  SET feature_flags = COALESCE(feature_flags, '{}'::jsonb) || '{"human_handoff": false}'::jsonb
  WHERE code = 'pro';

UPDATE public.subscription_plans
  SET feature_flags = COALESCE(feature_flags, '{}'::jsonb) || '{"human_handoff": true}'::jsonb
  WHERE code = 'business';

-- ─────────────────────────────────────────────────────────────────────────────
-- Cron helper: auto-timeout handoffs waiting > 30 min without an agent
-- Called from /api/cron route every 5 minutes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.timeout_stale_handoffs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.handoff_sessions
  SET
    status       = 'timed_out',
    timed_out_at = NOW(),
    updated_at   = NOW()
  WHERE
    status     = 'waiting'
    AND created_at < NOW() - INTERVAL '30 minutes';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
