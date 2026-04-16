import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { UserRound } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getWorkspaceContext } from "@/lib/workspace";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { PageTransition } from "@/components/page-transition";
import { InactivityGuard } from "@/components/inactivity-guard";
import { SignupTracker } from "@/components/signup-tracker";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

function daysLeft(end: string | null): number {
  if (!end) return 0;
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86_400_000));
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user || !supabase) redirect("/login");

  // Resolve workspace context (handles team members transparently via DB query)
  const workspace = await getWorkspaceContext();
  const effectiveUserId = workspace?.effectiveUserId ?? user.id;
  const isTeamMember = workspace?.isTeamMember ?? false;
  const isPersonalOverride = workspace?.isPersonalOverride ?? false;
  const memberRole = workspace?.memberRole ?? "admin";
  // Known team member = currently in team mode OR has overridden to personal
  const isKnownTeamMember = isTeamMember || isPersonalOverride;
  const teamWorkspaceOwnerId = workspace?.teamWorkspaceOwnerId ?? null;

  // Fetch workspace owner's profile name for the team banner
  let workspaceOwnerName: string | null = null;
  if (isKnownTeamMember && teamWorkspaceOwnerId) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", teamWorkspaceOwnerId)
        .maybeSingle();
      workspaceOwnerName = (ownerProfile as any)?.company_name || (ownerProfile as any)?.full_name || "Team Workspace";
    }
  }

  // Usage is always based on the workspace owner's plan
  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: effectiveUserId } as any)
    .single();

  const usage = usageData as any;
  const featureFlags: Record<string, boolean> = { lead_capture: false, ...(usage?.feature_flags || {}) };
  const subscriptionStatus: string = usage?.subscription_status ?? "trialing";
  const trialEndsAt: string | null = usage?.trial_ends_at       ?? null;
  const planCode: string = usage?.plan_code ?? "starter";
  const isTrialing = subscriptionStatus === "trialing";
  const trialDays  = isTrialing ? daysLeft(trialEndsAt) : 0;
  const hasTeamAccess = planCode === "pro" || planCode === "business";
  const hasHandoffAccess = featureFlags.human_handoff === true;

  // Fetch waiting handoff count for inbox badge (Business plan only)
  let waitingHandoffCount = 0;
  if (hasHandoffAccess) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data: assistantIds } = await admin
        .from("assistants")
        .select("id")
        .eq("user_id", effectiveUserId);
      if (assistantIds && assistantIds.length > 0) {
        const { count } = await admin
          .from("handoff_sessions")
          .select("id", { count: "exact", head: true })
          .in("assistant_id", assistantIds.map((a: any) => a.id))
          .eq("status", "waiting");
        waitingHandoffCount = count ?? 0;
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-text">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-surface flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Image src="/logo.png" alt="AskYourSite" width={40} height={40} className="rounded-lg" />
            <span className="font-display font-bold text-lg text-white tracking-tight">AskYourSite</span>
          </Link>
        </div>

        {/* Team member workspace banner */}
        {isKnownTeamMember && workspaceOwnerName && (
          <div className="mx-4 mt-4 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <UserRound className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                {isPersonalOverride ? (
                  <>
                    <p className="text-[10px] text-slate-500 leading-tight">Your personal workspace</p>
                    <p className="text-xs font-medium text-white truncate">Admin</p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-slate-500 leading-tight">Working in</p>
                    <p className="text-xs font-medium text-white truncate">{workspaceOwnerName}</p>
                    <p className="text-[10px] capitalize text-primary">{memberRole}</p>
                  </>
                )}
                <WorkspaceSwitcher
                  currentMode={isPersonalOverride ? "personal" : "team"}
                  ownerName={workspaceOwnerName}
                />
              </div>
            </div>
          </div>
        )}

        <SidebarNav
          featureFlags={featureFlags}
          hasTeamAccess={hasTeamAccess}
          hasHandoffAccess={hasHandoffAccess}
          waitingHandoffCount={waitingHandoffCount}
          isTeamMember={isTeamMember}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <InactivityGuard />
        {/* Trial countdown banner — only show to workspace owner */}
        {!isTeamMember && isTrialing && trialDays > 0 && (
          <TrialBanner daysLeft={trialDays} />
        )}

        <main className="flex-1 overflow-y-auto w-full p-4 md:p-8">
          <Suspense fallback={null}>
            <SignupTracker />
          </Suspense>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
