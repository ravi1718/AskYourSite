import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SignInPanel } from "@/components/auth/sign-in-panel";
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
    <main className="min-h-screen relative overflow-hidden bg-background text-text flex flex-col justify-center items-center px-4">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[150px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-x-0 top-0 h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-30 pointer-events-none" />

      <Link
        href="/"
        className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-all duration-200 hover:text-white hover:gap-3 z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="flex flex-col items-center mb-8">
           <Image src="/logo.png" alt="AskYourSite" width={96} height={96} className="rounded-2xl mb-6" />
           <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-2">Welcome Back</h1>
           <p className="text-slate-400 text-center">Log in to manage your AI sales and support agents.</p>
        </div>

        <SignInPanel />
      </div>
    </main>
  );
}
