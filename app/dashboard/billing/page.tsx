import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BillingPlans } from "./billing-plans";
import { AlertTriangle, Clock, Sparkles } from "lucide-react";

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
          Subscription &amp; Billing
        </h1>
        <p className="mt-3 text-slate-400">
          All plans include a 7-day free trial. Cancel anytime.
        </p>
      </header>

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

      <BillingPlans
        plans={plans ?? []}
        currentPlanCode={currentPlanCode}
        isActive={isActive}
        isTrialing={isTrialing}
      />

      <p className="mt-8 text-center text-xs text-slate-600">
        Secure payments powered by Dodo Payments · Cancel anytime · No hidden fees
      </p>
    </div>
  );
}
