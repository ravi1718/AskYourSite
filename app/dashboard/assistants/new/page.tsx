import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SetupWizard } from "@/components/onboarding/setup-wizard";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewAssistantPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl w-full animate-fade-up px-4">
      <Link href="/dashboard/assistants" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mt-6 mb-8 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Assistants
      </Link>

      <section className="bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-card">
        <SetupWizard />
      </section>
    </div>
  );
}
