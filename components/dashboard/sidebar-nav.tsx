"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot, BarChart2, Library, Settings, Users, Puzzle,
  Zap, BarChart3, UserRound, Lock, Headphones,
} from "lucide-react";

interface SidebarNavProps {
  featureFlags: Record<string, boolean>;
  hasTeamAccess: boolean;
  hasHandoffAccess: boolean;
  waitingHandoffCount: number;
  isTeamMember: boolean;
}

export function SidebarNav({
  featureFlags,
  hasTeamAccess,
  hasHandoffAccess,
  waitingHandoffCount,
  isTeamMember,
}: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive(href)
        ? "bg-primary/10 text-white"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  const iconClass = (href: string) =>
    isActive(href) ? "h-4 w-4 text-primary" : "h-4 w-4";

  return (
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Platform
      </div>

      <Link href="/dashboard" className={linkClass("/dashboard")}>
        <BarChart2 className={iconClass("/dashboard")} />
        Analytics
      </Link>

      <Link href="/dashboard/assistants" className={linkClass("/dashboard/assistants")}>
        <Bot className={iconClass("/dashboard/assistants")} />
        Assistants
      </Link>

      <Link href="/dashboard/knowledge" className={linkClass("/dashboard/knowledge")}>
        <Library className={iconClass("/dashboard/knowledge")} />
        Knowledge Base
      </Link>

      {featureFlags.lead_capture && (
        <Link href="/dashboard/leads" className={linkClass("/dashboard/leads")}>
          <Users className={iconClass("/dashboard/leads")} />
          Leads
        </Link>
      )}

      <Link href="/dashboard/agent-logs" className={linkClass("/dashboard/agent-logs")}>
        <Zap className={iconClass("/dashboard/agent-logs")} />
        Agent Logs
      </Link>

      {hasHandoffAccess ? (
        <Link href="/dashboard/inbox" className={linkClass("/dashboard/inbox")}>
          <Headphones className={iconClass("/dashboard/inbox")} />
          Inbox
          {waitingHandoffCount > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {waitingHandoffCount > 9 ? "9+" : waitingHandoffCount}
            </span>
          )}
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 cursor-not-allowed select-none">
          <Headphones className="h-4 w-4" />
          Inbox
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">BIZ</span>
        </div>
      )}

      <Link href="/dashboard/agent-performance" className={linkClass("/dashboard/agent-performance")}>
        <BarChart3 className={iconClass("/dashboard/agent-performance")} />
        Performance
      </Link>

      <Link href="/dashboard/integrations" className={linkClass("/dashboard/integrations")}>
        <Puzzle className={iconClass("/dashboard/integrations")} />
        Integrations
      </Link>

      {isTeamMember || hasTeamAccess ? (
        <Link href="/dashboard/team" className={linkClass("/dashboard/team")}>
          <UserRound className={iconClass("/dashboard/team")} />
          Team
        </Link>
      ) : (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 cursor-not-allowed select-none">
          <Lock className="h-4 w-4" />
          Team
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">PRO</span>
        </div>
      )}

      <div className="mt-8 mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Account
      </div>

      {!isTeamMember && (
        <Link href="/dashboard/settings" className={linkClass("/dashboard/settings")}>
          <Settings className={iconClass("/dashboard/settings")} />
          Settings
        </Link>
      )}
    </nav>
  );
}
