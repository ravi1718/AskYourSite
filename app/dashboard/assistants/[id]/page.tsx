import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AssistantDetailClient } from "@/components/assistants/assistant-detail";

export default async function AssistantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect("/login");
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the assistant
  const { data: assistant, error } = await supabase
    .from("assistants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !assistant) {
    redirect("/dashboard/assistants");
  }

  // Fetch related training sources (documents)
  const { data: sources } = await supabase
    .from("documents")
    .select("*")
    .eq("assistant_id", assistant.id)
    .order("created_at", { ascending: false });

  // Fetch plan feature flags to enforce UI-level gating
  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();
  const imageSearchEnabled = (usageData as any)?.feature_flags?.image_search === true;

  return (
    <div className="mx-auto max-w-6xl w-full animate-fade-up px-4">
      <AssistantDetailClient
        assistant={assistant}
        sources={sources || []}
        userId={user.id}
        imageSearchEnabled={imageSearchEnabled}
      />
    </div>
  );
}
