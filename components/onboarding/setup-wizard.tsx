"use client";

import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Bot, Check, Code, Copy, Globe,
  RefreshCcw, Zap,
} from "lucide-react";
import { createAssistantAction } from "@/app/dashboard/assistants/new/actions";
import {
  initialCreateAssistantState,
  type CreateAssistantState,
} from "@/app/dashboard/assistants/new/state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-white " +
  "outline-none transition-all duration-200 focus:border-primary/50 " +
  "focus:ring-1 focus:ring-primary/30 placeholder:text-slate-500 shadow-inner text-sm";

// ── Progress stepper ───────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: "Create" },
  { n: 2, label: "Train" },
  { n: 3, label: "Install" },
];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center">
          {/* circle */}
          <div
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all",
              current > s.n
                ? "bg-emerald-500 border-emerald-500 text-white"
                : current === s.n
                ? "bg-primary border-primary text-white shadow-glow"
                : "bg-surface border-border text-slate-500",
            )}
          >
            {current > s.n ? <Check className="h-4 w-4" /> : s.n}
          </div>
          {/* label */}
          <span
            className={cn(
              "ml-2 text-sm font-medium",
              current === s.n ? "text-white" : current > s.n ? "text-emerald-400" : "text-slate-500",
            )}
          >
            {s.label}
          </span>
          {/* connector */}
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-px w-10 mx-4 transition-all",
                current > s.n ? "bg-emerald-500" : "bg-border",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Create ─────────────────────────────────────────────────────────────

