import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const UNANSWERED_PATTERNS = [
  "i don't have",
  "i don't know",
  "no specific context",
  "i'm not sure",
  "i cannot find",
  "not available in",
  "no information",
];

async function getAllAlerts(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data: assistants } = await supabase
    .from("assistants")
    .select("id, name")
    .eq("user_id", userId);

  if (!assistants || assistants.length === 0) return [];

  const assistantIds = assistants.map((a) => a.id);
  const assistantMap = Object.fromEntries(assistants.map((a) => [a.id, a.name]));

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, content, assistant_id, created_at")
    .in("assistant_id", assistantIds)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1000);

  return (messages || [])
    .filter((msg) =>
      UNANSWERED_PATTERNS.some((p) => msg.content.toLowerCase().includes(p))
    )
    .map((msg) => ({
      id: msg.id,
      message: msg.content,
      assistantName: assistantMap[msg.assistant_id] ?? "Unknown",
      assistantId: msg.assistant_id,
      date: msg.created_at,
    }));
}

export default async function AlertsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) redirect("/login");

  const alerts = await getAllAlerts(user.id);

  return (
    <div className="mx-auto max-w-4xl w-full animate-fade-up">
      <header className="flex items-center gap-4 py-6 border-b border-border mb-8">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-display font-semibold text-white tracking-tight">Unanswered Queries</h1>
          <p className="mt-1 text-sm text-slate-400">
            Queries your assistant couldn't answer — add content to your knowledge base to fix these.
          </p>
        </div>
        {alerts.length > 0 && (
          <span className="bg-ember/10 text-ember text-sm px-3 py-1 rounded-full border border-ember/20 font-medium">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-border bg-surface">
          <HelpCircle className="h-10 w-10 text-slate-600 mb-4" />
          <p className="text-base font-medium text-slate-400">No unanswered queries</p>
          <p className="text-sm text-slate-500 mt-1">Your assistant is handling all questions well.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-2xl border border-border bg-surface shadow-card hover:border-border/80 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-ember shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {alert.message.length > 300
                      ? alert.message.substring(0, 300) + "..."
                      : alert.message}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Link
                      href={`/dashboard/assistants/${alert.assistantId}`}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      {alert.assistantName}
                    </Link>
                    <span className="text-slate-600 text-xs">·</span>
                    <span className="text-xs text-slate-500">
                      {new Date(alert.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
