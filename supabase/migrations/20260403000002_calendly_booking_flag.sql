-- Add calendly_booking feature flag to pro and business plans
UPDATE public.subscription_plans
SET features = features || '{"calendly_booking": true}'::jsonb
WHERE code IN ('pro', 'business');
