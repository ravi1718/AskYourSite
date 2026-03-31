"use client";

import { Chrome } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const configured = Boolean(supabase);
  const nextPath = searchParams.get("next") || "/dashboard";

  async function signInWithGoogle() {
    if (!supabase) {
      setStatus("Add Supabase environment variables to enable Google sign-in.");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { prompt: "select_account" },
      },
    });

    setStatus(error ? error.message : "Redirecting to Google...");
  }

  return (
    <div className="rounded-3xl border border-border bg-surface/50 backdrop-blur-xl p-8 shadow-card flex flex-col items-center">
      <div className="w-full text-center mb-8">
        <p className="text-sm font-medium text-slate-400">
          Sign in to access your dashboard, trained agents, and workspace configurations.
        </p>
      </div>

      <div className="w-full">
        <Button 
          onClick={signInWithGoogle} 
          className="w-full h-12 text-base font-semibold gap-3 bg-white text-ink hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
        >
          <Chrome className="h-5 w-5" />
          Continue with Google
        </Button>
      </div>

      {status ? (
        <p className="mt-6 text-sm text-ember text-center animate-fade-up">{status}</p>
      ) : !configured ? (
        <p className="mt-6 text-sm text-ember text-center bg-ember/10 px-3 py-2 rounded-lg border border-ember/20 animate-fade-up">
          Supabase environment missing. Please check your .env configuration.
        </p>
      ) : null}
    </div>
  );
}
