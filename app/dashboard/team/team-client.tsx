"use client";

import { useState } from "react";
import { UserRound, UserPlus, Trash2, Clock, CheckCircle2, Lock, X, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: "editor" | "viewer";
  status: "pending" | "active";
  joined_at: string | null;
  created_at: string;
}

interface Props {
  members: Member[];
  planCode: string;
  teamMemberLimit: number;
  upgradeRequired: boolean;
  isReadOnly?: boolean;
  ownerLabel?: string;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
        role === "editor"
          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
      )}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return status === "active" ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
      <Clock className="h-3.5 w-3.5" /> Pending
    </span>
  );
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/teams/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
    } else {
      setSuccess(data.message);
      setTimeout(() => {
        onInvited();
        onClose();
      }, 1200);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-card p-6 animate-fade-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Invite a team member</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@yourcompany.in"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-white text-sm outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "editor", label: "Editor", desc: "Can train, configure, and test" },
                { value: "viewer", label: "Viewer", desc: "Preview only, read-only" },
              ].map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value as "editor" | "viewer")}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                    role === r.value
                      ? "border-primary/40 bg-primary/10 text-white"
                      : "border-border text-slate-400 hover:border-slate-500 hover:text-white"
                  )}
                >
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-xs opacity-70">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Role details */}
          <div className="rounded-xl bg-background border border-border p-3 text-xs text-slate-400 space-y-1">
            {role === "editor" ? (
              <>
                <p className="text-slate-300 font-medium">Editor can:</p>
                <p>✓ View and train assistants</p>
                <p>✓ Configure Design and Automate tabs</p>
                <p>✓ Test in Preview</p>
                <p className="text-slate-600">✗ Cannot access Install tab or Billing</p>
              </>
            ) : (
              <>
                <p className="text-slate-300 font-medium">Viewer can:</p>
                <p>✓ Preview and test assistants</p>
                <p className="text-slate-600">✗ Cannot train, configure, install, or access Billing</p>
              </>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {success}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 border border-border text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-primary text-white hover:bg-blue-500 gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><UserPlus className="h-4 w-4" /> Send Invite</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TeamPageClient({ members, planCode, teamMemberLimit, upgradeRequired, isReadOnly = false, ownerLabel }: Props) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const activeCount = members.filter(m => m.status === "active").length;
  // +1 for the admin themselves
  const usedSeats = activeCount + 1;

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Remove ${email} from your team?`)) return;
    setRemovingId(id);
    await fetch(`/api/teams/members?id=${id}`, { method: "DELETE" });
    setRemovingId(null);
    router.refresh();
  }

  if (upgradeRequired) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up px-4 py-10">
        <div className="rounded-2xl border border-border bg-surface p-8 text-center space-y-4">
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-slate-800 border border-border mx-auto">
            <Lock className="h-6 w-6 text-slate-500" />
          </div>
          <h2 className="text-xl font-semibold text-white">Team spaces require a Pro plan</h2>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Upgrade to Pro to invite up to 3 team members, or Business for up to 5. Team members can collaborate on your assistants without needing their own paid plan.
          </p>
          <Link href="/dashboard/settings?tab=billing">
            <Button className="bg-primary text-white hover:bg-blue-500 gap-2">
              Upgrade to Pro <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-tight">Team</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isReadOnly
              ? `Members of ${ownerLabel ? `${ownerLabel}'s` : "this"} workspace`
              : "Invite colleagues to collaborate on your assistants."}
          </p>
        </div>
        {!isReadOnly && (
          <Button
            onClick={() => setShowInvite(true)}
            className="gap-2 bg-primary text-white hover:bg-blue-500 shadow-glow shrink-0"
            disabled={usedSeats >= teamMemberLimit}
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Seat counter (admin only) */}
      {!isReadOnly && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <UserRound className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-slate-400">
            <span className="text-white font-medium">{usedSeats}</span> of{" "}
            <span className="text-white font-medium">{teamMemberLimit}</span> seats used
            {" "}
            <span className="text-slate-600 capitalize">({planCode} plan)</span>
          </p>
          {usedSeats >= teamMemberLimit && (
            <Link href="/dashboard/settings?tab=billing" className="ml-auto text-xs text-primary hover:underline shrink-0">
              Upgrade for more seats →
            </Link>
          )}
        </div>
      )}

      {/* Members table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Member</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
              {!isReadOnly && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody>
            {/* Admin row */}
            <tr className="border-b border-border/50">
              <td className="px-5 py-4">
                <div>
                  <p className="font-medium text-white">
                    {isReadOnly ? (ownerLabel ?? "Admin") : "You (Admin)"}
                  </p>
                  <p className="text-xs text-slate-500">Workspace owner</p>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  admin
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              </td>
              <td className="px-5 py-4 text-xs text-slate-500">—</td>
              {!isReadOnly && <td className="px-5 py-4" />}
            </tr>

            {/* Invited members */}
            {members.map(m => (
              <tr key={m.id} className="border-b border-border/50 last:border-0">
                <td className="px-5 py-4">
                  <div>
                    <p className="font-medium text-white">{m.name ?? m.email}</p>
                    {m.name && <p className="text-xs text-slate-500">{m.email}</p>}
                  </div>
                </td>
                <td className="px-5 py-4"><RoleBadge role={m.role} /></td>
                <td className="px-5 py-4"><StatusBadge status={m.status} /></td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {m.joined_at
                    ? new Date(m.joined_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Invite sent"}
                </td>
                {!isReadOnly && (
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleRemove(m.id, m.email)}
                      disabled={removingId === m.id}
                      className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      {removingId === m.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {members.length === 0 && (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="px-5 py-10 text-center text-sm text-slate-500">
                  {isReadOnly ? "No other team members yet." : <>No team members yet. Click <span className="text-white">Invite Member</span> to get started.</>}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isReadOnly && (
        <p className="text-xs text-slate-600">
          Pending invitations expire after 7 days. You can remove a member at any time to revoke their access immediately.
        </p>
      )}

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={() => router.refresh()}
        />
      )}
    </div>
  );
}
