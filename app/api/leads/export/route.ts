import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const admin = getSupabaseAdminClient();

  const { data: usageData } = await (admin ?? supabase)
    .rpc("get_user_usage", { p_user_id: effectiveUserId } as any)
    .single();

  const featureFlags = (usageData as any)?.feature_flags ?? {};
  if (!featureFlags.csv_export) {
    return NextResponse.json({ error: "CSV export not available on your plan" }, { status: 403 });
  }

  // Fetch leads for the workspace owner's assistants
  const { data: assistants } = await (admin ?? supabase)
    .from("assistants")
    .select("id")
    .eq("user_id", effectiveUserId);

  const assistantIds = (assistants ?? []).map((a: { id: string }) => a.id);

  const { data: leads, error } = await (admin ?? supabase)
    .from("leads")
    .select("name, email, phone, created_at, assistants(name)")
    .in("assistant_id", assistantIds.length > 0 ? assistantIds : [""])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }

  const rows = (leads ?? []).map((lead: any) => [
    lead.name ?? "",
    lead.email,
    lead.phone ?? "",
    (lead.assistants as any)?.name ?? "",
    new Date(lead.created_at).toISOString(),
  ]);

  const csvLines = [
    "Name,Email,Phone,Assistant,Date",
    ...rows.map((r) => r.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ];

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csvLines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
    },
  });
}
