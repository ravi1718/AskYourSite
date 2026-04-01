import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();

  const featureFlags = (usageData as any)?.feature_flags ?? {};
  if (!featureFlags.csv_export) {
    return NextResponse.json({ error: "CSV export not available on your plan" }, { status: 403 });
  }

  const { data: leads, error } = await supabase
    .from("leads")
    .select("name, email, phone, created_at, assistants(name)")
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
