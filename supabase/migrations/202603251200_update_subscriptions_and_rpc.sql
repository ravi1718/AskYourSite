-- Update Starter Plan Limits
UPDATE public.subscription_plans
SET assistant_limit = 1, monthly_chat_limit = 100
WHERE code = 'starter';

-- Update Pro Plan Limits
UPDATE public.subscription_plans
SET assistant_limit = 5, monthly_chat_limit = 1000
WHERE code = 'pro';

-- Update Business Plan Limits
UPDATE public.subscription_plans
SET assistant_limit = 999, monthly_chat_limit = 1000000
WHERE code = 'business';

-- Create RPC to get user usage statistics
CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id UUID)
RETURNS TABLE (
    plan_name text,
    plan_code public.subscription_tier,
    assistant_limit int,
    monthly_chat_limit int,
    assistants_count bigint,
    conversations_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_name text;
    v_plan_code public.subscription_tier;
    v_assistant_limit int;
    v_monthly_chat_limit int;
    v_assistants_count bigint;
    v_conversations_count bigint;
BEGIN
    -- Get active plan details
    SELECT sp.name, sp.code, sp.assistant_limit, sp.monthly_chat_limit
    INTO v_plan_name, v_plan_code, v_assistant_limit, v_monthly_chat_limit
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id AND us.status IN ('active', 'trialing')
    ORDER BY sp.price_monthly_cents DESC
    LIMIT 1;

    -- If no valid plan found, fallback to starter
    IF v_plan_code IS NULL THEN
        SELECT sp.name, sp.code, sp.assistant_limit, sp.monthly_chat_limit
        INTO v_plan_name, v_plan_code, v_assistant_limit, v_monthly_chat_limit
        FROM public.subscription_plans sp
        WHERE sp.code = 'starter' LIMIT 1;
    END IF;

    -- Count total assistants created by the user
    SELECT COUNT(id) INTO v_assistants_count
    FROM public.assistants
    WHERE user_id = p_user_id;

    -- Count monthly distinct conversations (sessions) with the user's assistants
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
        v_conversations_count;
END;
$$;
