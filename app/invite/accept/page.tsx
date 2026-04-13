"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type InviteState = "loading" | "ready" | "accepted" | "error" | "expired" | "wrong_email";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<InviteState>("loading");
  const [message, setMessage] = useState("");
  const [accepting, setAccepting] = useState(false);

  // Validate token on mount (check it exists and isn't expired)
  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("No invitation token provided. Please use the link from your invitation email.");
      return;
    }
    // We optimistically show "ready" — the real validation happens on accept POST
    setState("ready");
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);

    const res = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();

    if (res.status === 401) {
      // Not signed in — send to login with redirect back here
      router.push(`/login?next=/invite/accept?token=${token}`);
      return;
    }

    if (res.status === 410) {
      setState("expired");
      setMessage(data.error);
    } else if (res.status === 403) {
      setState("wrong_email");
      setMessage(data.error);
    } else if (!res.ok) {
      setState("error");
      setMessage(data.error ?? "Something went wrong. Please try again.");
    } else {
      setState("accepted");
      // Redirect to dashboard after a short delay so middleware can set workspace cookie
      setTimeout(() => router.push("/dashboard"), 1500);
    }
    setAccepting(false);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-8 shadow-card text-center space-y-5">

      {state === "loading" && (
        <>
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Validating invitation…</p>
        </>
      )}

      {state === "ready" && (
        <>
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 border border-primary/20 mx-auto">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-white">You've been invited!</h1>
          <p className="text-sm text-slate-400">
            You've been invited to collaborate on an AskYourSite workspace.
            Click below to accept and join the team.
          </p>
          <p className="text-xs text-slate-500">
            You'll need to be signed in (or create an account) with the email address this invitation was sent to.
          </p>
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-primary text-white hover:bg-blue-500 gap-2"
          >
            {accepting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Accepting…</>
            ) : (
              "Accept Invitation →"
            )}
          </Button>
        </>
      )}

      {state === "accepted" && (
        <>
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <h1 className="text-xl font-semibold text-white">Welcome to the team!</h1>
          <p className="text-sm text-slate-400">
            You've joined the workspace. Taking you to the dashboard…
          </p>
        </>
      )}

      {state === "expired" && (
        <>
          <XCircle className="h-12 w-12 text-amber-400 mx-auto" />
          <h1 className="text-xl font-semibold text-white">Invitation expired</h1>
          <p className="text-sm text-slate-400">{message}</p>
        </>
      )}

      {state === "wrong_email" && (
        <>
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-semibold text-white">Wrong account</h1>
          <p className="text-sm text-slate-400">{message}</p>
          <Link href="/login" className="inline-block text-sm text-primary hover:underline">
            Sign in with a different account →
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h1 className="text-xl font-semibold text-white">Invalid invitation</h1>
          <p className="text-sm text-slate-400">{message}</p>
        </>
      )}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-xl">
            ⚡ AskYourSite
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-card text-center">
              <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
              <p className="text-slate-400 text-sm mt-4">Loading…</p>
            </div>
          }
        >
          <AcceptInviteContent />
        </Suspense>
      </div>
    </div>
  );
}
