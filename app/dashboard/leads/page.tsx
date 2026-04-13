import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { CSVExportButton } from "./csv-export-button";

export default async function LeadsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) redirect("/login");

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;

  // Check plan against workspace owner's usage
  const admin = getSupabaseAdminClient();
  const usageClient = admin ?? supabase;
  const { data: usageData } = await usageClient
    .rpc("get_user_usage", { p_user_id: effectiveUserId } as any)
    .single();

  const featureFlags = (usageData as any)?.feature_flags ?? {};
  if (!featureFlags.lead_capture) redirect("/dashboard");

  // Fetch leads for the workspace owner's assistants
  const { data: assistants } = admin
    ? await admin.from("assistants").select("id").eq("user_id", effectiveUserId)
    : await supabase.from("assistants").select("id").eq("user_id", effectiveUserId);

  const assistantIds = (assistants ?? []).map((a: any) => a.id);

  let leads: any[] = [];
  if (assistantIds.length > 0 && admin) {
    const { data } = await admin
      .from("leads")
      .select("id, name, email, phone, created_at, assistants(name)")
      .in("assistant_id", assistantIds)
      .order("created_at", { ascending: false })
      .limit(500);
    leads = data ?? [];
  }

  const csvExportEnabled = !!featureFlags.csv_export;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-slate-400 mt-1">{leads.length} captured leads</p>
        </div>
        {csvExportEnabled && <CSVExportButton />}
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
        {leads.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assistant</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead: any) => (
                <tr key={lead.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white">{lead.name || <span className="text-slate-500">—</span>}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.email}</td>
                  <td className="px-4 py-3 text-slate-300">{lead.phone || <span className="text-slate-500">—</span>}</td>
                  <td className="px-4 py-3 text-slate-300">{(lead.assistants as any)?.name || <span className="text-slate-500">—</span>}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-400 text-sm">No leads captured yet.</p>
            <p className="text-slate-500 text-xs mt-1">Enable lead capture on an assistant to start collecting contacts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
