import Image from "next/image";
import { redirect } from "next/navigation";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ApiKeysSection } from "@/components/settings/api-keys-section";
import { updateDisplayName } from "./actions";

export default async function SettingsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!supabase || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, company_name")
    .eq("id", user.id)
    .single();

  const { data: usageData } = await supabase
    .rpc("get_user_usage", { p_user_id: user.id } as any)
    .single();

  const usage = usageData as any;

  const displayName = profile?.full_name || user.user_metadata?.full_name || "";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const email = user.email ?? "";
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Fetch API keys (prefix only — never the full key)
  const admin = getSupabaseAdminClient();
  const { data: apiKeys } = admin
    ? await admin
        .from("api_keys")
        .select("id, key_prefix, label, last_used_at, created_at, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="mx-auto max-w-2xl w-full animate-fade-up">
      <header className="py-6 border-b border-border mb-8">
        <h1 className="text-3xl font-display font-semibold text-white tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Manage your profile and account preferences.</p>
      </header>

      {/* Profile Section */}
      <section className="rounded-2xl border border-border bg-surface shadow-card p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-6">Profile</h2>

        <div className="flex items-center gap-4 mb-8">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || "Avatar"}
              width={56}
              height={56}
              className="rounded-full ring-2 ring-border"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white">{displayName || "No name set"}</p>
            <p className="text-xs text-slate-500 mt-0.5">Google account avatar</p>
          </div>
        </div>

        <form action={updateDisplayName} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Display Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={displayName}
              placeholder="Your name"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-2.5">
              <Mail className="h-4 w-4 text-slate-600 shrink-0" />
              <span className="text-sm text-slate-400">{email}</span>
              <span className="ml-auto text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded border border-white/10">Read-only</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              className="bg-white text-ink hover:bg-slate-200 font-medium shadow-[0_0_15px_rgba(255,255,255,0.15)]"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </section>

      {/* Account Info Section */}
      <section className="rounded-2xl border border-border bg-surface shadow-card p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-6">Account</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border/50">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Shield className="h-4 w-4" />
              <span>Plan</span>
            </div>
            <span className="text-sm font-medium text-white">
              {usage?.plan_name ?? "Starter"}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>Member since</span>
            </div>
            <span className="text-sm font-medium text-white">{memberSince}</span>
          </div>
        </div>
      </section>

      {/* API Keys */}
      <ApiKeysSection initialKeys={apiKeys ?? []} />

      {/* Danger Zone */}
      <section className="rounded-2xl border border-ember/20 bg-ember/5 p-6">
        <h2 className="text-base font-semibold text-ember mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-5">
          Deleting your account will remove all your assistants, training data, and conversation history permanently. This cannot be undone.
        </p>
        <Button
          variant="ghost"
          className="border border-ember/40 text-ember hover:bg-ember/10 hover:border-ember/60 font-medium"
          disabled
          title="Contact support to delete your account"
        >
          Delete Account
        </Button>
        <p className="text-xs text-slate-600 mt-3">Contact support to permanently delete your account.</p>
      </section>
    </div>
  );
}
