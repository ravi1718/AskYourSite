import Link from "next/link";
import { Plus, Bot, Link as LinkIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";

export default async function AssistantsPage() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const isTeamMember = workspace?.isTeamMember ?? false;

  // Use admin client to fetch assistants by workspace owner ID
  // (team member's RLS session won't have the owner's row without admin bypass)
  const admin = getSupabaseAdminClient();
  const { data: assistants } = admin
    ? await admin
        .from("assistants")
        .select("*, documents(count)")
        .eq("user_id", effectiveUserId)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Fix stale "draft" status for assistants that already have training data
  if (admin && assistants) {
    const staleIds = assistants
      .filter((a: any) => a.status === "draft" && (a.documents?.[0]?.count ?? 0) > 0)
      .map((a: any) => a.id);
    if (staleIds.length > 0) {
      await admin.from("assistants").update({ status: "training" }).in("id", staleIds);
      staleIds.forEach((id: string) => {
        const a = assistants.find((x: any) => x.id === id);
        if (a) a.status = "training";
      });
    }
  }

  return (
    <div className="mx-auto max-w-6xl w-full animate-fade-up px-4">
      <header className="flex items-center justify-between py-6 border-b border-border mb-8">
        <div>
          <h1 className="text-3xl font-display font-semibold text-white tracking-tight">AI Assistants</h1>
          <p className="mt-2 text-sm text-slate-400">Manage and train your website agents.</p>
        </div>
        {!isTeamMember && (
          <Link href="/dashboard/assistants/new">
            <Button className="bg-white text-ink hover:bg-slate-200 gap-2 font-medium shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <Plus className="h-4 w-4" />
              Create Assistant
            </Button>
          </Link>
        )}
      </header>

      {(!assistants || assistants.length === 0) ? (
        <div className="flex flex-col items-center justify-center p-12 mt-10 border border-border bg-surface rounded-2xl shadow-card text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No assistants yet</h2>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            {isTeamMember
              ? "The workspace admin hasn't created any assistants yet."
              : "Create your first AI agent and train it on your website's data to start answering customer queries automatically."}
          </p>
          {!isTeamMember && (
            <Link href="/dashboard/assistants/new">
              <Button>Get Started</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {assistants.map((assistant: any) => {
            const docCount = assistant.documents?.[0]?.count ?? 0;
            const displayStatus = assistant.status === "draft" && docCount > 0 ? "training" : assistant.status;
            return (
            <Link key={assistant.id} href={`/dashboard/assistants/${assistant.id}`}>
              <div className="p-6 rounded-2xl border border-border bg-surface hover:border-primary/50 hover:shadow-glow transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${displayStatus === 'ready' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : displayStatus === 'training' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {displayStatus}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{assistant.name}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-2 mb-4">
                  <LinkIcon className="h-3 w-3" />
                  {assistant.website_url || "No URL provided"}
                </p>
                <div className="text-xs text-slate-500">
                  Created {new Date(assistant.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
