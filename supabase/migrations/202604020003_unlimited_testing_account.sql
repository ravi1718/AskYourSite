-- Override get_user_usage to give neeliravitej@gmail.com a NULL (unlimited) assistant limit.
-- NULL causes the TypeScript check `assistants_count >= assistant_limit` to evaluate false,
-- so the limit is never triggered for this account.
DROP FUNCTION IF EXISTS public.get_user_usage(uuid);
CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id UUID)
RETURNS TABLE (
    plan_name           text,
    plan_code           public.subscription_tier,
    assistant_limit     int,
    monthly_chat_limit  int,
    assistants_count    bigint,
    conversations_count bigint,
    subscription_status text,
    trial_ends_at       timestamptz,
    feature_flags       jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_name           text;
    v_plan_code           public.subscription_tier;
    v_assistant_limit     int;
    v_monthly_chat_limit  int;
    v_assistants_count    bigint;
    v_conversations_count bigint;
    v_subscription_status text;
    v_trial_ends_at       timestamptz;
    v_feature_flags       jsonb;
    v_user_email          text;
BEGIN
    -- Get active/trialing plan details
    SELECT sp.name, sp.code, sp.assistant_limit, sp.monthly_chat_limit,
           us.status, us.current_period_end, COALESCE(sp.feature_flags, '{}'::jsonb)
    INTO v_plan_name, v_plan_code, v_assistant_limit, v_monthly_chat_limit,
         v_subscription_status, v_trial_ends_at, v_feature_flags
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id AND us.status IN ('active', 'trialing')
    ORDER BY sp.price_monthly_cents DESC
    LIMIT 1;

    -- Fallback to starter if no valid plan
    IF v_plan_code IS NULL THEN
        SELECT sp.name, sp.code, sp.assistant_limit, sp.monthly_chat_limit,
               'trialing', timezone('utc', now()), COALESCE(sp.feature_flags, '{}'::jsonb)
        INTO v_plan_name, v_plan_code, v_assistant_limit, v_monthly_chat_limit,
             v_subscription_status, v_trial_ends_at, v_feature_flags
        FROM public.subscription_plans sp
        WHERE sp.code = 'starter' LIMIT 1;
    END IF;

    -- Testing account override: unlimited assistant creation
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id LIMIT 1;
    IF v_user_email = 'neeliravitej@gmail.com' THEN
        v_assistant_limit := NULL;
    END IF;

    -- Count assistants
    SELECT COUNT(id) INTO v_assistants_count
    FROM public.assistants
    WHERE user_id = p_user_id;

    -- Count monthly conversations
    SELECT COUNT(DISTINCT cm.session_id) INTO v_conversations_count
    FROM public.chat_messages cm
    JOIN public.assistants a ON cm.assistant_id = a.id
    WHERE a.user_id = p_user_id
      AND cm.role = 'user'
      AND date_trunc('month', cm.created_at) = date_trunc('month', timezone('utc', now()));

    RETURN QUERY SELECT
        v_plan_name,
        v_plan_code,
        v_assistant_limit,
        v_monthly_chat_limit,
        v_assistants_count,
        v_conversations_count,
        v_subscription_status,
        v_trial_ends_at,
        v_feature_flags;
END;
$$;
