import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Admin client not initialized" }, { status: 500 });
    }

    // Get user's assistant IDs
    const { data: assistants } = await supabase
      .from("assistants")
      .select("id")
      .eq("user_id", userId);

    const assistantIds = assistants?.map((a) => a.id) || [];

    if (assistantIds.length === 0) {
      return NextResponse.json({
        totalConversations: 0,
        weeklyChange: 0,
        topQueries: [],
        unansweredCount: 0,
        needsAttention: [],
      });
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

    // Weekly change percentage
    const weeklyChange = lastWeekCount > 0
      ? ((thisWeekCount - lastWeekCount) / lastWeekCount * 100)
      : thisWeekCount > 0 ? 100 : 0;

    // Top user queries (most frequent user messages)
    const { data: userMessages } = await supabase
      .from("chat_messages")
      .select("content")
      .in("assistant_id", assistantIds)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(500);

    // Group and count queries
    const queryCounts: Record<string, number> = {};
    (userMessages || []).forEach((msg) => {
      const normalized = msg.content.trim().toLowerCase();
      if (normalized.length > 10) { // Skip very short messages
        queryCounts[msg.content.trim()] = (queryCounts[msg.content.trim()] || 0) + 1;
      }
    });

    const topQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([q, count]) => ({ question: q, count }));

    // Calculate max count for bar widths
    const maxCount = topQueries.length > 0 ? topQueries[0].count : 1;
    const topQueriesWithBar = topQueries.map((q) => ({
      ...q,
      bar: `${Math.round((q.count / maxCount) * 100)}%`,
    }));

    // Unanswered / low-confidence replies
    const { data: assistantReplies } = await supabase
      .from("chat_messages")
      .select("content")
      .in("assistant_id", assistantIds)
      .eq("role", "assistant")
      .limit(500);

    const unansweredPatterns = [
      "i don't have",
      "i don't know",
      "no specific context",
      "i'm not sure",
      "i cannot find",
      "not available in",
      "no information",
    ];

    const unansweredCount = (assistantReplies || []).filter((msg) =>
      unansweredPatterns.some((p) => msg.content.toLowerCase().includes(p))
    ).length;

    // Needs attention items — recent unanswered interactions
    const { data: recentMessages } = await supabase
      .from("chat_messages")
      .select("content, session_id, created_at")
      .in("assistant_id", assistantIds)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(100);

    const needsAttention = (recentMessages || [])
      .filter((msg) =>
        unansweredPatterns.some((p) => msg.content.toLowerCase().includes(p))
      )
      .slice(0, 5)
      .map((msg) => ({
        message: msg.content.substring(0, 120) + (msg.content.length > 120 ? "..." : ""),
        date: msg.created_at,
      }));

    return NextResponse.json({
      totalConversations,
      weeklyChange: Math.round(weeklyChange * 10) / 10,
      topQueries: topQueriesWithBar,
      unansweredCount,
      needsAttention,
    });
  } catch (error: any) {
    console.error("[Analytics] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
