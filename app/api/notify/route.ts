export async function POST(req: Request) {
  // TODO: persist email to DB or add to Resend audience
  const body = await req.json().catch(() => ({}));
  console.log("[notify] Early access request:", body?.email, "source:", body?.source);
  return Response.json({ ok: true });
}
