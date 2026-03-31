-- ============================================================
-- Dodo Payments integration + pricing update + feature flags
-- ============================================================

-- 1. Add Dodo tracking columns to user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS dodo_customer_id text,
  ADD COLUMN IF NOT EXISTS dodo_subscription_id text;

-- 2. Add feature_flags column to subscription_plans
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT '{}'::jsonb;

-- 3. Update plan limits, prices, and feature flags
UPDATE public.subscription_plans SET
  price_monthly_cents  = 2900,
  assistant_limit      = 1,
  monthly_chat_limit   = 200,
  training_source_limit = 50,
  name        = 'Starter',
  description = 'Perfect to get started. Full access for 7 days free.',
  features    = '["1 chatbot","200 conversations / mo","~50 pages training","Basic widget customization","Unanswered question queue","Analytics dashboard"]'::jsonb,
  feature_flags = '{"analytics":true,"image_search":false,"lead_capture":false,"remove_branding":false,"csv_export":false,"custom_persona":false}'::jsonb
WHERE code = 'starter';

UPDATE public.subscription_plans SET
  price_monthly_cents  = 6900,
  assistant_limit      = 3,
  monthly_chat_limit   = 1000,
  training_source_limit = 200,
  name        = 'Pro',
  description = 'For growing businesses that need more power.',
  features    = '["3 chatbots","1,000 conversations / mo","~200 pages training","Full widget customization","Analytics dashboard","Lead capture in chat","Remove \"Powered by\" branding","Email support","Image-based product search"]'::jsonb,
  feature_flags = '{"analytics":true,"image_search":true,"lead_capture":true,"remove_branding":true,"csv_export":false,"custom_persona":false}'::jsonb
WHERE code = 'pro';

UPDATE public.subscription_plans SET
  price_monthly_cents  = 14900,
  assistant_limit      = 10,
  monthly_chat_limit   = 5000,
  training_source_limit = 999999,
  name        = 'Business',
  description = 'For teams that need scale, insights, and custom AI.',
  features    = '["10 chatbots","5,000 conversations / mo","Unlimited URL + doc training","Image-based product search","Advanced analytics + insights","Lead capture + CSV export","Custom AI persona & tone","Priority support + onboarding","API access (coming soon)"]'::jsonb,
  feature_flags = '{"analytics":true,"image_search":true,"lead_capture":true,"remove_branding":true,"csv_export":true,"custom_persona":true}'::jsonb
WHERE code = 'business';

-- 4. Update new-user trigger to give 7-day trial (was 14 days)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  -- 7-day free trial on the Starter plan, no credit card required
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  SELECT
    new.id,
    subscription_plans.id,
    'trialing',
    timezone('utc', now()),
    timezone('utc', now()) + interval '7 days'
  FROM public.subscription_plans
  WHERE subscription_plans.code = 'starter'
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- 5. Update get_user_usage() RPC to also return subscription status, trial end, and feature_flags
-- Must drop first because the return type is changing (added feature_flags column)
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
