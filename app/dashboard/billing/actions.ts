"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const PLAN_PRODUCT_MAP: Record<string, string> = {
  starter:  process.env.DODO_PRODUCT_ID_STARTER  ?? "",
  pro:      process.env.DODO_PRODUCT_ID_PRO      ?? "",
  business: process.env.DODO_PRODUCT_ID_BUSINESS ?? "",
};

export async function createCheckoutAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const planCode = formData.get("planCode") as string;

  if (!planCode || !["starter", "pro", "business"].includes(planCode)) {
    return { error: "Invalid plan selected." };
  }

  const productId = PLAN_PRODUCT_MAP[planCode];
  if (!productId) {
    return { error: `Product ID for plan "${planCode}" is not configured.` };
  }

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) {
    redirect("/login");
  }

  const body = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    metadata: { userId: user.id, planCode },
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  try {
    const checkoutRes = await fetch(`${appUrl}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!checkoutRes.ok) {
      const text = await checkoutRes.text();
      // 403 = merchant account not yet approved for live payments
      if (checkoutRes.status === 403 || text.includes("Live payments not enabled")) {
        return {
          error:
            "Live payments will be enabled soon till then enjoy your free Trial!",
        };
      }
      return { error: `Payment provider error: ${text}` };
    }

    const { checkout_url } = (await checkoutRes.json()) as { checkout_url: string };
    redirect(checkout_url);
  } catch (err: any) {
    // redirect() throws internally — let it propagate
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
    return { error: "Something went wrong. Please try again." };
  }

}
