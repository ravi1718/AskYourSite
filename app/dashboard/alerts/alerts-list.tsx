"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, HelpCircle } from "lucide-react";

interface Alert {
  id: string;
  message: string;
  assistantName: string;
  assistantId: string;
  date: string;
}

export default function AlertsList({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-border bg-surface">
        <HelpCircle className="h-10 w-10 text-slate-600 mb-4" />
        <p className="text-base font-medium text-slate-400">No unanswered queries</p>
        <p className="text-sm text-slate-500 mt-1">Your assistant is handling all questions well.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="p-5 rounded-2xl border border-border bg-surface shadow-card hover:border-border/80 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-ember shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 leading-relaxed">
                {alert.message.length > 300
                  ? alert.message.substring(0, 300) + "..."
                  : alert.message}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <Link
                  href={`/dashboard/assistants/${alert.assistantId}`}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  {alert.assistantName}
                </Link>
                <span className="text-slate-600 text-xs">·</span>
                <span className="text-xs text-slate-500">
                  {new Date(alert.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleDelete(alert.id)}
              disabled={deleting === alert.id}
              title="Dismiss alert"
              className="flex-shrink-0 p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
