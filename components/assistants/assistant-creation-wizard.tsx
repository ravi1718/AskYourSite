"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createAssistantAction } from "@/app/dashboard/assistants/new/actions";
import {
  initialCreateAssistantState,
  type CreateAssistantState,
} from "@/app/dashboard/assistants/new/state";
import { Button } from "@/components/ui/button";

const inputBase =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-white outline-none " +
  "transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-slate-500 shadow-inner";

export function AssistantCreationWizard() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateAssistantState, FormData>(
    createAssistantAction,
    initialCreateAssistantState,
  );

  useEffect(() => {
    if (state.success && state.assistantId) {
      router.push(`/dashboard/assistants/${state.assistantId}`);
    }
  }, [state.success, state.assistantId, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Assistant name</span>
          <input
            name="name"
            defaultValue="Support Copilot"
            className={inputBase}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Primary website URL</span>
          <input
            name="websiteUrl"
            type="url"
            placeholder="https://example.com"
            className={inputBase}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Business summary</span>
        <textarea
          name="businessSummary"
          rows={4}
          placeholder="Describe what your business does and how your assistant should help visitors..."
          className={inputBase}
        />
      </label>

      {state.message && !state.success && (
        <p className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
          {state.message}
        </p>
      )}

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={pending}
          className="gap-2 bg-primary text-white hover:bg-blue-500 shadow-glow"
        >
          {pending ? "Creating..." : "Create assistant"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
