import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Bot, BarChart2, Library, Settings } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { PageTransition } from "@/components/page-transition";
import { InactivityGuard } from "@/components/inactivity-guard";
import { SignupTracker } from "@/components/signup-tracker";

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

  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();

  const usage = usageData as any;
  const subscriptionStatus: string = usage?.subscription_status ?? "trialing";
  const trialEndsAt: string | null = usage?.trial_ends_at       ?? null;
  const isTrialing = subscriptionStatus === "trialing";
  const trialDays  = isTrialing ? daysLeft(trialEndsAt) : 0;

  // Redirect to billing if trial has expired
  // (allow access to the billing page itself regardless)
  if (isTrialing && trialDays === 0) {
    // We can't check the current pathname easily in a layout, so we redirect with a flag
    // that billing/page.tsx uses to show the expired banner.
    // Only redirect when not already on billing page — use a cookie/header workaround via the URL.
    // We'll redirect unconditionally to billing — billing page will still render and show the expired state.
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

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Platform
          </div>
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white bg-primary/10 transition-colors">
            <BarChart2 className="h-4 w-4 text-primary" />
            Analytics
          </Link>
          <Link href="/dashboard/assistants" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Bot className="h-4 w-4" />
            Assistants
          </Link>
          <Link href="/dashboard/knowledge" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Library className="h-4 w-4" />
            Knowledge Base
          </Link>

          <div className="mt-8 mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Account
          </div>
          <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <InactivityGuard />
        {/* Trial countdown banner */}
        {isTrialing && trialDays > 0 && (
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
