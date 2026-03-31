"use server";

import { Webhooks } from "@dodopayments/nextjs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const PRODUCT_PLAN_MAP: Record<string, string> = {
  [process.env.DODO_PRODUCT_ID_STARTER ?? ""]: "starter",
  [process.env.DODO_PRODUCT_ID_PRO ?? ""]: "pro",
  [process.env.DODO_PRODUCT_ID_BUSINESS ?? ""]: "business",
};

async function activatePlan(
  userId: string,
  planCode: string,
  dodoCustomerId: string,
  dodoSubscriptionId: string,
  periodEnd: Date,
) {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const { data: planData } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("code", planCode)
    .single();

  if (!planData?.id) {
    console.error(`[dodo-webhook] Plan not found: ${planCode}`);
    return;
  }

  await admin
    .from("user_subscriptions")
    .update({
      plan_id: planData.id,
      status: "active",
      dodo_customer_id: dodoCustomerId,
      dodo_subscription_id: dodoSubscriptionId,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

async function downgradeToStarter(userId: string) {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const { data: starterPlan } = await admin
    .from("subscription_plans")
    .select("id")
    .eq("code", "starter")
    .single();

  if (!starterPlan?.id) return;

  await admin
    .from("user_subscriptions")
    .update({
      plan_id: starterPlan.id,
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,

  onSubscriptionActive: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) {
      console.error("[dodo-webhook] No userId in metadata for subscription.active");
      return;
    }
    const productId: string = data.product_id ?? "";
    const planCode = PRODUCT_PLAN_MAP[productId] ?? "starter";
    const periodEnd = data.next_billing_date
      ? new Date(data.next_billing_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await activatePlan(
      userId,
      planCode,
      data.customer?.customer_id ?? "",
      data.subscription_id ?? "",
      periodEnd,
    );
  },

  onSubscriptionRenewed: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    const productId: string = data.product_id ?? "";
    const planCode = PRODUCT_PLAN_MAP[productId] ?? "starter";
    const periodEnd = data.next_billing_date
      ? new Date(data.next_billing_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await activatePlan(
      userId,
      planCode,
      data.customer?.customer_id ?? "",
      data.subscription_id ?? "",
      periodEnd,
    );
  },

  onSubscriptionPlanChanged: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    const productId: string = data.product_id ?? "";
    const planCode = PRODUCT_PLAN_MAP[productId] ?? "starter";
    const periodEnd = data.next_billing_date
      ? new Date(data.next_billing_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await activatePlan(
      userId,
      planCode,
      data.customer?.customer_id ?? "",
      data.subscription_id ?? "",
      periodEnd,
    );
  },

  onSubscriptionCancelled: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    await downgradeToStarter(userId);
  },

  onSubscriptionExpired: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    await downgradeToStarter(userId);
  },

  onSubscriptionFailed: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    await downgradeToStarter(userId);
  },

  onPaymentSucceeded: async (payload) => {
    // Subscription payments are handled by onSubscriptionActive / onSubscriptionRenewed.
    // One-time payments don't change plan tier — log only.
    const data = payload.data as any;
    console.log("[dodo-webhook] payment.succeeded", data.payment_id);
  },

  onPaymentFailed: async (payload) => {
    const data = payload.data as any;
    console.error("[dodo-webhook] payment.failed", data.payment_id);
  },
});
