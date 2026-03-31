import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, Clock, Sparkles } from "lucide-react";

function daysLeft(end: string | null): number {
  if (!end) return 0;
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000));
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const params = await searchParams;
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) redirect("/login");

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .order("price_monthly_cents", { ascending: true });

  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();

  const usage = usageData as any;
  const currentPlanCode: string    = usage?.plan_code           ?? "starter";
  const subscriptionStatus: string = usage?.subscription_status ?? "trialing";
  const trialEndsAt: string | null = usage?.trial_ends_at       ?? null;
  const isTrialing  = subscriptionStatus === "trialing";
  const isActive    = subscriptionStatus === "active";
  const trialDays   = isTrialing ? daysLeft(trialEndsAt) : 0;
  const trialExpired = params.expired === "1" || (isTrialing && trialDays === 0);

  // Dodo customer ID for the "Manage Subscription" portal link
  const { data: subRow } = await supabase
    .from("user_subscriptions")
    .select("dodo_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const dodoCustomerId = (subRow as any)?.dodo_customer_id as string | null;

  return (
    <div className="mx-auto max-w-5xl w-full animate-fade-up pt-8">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-display font-semibold text-white tracking-tight">
          Subscription & Billing
        </h1>
        <p className="mt-3 text-slate-400">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </header>

      {/* ── Status banners ── */}
      {trialExpired && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-300">Your free trial has ended.</p>
            <p className="text-sm text-slate-400 mt-0.5">
              Choose a plan below to keep full access to AskYourSite.
            </p>
          </div>
        </div>
      )}

      {isTrialing && !trialExpired && (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <Clock className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-300">
              {trialDays === 1 ? "1 day left" : `${trialDays} days left`} in your free trial.
            </p>
            <p className="text-sm text-slate-400 mt-0.5">
              Subscribe before your trial ends to avoid any interruption.
            </p>
          </div>
        </div>
      )}

      {isActive && (
        <div className="mb-8 flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-emerald-300">
              You&apos;re on the <span className="capitalize">{currentPlanCode}</span> plan — subscription active.
            </p>
          </div>
          {dodoCustomerId && (
            <a
              href={`/customer-portal?customer_id=${dodoCustomerId}`}
              className="text-sm font-medium text-emerald-300 underline underline-offset-2 hover:text-white transition-colors"
            >
              Manage subscription →
            </a>
          )}
        </div>
      )}

      {/* ── Plan cards ── */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map((plan: any) => {
          const isCurrentPlan = currentPlanCode === plan.code;
          const isPopular = plan.code === "pro";

          let features: string[] = [];
          if (Array.isArray(plan.features)) features = plan.features;
          else if (typeof plan.features === "string") {
            try { features = JSON.parse(plan.features); } catch { /* ignore */ }
          }

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col p-7 rounded-3xl border backdrop-blur-sm transition-all
                ${isPopular
                  ? "border-primary/50 bg-gradient-to-b from-primary/10 to-transparent shadow-[0_0_30px_rgba(139,92,246,0.15)]"
                  : "border-border/60 bg-surface/80 hover:border-slate-500"
                }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  Most Popular
                </span>
              )}
              {isCurrentPlan && isActive && (
                <span className="absolute -top-3 right-6 px-3 py-1 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                  Current
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white uppercase tracking-wide">{plan.name}</h3>
                <p className="text-sm text-slate-400 mt-1 min-h-[36px]">{plan.description}</p>
                <div className="mt-5 flex items-baseline gap-1 font-display font-bold text-white">
                  <span className="text-4xl">${(plan.price_monthly_cents / 100).toFixed(0)}</span>
                  <span className="text-sm font-medium text-slate-500">/mo</span>
                </div>
              </div>

              <ul className="flex-1 mb-8 space-y-3">
                {features.map((f: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-200 items-start">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <form action={createCheckoutAction as any}>
                <input type="hidden" name="planCode" value={plan.code} />
                <Button
                  type="submit"
                  disabled={isCurrentPlan && isActive}
                  className={`w-full font-semibold h-12 rounded-xl transition-all
                    ${isCurrentPlan && isActive
                      ? "opacity-50 cursor-default bg-surface border border-border text-slate-400"
                      : isPopular
                        ? "bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
                        : "bg-white hover:bg-slate-100 text-ink"
                    }`}
                >
                  {isCurrentPlan && isActive
                    ? "Current Plan"
                    : isTrialing
                      ? `Subscribe to ${plan.name}`
                      : `Switch to ${plan.name}`}
                </Button>
              </form>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-600">
        Secure payments powered by Dodo Payments · Cancel anytime · No hidden fees
      </p>
    </div>
  );
}
