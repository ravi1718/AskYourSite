"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PLAN_PRODUCT_MAP: Record<string, string> = {
  starter:  process.env.DODO_PRODUCT_ID_STARTER  ?? "",
  pro:      process.env.DODO_PRODUCT_ID_PRO      ?? "",
  business: process.env.DODO_PRODUCT_ID_BUSINESS ?? "",
};

export async function createCheckoutAction(formData: FormData) {
  const planCode = formData.get("planCode") as string;

  if (!planCode || !["starter", "pro", "business"].includes(planCode)) {
    throw new Error("Invalid plan selected");
  }

  const productId = PLAN_PRODUCT_MAP[planCode];
  if (!productId) {
    throw new Error(
      `Product ID for plan "${planCode}" is not configured. ` +
      `Set DODO_PRODUCT_ID_${planCode.toUpperCase()} in your environment variables.`,
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) {
    redirect("/login");
  }

  // Build checkout session body — userId in metadata lets the webhook identify the user
  const body = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    metadata: {
      userId: user.id,
      planCode,
    },
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const checkoutRes = await fetch(`${appUrl}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!checkoutRes.ok) {
    const text = await checkoutRes.text();
    throw new Error(`Checkout session creation failed: ${text}`);
  }

  const { checkout_url } = (await checkoutRes.json()) as { checkout_url: string };
  redirect(checkout_url);
}
