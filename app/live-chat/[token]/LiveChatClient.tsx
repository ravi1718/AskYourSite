"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { VisitorPanel } from "./VisitorPanel";

interface Message {
  role: string;
  content: string;
  created_at: string;
  source?: string;
  /** Client-side flag — message hasn't been confirmed by DB yet */
  isOptimistic?: boolean;
}

interface Handoff {
  id: string;
  status: string;
  claimed_by_user_id: string | null;
  trigger_reason: string;
  trigger_message: string;
  ai_summary: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_sentiment: number | null;
  assistantName: string;
  join_token: string;
  created_at: string;
}

interface LiveChatClientProps {
  handoff: Handoff;
  initialMessages: Message[];
  token: string;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isVisitor = msg.role === "user";
  const isAgent = msg.role === "agent";
  const isSystem = msg.role === "system";
  const isAI = msg.role === "assistant";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs text-amber-300">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isVisitor ? "justify-start" : "justify-end"}`}>
      <div className="flex flex-col gap-1 max-w-[75%]">
        <span className={`text-[10px] px-1 ${isVisitor ? "text-slate-500" : isAgent ? "text-primary" : "text-blue-400"}`}>
          {isVisitor ? "Visitor" : isAgent ? "You (Agent)" : "AI"}
        </span>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isVisitor
              ? "bg-white/8 text-slate-200 rounded-tl-sm"
              : isAgent
              ? "bg-primary text-white rounded-tr-sm"
              : "bg-blue-500/15 text-blue-200 rounded-tr-sm border border-blue-500/20"
          }`}
        >
          {msg.content}
        </div>
        <span className="text-[10px] text-slate-600 px-1">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export function LiveChatClient({ handoff: initial, initialMessages, token }: LiveChatClientProps) {
  const [handoff, setHandoff] = useState(initial);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [resolving, setResolving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string>(
    initialMessages[initialMessages.length - 1]?.created_at ?? new Date(0).toISOString()
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Poll for new messages every 3s
  useEffect(() => {
    if (handoff.status === "resolved" || handoff.status === "timed_out") return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/handoff/${token}/messages?after=${encodeURIComponent(lastTimestampRef.current)}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.messages?.length > 0) {
          setMessages((prev) => {
            // Keys of confirmed messages coming from DB
            const confirmedKeys = new Set(
              data.messages.map((m: Message) => m.role + "|" + m.content)
            );
            // Remove optimistic messages that have now been confirmed
            const withoutOptimistic = prev.filter(
              (m) => !(m.isOptimistic && confirmedKeys.has(m.role + "|" + m.content))
            );
            // Dedup by timestamp+content so we never add the same DB row twice
            const existingKeys = new Set(
              withoutOptimistic.map((m) => m.created_at + "|" + m.content)
            );
            const newMsgs = data.messages.filter(
              (m: Message) => !existingKeys.has(m.created_at + "|" + m.content)
            );
            if (newMsgs.length === 0) return withoutOptimistic;
            lastTimestampRef.current = newMsgs[newMsgs.length - 1].created_at;
            return [...withoutOptimistic, ...newMsgs];
          });
        }

        if (data.handoffStatus && data.handoffStatus !== handoff.status) {
          setHandoff((prev) => ({ ...prev, status: data.handoffStatus }));
        }
      } catch { /* non-fatal */ }
    };

    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [token, handoff.status]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch(`/api/handoff/${token}/claim`, { method: "POST" });
      if (res.ok) {
        setHandoff((prev) => ({ ...prev, status: "active" }));
      } else {
        const err = await res.json();
        alert(err.error ?? "Could not claim conversation");
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    try {
      await fetch(`/api/handoff/${token}/resolve`, { method: "POST" });
      setHandoff((prev) => ({ ...prev, status: "resolved" }));
    } finally {
      setResolving(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");

    const optimistic: Message = {
      role: "agent",
      content: text,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/handoff/${token}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[Reply failed]", res.status, err);
        // Mark optimistic message as failed
        setMessages((prev) => prev.map((m) =>
          m.isOptimistic && m.content === text
            ? { ...m, content: `${text} ⚠️ (failed to send)` }
            : m
        ));
      }
    } catch (err) {
      console.error("[Reply error]", err);
    }
    setSending(false);
  };

  const isClosed = handoff.status === "resolved" || handoff.status === "timed_out";
  const isWaiting = handoff.status === "waiting";
  const isActive = handoff.status === "active";

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden">
      {/* Left: Visitor context panel */}
      <aside className="w-72 flex-shrink-0 border-r border-border bg-surface flex flex-col p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Visitor Context</h2>
        <VisitorPanel handoff={handoff} onResolve={handleResolve} resolving={resolving} />
      </aside>

      {/* Right: Chat timeline */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 flex items-center px-6 border-b border-border gap-3 flex-shrink-0">
          <div className={`h-2 w-2 rounded-full ${isWaiting ? "bg-amber-400 animate-pulse" : isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span className="text-sm font-semibold text-white">
            {isWaiting ? "Waiting for agent" : isActive ? "Active conversation" : "Conversation closed"}
          </span>
          <span className="text-xs text-slate-500 ml-auto">
            Started {new Date(handoff.created_at).toLocaleString()}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <MessageBubble key={`${msg.created_at}-${i}`} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Claim banner / Input */}
        {isWaiting && (
          <div className="border-t border-border p-4 flex items-center justify-center">
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {claiming ? "Joining…" : "Claim This Conversation →"}
            </button>
          </div>
        )}

        {isActive && (
          <div className="border-t border-border p-4 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type your reply…"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-white hover:bg-primary/80 transition-colors disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        )}

        {isClosed && (
          <div className="border-t border-border p-4 text-center text-sm text-slate-500">
            {handoff.status === "resolved"
              ? "Conversation resolved. AI assistant is back online for this visitor."
              : "Conversation timed out. AI assistant is back online."}
          </div>
        )}
      </div>
    </div>
  );
}
