import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, Star, Sparkles } from "lucide-react";
import { SignInPanel } from "@/components/auth/sign-in-panel";
import { LoginBackground } from "@/components/auth/login-background";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0D0D1A] text-white flex flex-col justify-center items-center px-4">
      {/* Animated chat background */}
      <LoginBackground />

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm text-slate-500 transition-all duration-200 hover:text-white z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      {/* Login card */}
      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-xl scale-110" />
            <Image
              src="/logo.png"
              alt="AskYourSite"
              width={80}
              height={80}
              className="relative rounded-2xl"
            />
          </div>

          <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2">
            Welcome back
          </h1>
          <p className="text-slate-400 text-sm">
            Join 500+ businesses using AI to answer customer questions
          </p>

          {/* Star rating */}
          <div className="flex items-center gap-1.5 mt-3">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            <span className="text-xs text-slate-500 ml-1">4.9 · 500+ businesses</span>
          </div>
        </div>

        {/* Sign in panel */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8 shadow-[0_0_60px_rgba(139,92,246,0.1)]">
          <SignInPanel />
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-slate-600">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-slate-500 hover:text-slate-300 transition-colors">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-slate-500 hover:text-slate-300 transition-colors">
            Privacy Policy
          </Link>
        </p>

        {/* Feature pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            "7-day free trial",
            "No credit card",
            "Cancel anytime",
          ].map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/3 px-3 py-1 text-[10px] text-slate-500"
            >
              <Sparkles className="h-2.5 w-2.5 text-violet-400" />
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
