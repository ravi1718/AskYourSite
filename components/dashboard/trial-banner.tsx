"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, X } from "lucide-react";

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-500/15 border-b border-amber-500/20 px-5 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-amber-300">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          <strong>{daysLeft === 1 ? "1 day" : `${daysLeft} days`}</strong> left in your free trial.
        </span>
        <Link
          href="/dashboard/billing"
          className="ml-1 font-semibold text-white underline underline-offset-2 hover:text-amber-200 transition-colors"
        >
          Subscribe now →
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
