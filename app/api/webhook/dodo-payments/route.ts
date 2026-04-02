"use server";

import { Webhooks } from "@dodopayments/nextjs";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { getUserInfo } from "@/lib/email/get-user-info";
import {
  subscriptionActivatedEmail,
  subscriptionRenewedEmail,
  subscriptionCancelledEmail,
  paymentFailedEmail,
} from "@/lib/email/templates";

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

    await activatePlan(userId, planCode, data.customer?.customer_id ?? "", data.subscription_id ?? "", periodEnd);

    const user = await getUserInfo(userId);
    if (user) {
      const planName = planCode.charAt(0).toUpperCase() + planCode.slice(1);
      const nextDate = periodEnd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      await sendEmail(user.email, `Your ${planName} plan is now active 🎉`, subscriptionActivatedEmail(user.name, planName, nextDate));
    }
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

    await activatePlan(userId, planCode, data.customer?.customer_id ?? "", data.subscription_id ?? "", periodEnd);

    const user = await getUserInfo(userId);
    if (user) {
      const planName = planCode.charAt(0).toUpperCase() + planCode.slice(1);
      const nextDate = periodEnd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      await sendEmail(user.email, "AskYourSite subscription renewed", subscriptionRenewedEmail(user.name, planName, nextDate));
    }
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

    await activatePlan(userId, planCode, data.customer?.customer_id ?? "", data.subscription_id ?? "", periodEnd);

    const user = await getUserInfo(userId);
    if (user) {
      const planName = planCode.charAt(0).toUpperCase() + planCode.slice(1);
      const nextDate = periodEnd.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      await sendEmail(user.email, `Plan updated: you're now on ${planName}`, subscriptionActivatedEmail(user.name, planName, nextDate));
    }
  },

  onSubscriptionCancelled: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    await downgradeToStarter(userId);
    const user = await getUserInfo(userId);
    if (user) await sendEmail(user.email, "Your AskYourSite subscription has been cancelled", subscriptionCancelledEmail(user.name));
  },

  onSubscriptionExpired: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    await downgradeToStarter(userId);
    const user = await getUserInfo(userId);
    if (user) await sendEmail(user.email, "Your AskYourSite subscription has expired", subscriptionCancelledEmail(user.name));
  },

  onSubscriptionFailed: async (payload) => {
    const data = payload.data as any;
    const userId = data.metadata?.userId as string | undefined;
    if (!userId) return;
    await downgradeToStarter(userId);
    const productId: string = data.product_id ?? "";
    const planCode = PRODUCT_PLAN_MAP[productId] ?? "starter";
    const planName = planCode.charAt(0).toUpperCase() + planCode.slice(1);
    const user = await getUserInfo(userId);
    if (user) await sendEmail(user.email, "Action required: payment failed", paymentFailedEmail(user.name, planName));
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
