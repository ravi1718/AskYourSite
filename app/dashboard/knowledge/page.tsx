import Link from "next/link";
import { redirect } from "next/navigation";
import { Library, FileText, Layers, ExternalLink } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function getKnowledgeData(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data: assistants } = await supabase
    .from("assistants")
    .select("id, name")
    .eq("user_id", userId);

  if (!assistants || assistants.length === 0) {
    return { totalSources: 0, totalDocuments: 0, totalChunks: 0, sources: [] };
  }

  const assistantIds = assistants.map((a) => a.id);
  const assistantMap = Object.fromEntries(assistants.map((a) => [a.id, a.name]));

  const [
    { data: trainingSources },
    { count: totalDocuments },
    { count: totalChunks },
  ] = await Promise.all([
    supabase
      .from("training_sources")
      .select("id, assistant_id, source_type, label, source_url, status, created_at")
      .in("assistant_id", assistantIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .in("assistant_id", assistantIds),
    supabase
      .from("embeddings")
      .select("id", { count: "exact", head: true })
      .in("assistant_id", assistantIds),
  ]);

  const sources = (trainingSources || []).map((s) => ({
    id: s.id,
    assistantId: s.assistant_id,
    assistantName: assistantMap[s.assistant_id] ?? "Unknown",
    type: s.source_type as "url" | "document" | "plain_text",
    label: s.label || s.source_url || "Untitled",
    sourceUrl: s.source_url,
    status: s.status as "pending" | "processing" | "ready" | "failed",
    createdAt: s.created_at,
  }));

  return {
    totalSources: sources.length,
    totalDocuments: totalDocuments ?? 0,
    totalChunks: totalChunks ?? 0,
    sources,
  };
}

const STATUS_STYLES: Record<string, string> = {
  ready: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  failed: "bg-ember/10 text-ember border-ember/20",
};

const TYPE_LABELS: Record<string, string> = {
  url: "URL",
  document: "Document",
  plain_text: "Text",
};

export default async function KnowledgePage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) redirect("/login");

  const data = await getKnowledgeData(user.id);

  return (
    <div className="mx-auto max-w-6xl w-full animate-fade-up">
      <header className="py-6 border-b border-border mb-8">
        <h1 className="text-3xl font-display font-semibold text-white tracking-tight">Knowledge Base</h1>
        <p className="mt-2 text-sm text-slate-400">
          All training sources across your assistants. Manage content from each assistant's settings.
        </p>
      </header>

      {/* Stats */}
      <section className="grid gap-6 md:grid-cols-3 mb-10">
        <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Library className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-white">Training Sources</h2>
          </div>
          <p className="text-4xl font-display font-bold text-white">{data?.totalSources ?? 0}</p>
          <p className="text-xs text-slate-500 mt-2">URLs, documents &amp; text blocks</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
              <FileText className="h-5 w-5 text-secondary" />
            </div>
            <h2 className="text-sm font-semibold text-white">Crawled Documents</h2>
          </div>
          <p className="text-4xl font-display font-bold text-white">{data?.totalDocuments ?? 0}</p>
          <p className="text-xs text-slate-500 mt-2">Pages successfully processed</p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Layers className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Trained Chunks</h2>
          </div>
          <p className="text-4xl font-display font-bold text-white">{data?.totalChunks ?? 0}</p>
          <p className="text-xs text-slate-500 mt-2">Searchable text segments</p>
        </div>
      </section>

      {/* Sources Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-white">All Sources</h3>
        </div>

        {!data || data.sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Library className="h-10 w-10 text-slate-600 mb-4" />
            <p className="text-base font-medium text-slate-400">No training sources yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Add sources from your{" "}
              <Link href="/dashboard/assistants" className="text-primary hover:underline">
                assistant settings
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assistant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.sources.map((source) => (
                  <tr key={source.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <span className="text-slate-300 truncate">{source.label}</span>
                        {source.sourceUrl && (
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:text-slate-400 shrink-0 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        {TYPE_LABELS[source.type] ?? source.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/assistants/${source.assistantId}`}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        {source.assistantName}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[source.status] ?? STATUS_STYLES.pending}`}>
                        {source.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(source.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
