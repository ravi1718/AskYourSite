import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ArrowUpRight, ArrowDownRight, MessageSquare, TrendingUp, HelpCircle, Minus } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function getAnalytics(userId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  // Get user's assistant IDs
  const { data: assistants } = await supabase
    .from("assistants")
    .select("id")
    .eq("user_id", userId);

  const assistantIds = assistants?.map((a) => a.id) || [];

  if (assistantIds.length === 0) {
    return {
      totalConversations: 0,
      weeklyChange: 0,
      topQueries: [] as { question: string; count: number; bar: string }[],
      unansweredCount: 0,
      needsAttention: [] as { message: string; date: string }[],
      topProduct: null as string | null,
      topProductMentionRate: 0,
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Total conversations (distinct sessions)
  const { data: totalSessions } = await supabase
    .from("chat_messages")
    .select("session_id")
    .in("assistant_id", assistantIds);

  const uniqueSessions = new Set(totalSessions?.map((m) => m.session_id) || []);
  const totalConversations = uniqueSessions.size;

  // This week conversations
  const { data: thisWeekSessions } = await supabase
    .from("chat_messages")
    .select("session_id")
    .in("assistant_id", assistantIds)
    .gte("created_at", oneWeekAgo.toISOString());

  const thisWeekCount = new Set(thisWeekSessions?.map((m) => m.session_id) || []).size;

  // Last week conversations
  const { data: lastWeekSessions } = await supabase
    .from("chat_messages")
    .select("session_id")
    .in("assistant_id", assistantIds)
    .gte("created_at", twoWeeksAgo.toISOString())
    .lt("created_at", oneWeekAgo.toISOString());

  const lastWeekCount = new Set(lastWeekSessions?.map((m) => m.session_id) || []).size;

  const weeklyChange = lastWeekCount > 0
    ? ((thisWeekCount - lastWeekCount) / lastWeekCount * 100)
    : thisWeekCount > 0 ? 100 : 0;

  // Top user queries
  const { data: userMessages } = await supabase
    .from("chat_messages")
    .select("content")
    .in("assistant_id", assistantIds)
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(500);

  const queryCounts: Record<string, number> = {};
  (userMessages || []).forEach((msg) => {
    const trimmed = msg.content.trim();
    if (trimmed.length > 10) {
      queryCounts[trimmed] = (queryCounts[trimmed] || 0) + 1;
    }
  });

  const topQueries = Object.entries(queryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([q, count]) => ({ question: q, count }));

  const maxCount = topQueries.length > 0 ? topQueries[0].count : 1;
  const topQueriesWithBar = topQueries.map((q) => ({
    ...q,
    bar: `${Math.round((q.count / maxCount) * 100)}%`,
  }));

  // Detect top product/topic from user messages (simple word frequency of nouns > 4 chars)
  const allUserContent = (userMessages || []).map((m) => m.content).join(" ");
  const totalUserMsgs = (userMessages || []).length;
  const words = allUserContent.split(/\s+/).filter((w) => w.length > 4);
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set(["about", "would", "could", "should", "their", "there", "which", "where", "these", "those", "other", "after", "before", "between", "through", "during", "without", "please", "thanks", "thank", "hello", "website"]);
  words.forEach((w) => {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (lower.length > 4 && !stopWords.has(lower)) {
      wordFreq[lower] = (wordFreq[lower] || 0) + 1;
    }
  });
  const sortedWords = Object.entries(wordFreq).sort(([, a], [, b]) => b - a);
  const topProduct = sortedWords.length > 0 ? sortedWords[0][0] : null;
  const topProductMentionRate = topProduct && totalUserMsgs > 0
    ? Math.round((sortedWords[0][1] / totalUserMsgs) * 100)
    : 0;

  // Unanswered queries detection
  const unansweredPatterns = [
    "i don't have",
    "i don't know",
    "no specific context",
    "i'm not sure",
    "i cannot find",
    "not available in",
    "no information",
  ];

  const { data: assistantReplies } = await supabase
    .from("chat_messages")
    .select("content, session_id, created_at")
    .in("assistant_id", assistantIds)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(500);

  const unansweredCount = (assistantReplies || []).filter((msg) =>
    unansweredPatterns.some((p) => msg.content.toLowerCase().includes(p))
  ).length;

  // Needs attention items
  const needsAttention = (assistantReplies || [])
    .filter((msg) =>
      unansweredPatterns.some((p) => msg.content.toLowerCase().includes(p))
    )
    .slice(0, 3)
    .map((msg) => ({
      message: msg.content.substring(0, 120) + (msg.content.length > 120 ? "..." : ""),
      date: msg.created_at,
    }));

  return {
    totalConversations,
    weeklyChange: Math.round(weeklyChange * 10) / 10,
    topQueries: topQueriesWithBar,
    unansweredCount,
    needsAttention,
    topProduct,
    topProductMentionRate,
  };
}

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) {
    redirect("/login");
  }

  const analytics = await getAnalytics(user.id);

  const { data: usageData } = await supabase.rpc("get_user_usage", { p_user_id: user.id } as any).single();
  const usage = usageData as any;

  const totalConversations = analytics?.totalConversations ?? 0;
  const weeklyChange = analytics?.weeklyChange ?? 0;
  const topQueries = analytics?.topQueries ?? [];
  const unansweredCount = analytics?.unansweredCount ?? 0;
  const needsAttention = analytics?.needsAttention ?? [];
  const topProduct = analytics?.topProduct ?? null;
  const topProductMentionRate = analytics?.topProductMentionRate ?? 0;

  return (
    <div className="mx-auto max-w-6xl w-full animate-fade-up">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-6 border-b border-border mb-8">
        <div>
          <h1 className="text-3xl font-display font-semibold text-white tracking-tight">Customer Intelligence Insights</h1>
          <p className="mt-2 text-sm text-slate-400">
            Welcome back, {user.email ?? user.user_metadata.full_name ?? "workspace user"}
          </p>
        </div>
        <div className="flex items-center gap-4">
           <SignOutButton />
           <Link href="/dashboard/assistants/new">
             <Button className="bg-white text-ink hover:bg-slate-200 gap-2 font-medium shadow-[0_0_15px_rgba(255,255,255,0.2)]">
               <Plus className="h-4 w-4" />
               Create AI Assistant
             </Button>
           </Link>
        </div>
      </header>

      {/* Plan & Usage Banner */}
      {usage && (
        <div className="mb-8 p-6 rounded-2xl border border-border bg-surface shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs uppercase tracking-wider border border-primary/30">
                {usage.plan_name} Plan
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              You are currently on the {usage.plan_name} plan.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 w-full sm:w-auto">
            <div className="flex gap-8">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-medium">Assistants</span>
                <span className="text-xl font-display font-semibold text-white">
                  {usage.assistants_count} <span className="text-slate-500 text-sm font-normal">/ {usage.assistant_limit > 900 ? "Unlimited" : usage.assistant_limit}</span>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-medium">Conversations</span>
                <span className="text-xl font-display font-semibold text-white">
                  {usage.conversations_count} <span className="text-slate-500 text-sm font-normal">/ {usage.monthly_chat_limit > 900000 ? "Unlimited" : usage.monthly_chat_limit}</span>
                </span>
              </div>
            </div>
            {usage.plan_code !== 'business' && (
              <Link href="/dashboard/billing">
                <Button variant="ghost" className="border border-primary/50 text-primary hover:bg-primary/10 whitespace-nowrap shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                  Upgrade Plan
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <section className="grid gap-6 md:grid-cols-3 mb-10">
         <div className="p-6 rounded-2xl border border-border bg-surface shadow-card hover:border-primary/50 hover:shadow-glow transition-all">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
               <MessageSquare className="h-5 w-5 text-primary" />
             </div>
             <h2 className="text-sm font-semibold text-white">Total Conversations</h2>
           </div>
           <p className="text-4xl font-display font-bold text-white mb-2">
             {totalConversations.toLocaleString()}
           </p>
           {weeklyChange !== 0 ? (
             <p className={`text-xs flex items-center gap-1 font-medium ${weeklyChange > 0 ? 'text-primary' : 'text-ember'}`}>
               {weeklyChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
               {weeklyChange > 0 ? '+' : ''}{weeklyChange}% from last week
             </p>
           ) : (
             <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
               <Minus className="h-3 w-3" /> No change from last week
             </p>
           )}
         </div>

         <div className="p-6 rounded-2xl border border-border bg-surface shadow-card hover:border-secondary/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
               <TrendingUp className="h-5 w-5 text-secondary" />
             </div>
             <h2 className="text-sm font-semibold text-white">Top Product Interest</h2>
           </div>
           <p className="text-2xl font-display font-bold text-white mb-2 truncate">
             {topProduct ? topProduct.charAt(0).toUpperCase() + topProduct.slice(1) : "—"}
           </p>
           <p className="text-xs text-secondary flex items-center gap-1 font-medium">
             {topProduct ? `Mentioned in ${topProductMentionRate}% of chats` : "No chat data yet"}
           </p>
         </div>

         <div className="p-6 rounded-2xl border border-border bg-surface shadow-card hover:border-ember/50 transition-all">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 rounded-lg bg-ember/10 border border-ember/20">
               <HelpCircle className="h-5 w-5 text-ember" />
             </div>
             <h2 className="text-sm font-semibold text-white">Unanswered Queries</h2>
           </div>
           <p className="text-4xl font-display font-bold text-white mb-2">{unansweredCount}</p>
           <p className="text-xs text-ember flex items-center gap-1 font-medium cursor-pointer hover:underline">
             {unansweredCount > 0 ? "Requires knowledge base update" : "All queries answered"}
           </p>
         </div>
      </section>

      {/* Detailed Insights Area */}
      <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
         {/* Most Common Questions */}
         <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
           <h3 className="text-lg font-semibold text-white mb-6">Most Common Questions</h3>
           {topQueries.length > 0 ? (
             <div className="space-y-4">
               {topQueries.map((item, i) => (
                 <div key={i} className="flex flex-col gap-2">
                   <div className="flex justify-between text-sm">
                     <span className="text-slate-300 truncate pr-4">{item.question}</span>
                     <span className="text-slate-500 font-medium whitespace-nowrap">{item.count} {item.count === 1 ? 'query' : 'queries'}</span>
                   </div>
                   <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" style={{ width: item.bar }} />
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-12 text-center">
               <MessageSquare className="h-8 w-8 text-slate-600 mb-3" />
               <p className="text-sm text-slate-500">No conversations yet</p>
               <p className="text-xs text-slate-600 mt-1">Questions from your chatbot users will appear here</p>
             </div>
           )}
         </div>

         {/* Needs Attention */}
         <div className="p-6 rounded-2xl border border-border bg-surface shadow-card">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-semibold text-white">Needs Attention</h3>
             {unansweredCount > 0 && (
               <span className="bg-ember/10 text-ember text-xs px-2 py-0.5 rounded border border-ember/20">
                 {unansweredCount} New
               </span>
             )}
           </div>
           {needsAttention.length > 0 ? (
             <div className="space-y-4">
               {needsAttention.map((alert, i) => (
                 <div key={i} className="flex gap-3 p-3 rounded-lg border border-border/50 bg-background/50 text-sm text-slate-300 hover:border-border transition-colors cursor-pointer">
                   <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-ember shrink-0" />
                   <p className="leading-snug">{alert.message}</p>
                 </div>
               ))}
               <Link href="/dashboard/alerts">
                 <Button variant="ghost" className="w-full mt-2 text-xs text-primary hover:text-white hover:bg-primary/10">View all alerts</Button>
               </Link>
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-12 text-center">
               <HelpCircle className="h-8 w-8 text-slate-600 mb-3" />
               <p className="text-sm text-slate-500">No alerts</p>
               <p className="text-xs text-slate-600 mt-1">Unanswered queries will appear here</p>
             </div>
           )}
         </div>
      </section>
    </div>
  );
}
