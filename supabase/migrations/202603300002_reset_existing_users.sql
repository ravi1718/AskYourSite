-- ============================================================
-- Reset existing users to 7-day trialing + elevate owner account
-- Run AFTER 202603300001_dodo_payments_pricing.sql
-- ============================================================

-- Reset ALL existing user subscriptions to 7-day trialing from today
UPDATE public.user_subscriptions
SET
  status               = 'trialing',
  current_period_start = timezone('utc', now()),
  current_period_end   = timezone('utc', now()) + interval '7 days',
  plan_id              = (SELECT id FROM public.subscription_plans WHERE code = 'starter'),
  dodo_customer_id     = NULL,
  dodo_subscription_id = NULL
WHERE user_id IN (
  SELECT id FROM auth.users
);

-- Elevate neeliravitej@gmail.com to Business plan, active (1-year period)
UPDATE public.user_subscriptions
SET
  status               = 'active',
  current_period_start = timezone('utc', now()),
  current_period_end   = timezone('utc', now()) + interval '1 year',
  plan_id              = (SELECT id FROM public.subscription_plans WHERE code = 'business')
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'neeliravitej@gmail.com'
);
