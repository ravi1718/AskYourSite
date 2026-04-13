import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { AssistantDetailClient } from "@/components/assistants/assistant-detail";

export default async function AssistantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();

  if (!supabase) redirect("/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve workspace context (team member → uses admin's userId)
  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const memberRole = workspace?.memberRole ?? "admin";

  // Fetch the assistant — RLS allows team members to select via policy
  const { data: assistant, error } = await supabase
    .from("assistants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !assistant) redirect("/dashboard/assistants");

  // Fetch related training sources (documents)
  const { data: sources } = await supabase
    .from("documents")
    .select("*")
    .eq("assistant_id", assistant.id)
    .order("created_at", { ascending: false });

  // Fetch plan feature flags (always based on workspace owner's plan)
  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: effectiveUserId } as any)
    .single();
  const featureFlags: Record<string, boolean> = {
    image_search: false,
    lead_capture: false,
    remove_branding: false,
    csv_export: false,
    ...((usageData as any)?.feature_flags || {}),
  };

  return (
    <div className="mx-auto max-w-6xl w-full animate-fade-up px-4">
      <AssistantDetailClient
        assistant={assistant}
        sources={sources || []}
        userId={effectiveUserId}
        imageSearchEnabled={featureFlags.image_search}
        featureFlags={featureFlags}
        memberRole={memberRole}
      />
    </div>
  );
}
