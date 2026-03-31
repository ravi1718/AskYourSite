import { Checkout } from "@dodopayments/nextjs";

export const POST = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  environment: process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode" | undefined,
  type: "session",
});
