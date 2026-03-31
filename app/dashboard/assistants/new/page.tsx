import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AssistantCreationWizard } from "@/components/assistants/assistant-creation-wizard";
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
      
      <header className="mb-10">
        <h1 className="text-3xl font-display font-semibold text-white tracking-tight mb-2">Create New AI Assistant</h1>
        <p className="text-sm text-slate-400">Give your assistant a name and tell it about your business. You can add training sources in the playground.</p>
      </header>
      
      <section className="bg-surface border border-border rounded-2xl p-6 md:p-10 shadow-card">
        <AssistantCreationWizard />
      </section>
    </div>
  );
}
