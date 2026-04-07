import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import OverridesClient from "./overrides-client";

export default async function OverridesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assistantId } = await params;
  const supabase = await getSupabaseServerClient();

  if (!supabase) redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership
  const { data: assistant, error } = await supabase
    .from("assistants")
    .select("id, name")
    .eq("id", assistantId)
    .eq("user_id", user.id)
    .single();

  if (error || !assistant) redirect("/dashboard/assistants");

  const { data: overrides } = await supabase
    .from("response_overrides")
    .select("id, trigger_phrase, override_response, is_active, created_at")
    .eq("assistant_id", assistantId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl w-full animate-fade-up px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/assistants/${assistantId}`}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {assistant.name}
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Response Rules</h1>
        <p className="text-sm text-slate-400 mt-1">
          Pin exact answers to specific questions. When a visitor&apos;s message contains the
          trigger phrase, the AI will respond with your exact text — no hallucinations.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
        <strong className="font-semibold">How it works:</strong> The trigger phrase is matched
        case-insensitively anywhere in the user&apos;s message. The AI will respond with exactly the
        text you provide — nothing more, nothing less. Use this for refund policies, pricing,
        contact info, or any question where the exact wording matters.
      </div>

      <OverridesClient assistantId={assistantId} initialOverrides={overrides ?? []} />
    </div>
  );
}
