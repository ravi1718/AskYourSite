-- Update Starter price from $29 to $20
-- Update Business training copy from "Unlimited" to "~500 pages"
UPDATE public.subscription_plans SET
  price_monthly_cents = 2000
WHERE code = 'starter';

UPDATE public.subscription_plans SET
  features = '["10 chatbots","5,000 conversations / mo","~500 pages training","Image-based product search","Advanced analytics + insights","Lead capture + CSV export","Custom AI persona & tone","Priority support + onboarding","API access (coming soon)"]'::jsonb
WHERE code = 'business';
