import { notFound } from "next/navigation";
import { LiveChatClient } from "./LiveChatClient";

export const dynamic = "force-dynamic";

async function getHandoffData(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/handoff/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function LiveChatPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getHandoffData(token);

  if (!data?.handoff) {
    notFound();
  }

  return (
    <LiveChatClient
      handoff={data.handoff}
      initialMessages={data.messages ?? []}
      token={token}
    />
  );
}
