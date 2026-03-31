-- Sync Starter Plan
UPDATE public.subscription_plans
SET 
  price_monthly_cents = 0,
  features = '["100 chats/mo", "Website Indexing"]'::jsonb
WHERE code = 'starter';

-- Sync Pro Plan
UPDATE public.subscription_plans
SET 
  price_monthly_cents = 4900,
  features = '["1,000 chats/mo", "Website Indexing", "Custom Branding"]'::jsonb
WHERE code = 'pro';

-- Sync Business Plan
UPDATE public.subscription_plans
SET 
  price_monthly_cents = 19900,
  features = '["Unlimited chats", "Website Indexing", "Custom Branding", "Dedicated API Access"]'::jsonb
WHERE code = 'business';

-- Revert all users to Free (Starter) plan
UPDATE public.user_subscriptions
SET 
  plan_id = (SELECT id FROM public.subscription_plans WHERE code = 'starter'),
  status = 'active'
WHERE status IN ('active', 'trialing');
