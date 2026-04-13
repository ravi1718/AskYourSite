-- ─────────────────────────────────────────────────────────────────────────────
-- Team Spaces
-- Adds multi-user collaboration per workspace (admin's account).
-- Plan limits: Starter = 0, Pro = 3 members total, Business = 5 members total.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add team_member_limit column to subscription_plans
ALTER TABLE subscription_plans
  ADD COLUMN IF NOT EXISTS team_member_limit INTEGER NOT NULL DEFAULT 0;

UPDATE subscription_plans SET team_member_limit = 0 WHERE code = 'starter';
UPDATE subscription_plans SET team_member_limit = 3 WHERE code = 'pro';
UPDATE subscription_plans SET team_member_limit = 5 WHERE code = 'business';

-- 2. Create team_members table
--    workspace_owner_id: the paying admin whose workspace members belong to
--    member_user_id: set to null until the invitee accepts; linked to profiles.id after
CREATE TABLE IF NOT EXISTS team_members (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_owner_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  email               TEXT        NOT NULL,
  role                TEXT        NOT NULL CHECK (role IN ('editor', 'viewer')),
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'active', 'removed')),
  invitation_token    TEXT        UNIQUE,
  token_expires_at    TIMESTAMPTZ,
  invited_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One invite per email per workspace
  UNIQUE (workspace_owner_id, email)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS team_members_workspace_owner_idx
  ON team_members (workspace_owner_id);

CREATE INDEX IF NOT EXISTS team_members_member_user_idx
  ON team_members (member_user_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS team_members_invitation_token_idx
  ON team_members (invitation_token)
  WHERE invitation_token IS NOT NULL;

-- 4. Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Workspace owner can do everything with their team
CREATE POLICY "workspace_owner_manage_team"
  ON team_members
  FOR ALL
  USING (auth.uid() = workspace_owner_id);

-- Member can view their own record
CREATE POLICY "member_view_own_record"
  ON team_members
  FOR SELECT
  USING (auth.uid() = member_user_id);

-- 5. Allow team members to READ the admin's assistants
--    (both editors and viewers can see the list of assistants)
CREATE POLICY "team_members_select_assistants"
  ON assistants
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.workspace_owner_id = assistants.user_id
        AND tm.member_user_id = auth.uid()
        AND tm.status = 'active'
    )
  );

-- 6. Allow editors to UPDATE assistants (design, agent config, etc.)
--    Viewers and pending members are excluded.
CREATE POLICY "team_editors_update_assistants"
  ON assistants
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.workspace_owner_id = assistants.user_id
        AND tm.member_user_id = auth.uid()
        AND tm.role = 'editor'
        AND tm.status = 'active'
    )
  );

-- 7. Allow team members to read training_sources for assistants they can access
CREATE POLICY "team_members_select_training_sources"
  ON training_sources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assistants a
      WHERE a.id = training_sources.assistant_id
        AND (
          a.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.workspace_owner_id = a.user_id
              AND tm.member_user_id = auth.uid()
              AND tm.status = 'active'
          )
        )
    )
  );

-- 8. Allow editors to insert/update training_sources
CREATE POLICY "team_editors_insert_training_sources"
  ON training_sources
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assistants a
      WHERE a.id = training_sources.assistant_id
        AND (
          a.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.workspace_owner_id = a.user_id
              AND tm.member_user_id = auth.uid()
              AND tm.role = 'editor'
              AND tm.status = 'active'
          )
        )
    )
  );

-- 9. Update get_user_usage RPC to include team member counts
-- Must drop first because the return type is changing (new columns added)
DROP FUNCTION IF EXISTS public.get_user_usage(uuid);
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE (
  plan_name           TEXT,
  plan_code           subscription_tier,
  assistant_limit     INT,
  monthly_chat_limit  INT,
  team_member_limit   INT,
  assistants_count    BIGINT,
  conversations_count BIGINT,
  team_member_count   BIGINT,
  subscription_status TEXT,
  trial_ends_at       TIMESTAMPTZ,
  feature_flags       JSONB
) AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  -- Get the user's active plan
  SELECT sp.id INTO v_plan_id
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;

  RETURN QUERY
  SELECT
    sp.name::TEXT,
    sp.code,
    sp.assistant_limit,
    sp.monthly_chat_limit,
    sp.team_member_limit,
    (SELECT COUNT(*) FROM assistants WHERE user_id = p_user_id),
    (
      SELECT COUNT(DISTINCT session_id)
      FROM chat_messages
      WHERE assistant_id IN (SELECT id FROM assistants WHERE user_id = p_user_id)
        AND role = 'user'
        AND created_at >= date_trunc('month', NOW())
    ),
    (
      SELECT COUNT(*)
      FROM team_members
      WHERE workspace_owner_id = p_user_id
        AND status = 'active'
    ),
    us.status::TEXT,
    us.current_period_end,
    sp.feature_flags
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = p_user_id
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Fallback to starter plan if no subscription found
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      sp.name::TEXT,
      sp.code,
      sp.assistant_limit,
      sp.monthly_chat_limit,
      sp.team_member_limit,
      (SELECT COUNT(*) FROM assistants WHERE user_id = p_user_id),
      (
        SELECT COUNT(DISTINCT session_id)
        FROM chat_messages
        WHERE assistant_id IN (SELECT id FROM assistants WHERE user_id = p_user_id)
          AND role = 'user'
          AND created_at >= date_trunc('month', NOW())
      ),
      0::BIGINT,
      'none'::TEXT,
      NULL::TIMESTAMPTZ,
      sp.feature_flags
    FROM subscription_plans sp
    WHERE sp.code = 'starter'
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