function Step1Create({
  onCreated,
}: {
  onCreated: (id: string, url: string) => void;
}) {
  const [state, formAction, pending] = useActionState<CreateAssistantState, FormData>(
    createAssistantAction,
    initialCreateAssistantState,
  );

  useEffect(() => {
    if (state.success && state.assistantId) {
      // Pass assistantId + the URL back to the wizard — DON'T redirect
      const form = document.getElementById("wizard-create-form") as HTMLFormElement | null;
      const url = (form?.elements.namedItem("websiteUrl") as HTMLInputElement)?.value ?? "";
      onCreated(state.assistantId, url);
    }
  }, [state.success, state.assistantId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form id="wizard-create-form" action={formAction} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">Assistant name</span>
          <input name="name" defaultValue="Support Copilot" className={inputCls} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-300">Website URL</span>
          <input
            name="websiteUrl"
            type="url"
            placeholder="https://yourcompany.com"
            className={inputCls}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-300">What does your business do?</span>
        <p className="text-xs text-slate-500">
          Describe your product, who it&apos;s for, and how the agent should help visitors. The
          more detail, the better.
        </p>
        <textarea
          name="businessSummary"
          rows={4}
          placeholder={
            "e.g. We sell B2B CRM software for small sales teams. The agent should answer product questions, " +
            "capture contact details, and help visitors book a demo call."
          }
          className={inputCls}
        />
      </label>

      {state.message && !state.success && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.message}
        </p>
      )}

      <div className="flex justify-end pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={pending}
          className="gap-2 bg-primary text-white hover:bg-blue-500 shadow-glow min-w-[160px]"
        >
          {pending ? (
            <><RefreshCcw className="h-4 w-4 animate-spin" /> Creating...</>
          ) : (
            <>Create assistant <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Step 2: Train ──────────────────────────────────────────────────────────────

function Step2Train({
  assistantId,
  websiteUrl,
  onNext,
}: {
  assistantId: string;
  websiteUrl: string;
  onNext: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "crawling" | "training" | "done" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState("");

  async function handleCrawlAndTrain() {
    if (!websiteUrl) {
      onNext();
      return;
    }
    setStatus("crawling");
    setProgress("Crawling your website — discovering all pages…");
    try {
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const crawlData = await crawlRes.json();
      if (!crawlRes.ok || !crawlData.success) {
        throw new Error(crawlData.error || "Failed to crawl website");
      }

      const pages: Array<{ url: string; content: string }> = crawlData.pages || [];
      if (!pages.length) throw new Error("No pages with content found");

      setStatus("training");
      let done = 0;
      for (const page of pages) {
        setProgress(`Training page ${done + 1} of ${pages.length}: ${page.url}`);
        await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assistantId,
            content: page.content,
            sourceUrl: page.url,
          }),
        });
        done++;
      }

      setSummary(`Trained on ${done} page${done !== 1 ? "s" : ""} from ${websiteUrl}`);
      setStatus("done");
    } catch (err: any) {
      setProgress(err.message ?? "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Train on your website</h3>
        <p className="text-sm text-slate-400">
          We&apos;ll crawl every page of your site and train the agent on your content automatically.
          This usually takes 1–2 minutes.
        </p>
      </div>

      {websiteUrl ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border text-sm text-slate-300">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">{websiteUrl}</span>
        </div>
      ) : (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-400">
          No website URL was provided — you can add training data manually from the Train tab later.
        </div>
      )}

      {/* Progress */}
      {(status === "crawling" || status === "training") && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-sm text-primary animate-pulse">
          <RefreshCcw className="h-4 w-4 animate-spin shrink-0 mt-0.5" />
          <span>{progress}</span>
        </div>
      )}
      {status === "done" && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">
          <Check className="h-4 w-4 shrink-0" />
          {summary}
        </div>
      )}
      {status === "error" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            <span>{progress}</span>
          </div>
          <p className="text-xs text-slate-500">
            You can add training data manually from the Train tab after setup.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={onNext}
          className="text-sm text-slate-400 hover:text-white transition-colors"
          disabled={status === "crawling" || status === "training"}
        >
          Skip for now →
        </button>

        {status === "done" || status === "error" || !websiteUrl ? (
          <Button onClick={onNext} className="gap-2 bg-primary text-white hover:bg-blue-500 shadow-glow">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleCrawlAndTrain}
            disabled={status === "crawling" || status === "training"}
            className="gap-2 bg-primary text-white hover:bg-blue-500 shadow-glow min-w-[160px]"
          >
            {status === "crawling" || status === "training" ? (
              <><RefreshCcw className="h-4 w-4 animate-spin" /> Working…</>
            ) : (
              <><Zap className="h-4 w-4" /> Crawl &amp; Train</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step 3: Install ────────────────────────────────────────────────────────────

function Step3Install({
  assistantId,
  onDone,
}: {
  assistantId: string;
  onDone: () => void;
}) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const snippet = `<script\n  src="${origin}/embed.js"\n  data-agent-id="${assistantId}"\n  async\n></script>`;
  const [copied, setCopied] = useState(false);

  function copySnippet() {
    navigator.clipboard.writeText(snippet).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Add the chat widget to your site</h3>
        <p className="text-sm text-slate-400">
          Paste this one-line snippet just before the closing{" "}
          <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">&lt;/body&gt;</code>{" "}
          tag on every page you want the agent to appear.
        </p>
      </div>

      {/* Snippet */}
      <div className="relative">
        <pre className="bg-background border border-border rounded-xl p-5 text-sm text-slate-300 overflow-x-auto leading-relaxed">
          <code>{snippet}</code>
        </pre>
        <Button
          onClick={copySnippet}
          variant="ghost"
          className="absolute top-3 right-3 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-3 gap-1.5 text-xs"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      {/* Platform hints */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        {[
          { icon: "</>", label: "HTML / Vanilla JS", hint: "Paste before </body>" },
          { icon: "▲", label: "Next.js", hint: "Use next/script in layout.tsx" },
          { icon: "⚛", label: "React", hint: "Paste in index.html" },
          { icon: "🛍", label: "Shopify", hint: "Paste in theme.liquid" },
        ].map((p) => (
          <div
            key={p.label}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-surface"
          >
            <span className="text-lg leading-none">{p.icon}</span>
            <div>
              <p className="font-medium text-white">{p.label}</p>
              <p className="text-slate-500">{p.hint}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Code className="h-3.5 w-3.5" />
          More install options in the Install tab
        </p>
        <Button onClick={onDone} className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white min-w-[180px]">
          <Bot className="h-4 w-4" /> Open your assistant →
        </Button>
      </div>
    </div>
  );
}

// ── Wizard shell ───────────────────────────────────────────────────────────────

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [assistantId, setAssistantId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  function handleCreated(id: string, url: string) {
    setAssistantId(id);
    setWebsiteUrl(url);
    setStep(2);
  }

  function handleDone() {
    router.push(`/dashboard/assistants/${assistantId}`);
  }

  const headings: Record<number, { title: string; sub: string }> = {
    1: {
      title: "Set up your AI agent",
      sub: "Takes about 5 minutes. No technical knowledge required.",
    },
    2: {
      title: "Train on your content",
      sub: "The agent learns from your website automatically.",
    },
    3: {
      title: "You're almost live!",
      sub: "Copy the snippet and the widget goes live instantly.",
    },
  };

  const h = headings[step];

  return (
    <div>
      <Stepper current={step} />

      <div className="mb-8">
        <h2 className="text-2xl font-display font-semibold text-white tracking-tight">{h.title}</h2>
        <p className="text-sm text-slate-400 mt-1">{h.sub}</p>
      </div>

      {step === 1 && <Step1Create onCreated={handleCreated} />}
      {step === 2 && (
        <Step2Train
          assistantId={assistantId}
          websiteUrl={websiteUrl}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && <Step3Install assistantId={assistantId} onDone={handleDone} />}
    </div>
  );
}
