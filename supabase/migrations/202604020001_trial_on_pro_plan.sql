-- Change new-user trial from Starter to Pro
-- All new signups now get a 7-day Pro trial instead of Starter.
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

  -- 7-day free trial on the Pro plan, no credit card required
  INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  SELECT
    new.id,
    subscription_plans.id,
    'trialing',
    timezone('utc', now()),
    timezone('utc', now()) + interval '7 days'
  FROM public.subscription_plans
  WHERE subscription_plans.code = 'pro'
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;
