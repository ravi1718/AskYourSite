"use client";

import { useActionState } from "react";
import { createCheckoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle } from "lucide-react";

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  price_monthly_cents: number;
  features: string[] | string;
}

interface Props {
  plans: Plan[];
  currentPlanCode: string;
  isActive: boolean;
  isTrialing: boolean;
}

function PlanForm({
  plan,
  isCurrentPlan,
  isActive,
  isTrialing,
}: {
  plan: Plan;
  isCurrentPlan: boolean;
  isActive: boolean;
  isTrialing: boolean;
}) {
  const [state, action, pending] = useActionState(createCheckoutAction, null);
  const isPopular = plan.code === "pro";

  let features: string[] = [];
  if (Array.isArray(plan.features)) features = plan.features;
  else if (typeof plan.features === "string") {
    try { features = JSON.parse(plan.features); } catch { /* ignore */ }
  }

  return (
    <div
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
        <p className="mt-0.5 text-xs text-slate-600">+ taxes applicable</p>
      </div>

      <ul className="flex-1 mb-8 space-y-3">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex gap-3 text-sm text-slate-200 items-start">
            <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {state?.error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-300">{state.error}</p>
        </div>
      )}

      <form action={action}>
        <input type="hidden" name="planCode" value={plan.code} />
        <Button
          type="submit"
          disabled={(isCurrentPlan && isActive) || pending}
          className={`w-full font-semibold h-12 rounded-xl transition-all
            ${isCurrentPlan && isActive
              ? "opacity-50 cursor-default bg-surface border border-border text-slate-400"
              : isPopular
                ? "bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
                : "bg-white hover:bg-slate-100 text-ink"
            }`}
        >
          {pending
            ? "Processing..."
            : isCurrentPlan && isActive
              ? "Current Plan"
              : isTrialing
                ? `Subscribe to ${plan.name}`
                : `Switch to ${plan.name}`}
        </Button>
      </form>
    </div>
  );
}

export function BillingPlans({ plans, currentPlanCode, isActive, isTrialing }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <PlanForm
          key={plan.id}
          plan={plan}
          isCurrentPlan={currentPlanCode === plan.code}
          isActive={isActive}
          isTrialing={isTrialing}
        />
      ))}
    </div>
  );
}
