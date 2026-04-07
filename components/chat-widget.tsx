"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Bot, Paperclip, Send, ChevronDown, X, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendGAEvent } from "@next/third-parties/google";

import { AYS_MARKER, parseMarkers, type BookingPayload, type Product, type Action } from "@/lib/chat/parse-markers";

const ACTION_ICONS: Record<string, string> = { cart: "🛒", track: "📦", support: "💬" };

function ProductCards({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 pl-9 scrollbar-thin scrollbar-thumb-slate-700">
      {products.map((p, i) => (
        <div key={i} className="flex-none w-40 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col hover:border-primary transition-colors">
          {p.image && (
            <img src={p.image} alt={p.name || ""} className="w-full h-28 object-cover bg-slate-900" onError={(e) => (e.currentTarget.style.display = "none")} />
          )}
          <div className="p-2 flex flex-col gap-1 flex-1">
            {p.name && <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">{p.name}</p>}
            {p.price && <p className="text-xs font-bold text-primary">{p.price}</p>}
            {p.description && <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight flex-1">{p.description}</p>}
          </div>
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener" className="mx-2 mb-2 py-1.5 bg-primary text-white text-[11px] font-semibold rounded-lg text-center hover:opacity-80 transition-opacity">
              View Product
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function ActionButtons({ actions }: { actions: Action[] }) {
  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pl-9">
      {actions.map((a, i) => (
        <a
          key={i}
          href={a.url || "#"}
          target="_blank"
          rel="noopener"
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-80 ${
            a.style === "secondary"
              ? "border border-primary text-primary bg-transparent"
              : "bg-primary text-white"
          }`}
        >
          {a.icon && <span>{ACTION_ICONS[a.icon]}</span>}
          <span>{a.label}</span>
        </a>
      ))}
    </div>
  );
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ImageAttachment {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export function ChatWidget({
  assistantId,
  showBranding = true,
  leadCaptureEnabled = false,
  exitCaptureEnabled = false,
  exitCaptureMessage = "Before you go — can I help you with anything else?",
}: {
  assistantId?: string;
  showBranding?: boolean;
  leadCaptureEnabled?: boolean;
  exitCaptureEnabled?: boolean;
  exitCaptureMessage?: string;
}) {
  const sessionKey = assistantId ? `ays_session_${assistantId}` : null;
  const visitorKey = assistantId ? `ays_visitor_${assistantId}` : null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [booking, setBooking] = useState<BookingPayload | null>(null);
  const [showCalendly, setShowCalendly] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);
  const [showExitCapture, setShowExitCapture] = useState(false);
  const exitShownRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistent session ID (stored in localStorage so returning visitors resume history)
  const [sessionId] = useState(() => {
    if (!sessionKey || typeof window === "undefined") return crypto.randomUUID();
    const saved = localStorage.getItem(sessionKey);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(sessionKey, id);
    return id;
  });

  // Notification bubble state
  const [notifMessages, setNotifMessages] = useState<string[]>([]);
  const [notifDelay, setNotifDelay] = useState(4);
  const [notifVisible, setNotifVisible] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState<Set<number>>(new Set());

  // Visual config fetched from the widget API (colors, font, name, etc.)
  const [widgetCfg, setWidgetCfg] = useState({
    primaryColor: "#3b82f6",
    bgColor: "#0f172a",
    textColor: "#f8fafc",
    fontFamily: "system-ui, -apple-system, sans-serif",
    logoUrl: "",
    name: "AskYourSite Agent",
    welcomeMessage: "Hi! How can I help you today?",
    placeholder: "Message...",
  });

  // Fetch full widget config (visual + notifications) from API
  useEffect(() => {
    if (!assistantId) return;
    fetch(`/api/widget/${assistantId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (!cfg) return;
        setWidgetCfg({
          primaryColor: cfg.primaryColor || "#3b82f6",
          bgColor: cfg.bgColor || "#0f172a",
          textColor: cfg.textColor || "#f8fafc",
          fontFamily: cfg.fontFamily || "system-ui, -apple-system, sans-serif",
          logoUrl: cfg.logoUrl || "",
          name: cfg.name || "AskYourSite Agent",
          welcomeMessage: cfg.welcomeMessage || "Hi! How can I help you today?",
          placeholder: cfg.placeholder || "Message...",
        });
        if (cfg.notification_enabled && cfg.notification_messages?.length > 0) {
          setNotifMessages(cfg.notification_messages);
          setNotifDelay(cfg.notification_delay ?? 4);
        }
      })
      .catch(() => {});
  }, [assistantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show notification bubbles after delay when widget is closed
  useEffect(() => {
    if (isOpen || notifMessages.length === 0) return;
    const timer = setTimeout(() => setNotifVisible(true), notifDelay * 1000);
    return () => clearTimeout(timer);
  }, [isOpen, notifMessages.length, notifDelay]);

  // Lead capture state
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadError, setLeadError] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Load conversation history on first open
  useEffect(() => {
    if (!isOpen || !assistantId || !sessionId || messages.length > 0) return;
    fetch(`/api/chat/history?sessionId=${sessionId}&assistantId=${assistantId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.messages?.length > 0) {
          setMessages(data.messages.map((m: any) => ({ role: m.role, content: m.content })));
        }
      })
      .catch(() => {});
  }, [isOpen, assistantId, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save visitor profile on widget close (for cross-session personalization)
  const saveVisitorProfile = useCallback(() => {
    if (!visitorKey || messages.length === 0) return;
    const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
    if (userMsgs.length === 0) return;
    // Extract simple topic keywords: first 6 words of each user message, deduplicated
    const topics = Array.from(
      new Set(userMsgs.flatMap((m) => m.toLowerCase().split(/\s+/).slice(0, 6)))
    ).slice(0, 30).join(", ");
    localStorage.setItem(visitorKey, JSON.stringify({ topics, lastVisit: new Date().toISOString() }));
  }, [messages, visitorKey]);

  // Get visitor context for personalized AI greeting
  const getVisitorContext = (): string | null => {
    if (!visitorKey || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(visitorKey);
      if (!raw) return null;
      const { topics } = JSON.parse(raw);
      return topics || null;
    } catch {
      return null;
    }
  };

  // New conversation: clear session key so a fresh ID is generated next open
  const startNewConversation = () => {
    if (sessionKey) localStorage.removeItem(sessionKey);
    setMessages([]);
    setSuggestions([]);
    setProducts([]);
    setActions([]);
    setBooking(null);
  };

  // Exit intent detection
  useEffect(() => {
    if (!exitCaptureEnabled || !isOpen) return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitShownRef.current && messages.length > 0 && !leadCaptured) {
        setShowExitCapture(true);
        exitShownRef.current = true;
      }
    };
    const handleVisibility = () => {
      if (document.hidden && !exitShownRef.current && messages.length > 0 && !leadCaptured) {
        setShowExitCapture(true);
        exitShownRef.current = true;
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [exitCaptureEnabled, isOpen, messages.length, leadCaptured]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestions]);

  useEffect(() => {
    setShowCalendly(false);
  }, [booking]);

  // Shared booking-confirmed handler — called by postMessage listener OR manual button
  const handleBookingConfirmed = useCallback(() => {
    setBooking(null);
    setShowCalendly(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Your meeting has been booked! 🎉 You'll receive a confirmation email shortly. Is there anything else I can help you with?",
      },
    ]);
    if (assistantId && sessionId) {
      fetch("/api/chat/booking-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId, sessionId }),
      }).catch(() => {});
    }
  }, [assistantId, sessionId]);

  // Stable ref — always points to the latest handler without re-registering the listener
  const handleBookingConfirmedRef = useRef(handleBookingConfirmed);
  useEffect(() => {
    handleBookingConfirmedRef.current = handleBookingConfirmed;
  }, [handleBookingConfirmed]);

  // Calendly postMessage listener — registered ONCE at mount (empty deps) so React
  // Strict Mode double-invocation never creates a gap where the listener is absent.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data =
          e.data && typeof e.data === "object" && e.data !== null
            ? e.data
            : typeof e.data === "string"
            ? JSON.parse(e.data)
            : null;
        if (data?.event === "calendly.event_scheduled") {
          handleBookingConfirmedRef.current();
        }
      } catch {
        // ignore malformed messages from other iframes
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
      setImageAttachment({ base64, mimeType, previewUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = async (text?: string) => {
    const userText = (text ?? input).trim();
    if ((!userText && !imageAttachment) || isStreaming) return;

    setSuggestions([]);
    setProducts([]);
    setActions([]);
    setBooking(null);
    setShowExitCapture(false);
    setInput("");
    const currentImage = imageAttachment;
    setImageAttachment(null);
    setIsStreaming(true);
    sendGAEvent("event", "chat_message_sent", { widget: "site_widget" });

    const userMessage: Message & { imagePreview?: string } = {
      role: "user",
      content: userText || "🔍 Image search",
      ...(currentImage && { imagePreview: currentImage.previewUrl }),
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Placeholder for streaming assistant response
    const assistantPlaceholder: Message = { role: "assistant", content: "" };
    setMessages([...updatedMessages, assistantPlaceholder]);

    // Pass visitor context (topics from previous sessions) for personalization
    const visitorContext = getVisitorContext();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          assistantId: assistantId ?? "preview",
          sessionId,
          ...(visitorContext && { visitorContext }),
          ...(currentImage && {
            imageBase64: currentImage.base64,
            imageMimeType: currentImage.mimeType,
          }),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let markerFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;

        if (!markerFound) {
          const markerIdx = fullResponse.indexOf(AYS_MARKER);
          const displayText = markerIdx !== -1
            ? (markerFound = true, fullResponse.substring(0, markerIdx))
            : fullResponse;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: displayText };
            return updated;
          });
        }
      }

      // Parse all markers after stream ends and update state
      const parsed = parseMarkers(fullResponse);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: parsed.text };
        return updated;
      });
      if (parsed.suggestions.length > 0) setSuggestions(parsed.suggestions);
      if (parsed.products.length > 0) setProducts(parsed.products);
      if (parsed.actions.length > 0) setActions(parsed.actions);
      if (parsed.booking) setBooking(parsed.booking);
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadEmail)) {
      setLeadError("Please enter a valid email address.");
      return;
    }
    setLeadError("");
    setIsSubmittingLead(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantId, sessionId, name: leadName || null, email: leadEmail }),
      });
    } catch {
      // non-blocking — proceed even if save fails
    } finally {
      setIsSubmittingLead(false);
      setLeadCaptured(true);
    }
  };

  const showLeadForm = leadCaptureEnabled && !!assistantId && !leadCaptured;

  if (!isOpen) {
    const visibleBubbles = notifVisible
      ? notifMessages.filter((_, i) => !notifDismissed.has(i))
      : [];
    return (
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
        {visibleBubbles.map((msg, i) => (
          <div
            key={i}
            onClick={() => setIsOpen(true)}
            className="relative max-w-[240px] bg-[#1e293b] border border-slate-700 rounded-2xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-sm text-white cursor-pointer hover:border-slate-500 transition-colors animate-fade-up"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotifDismissed((prev) => new Set(prev).add(i));
              }}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-slate-600 text-white flex items-center justify-center text-[10px] hover:bg-slate-500 transition-colors"
            >
              ×
            </button>
            {msg}
            <div className="absolute bottom-[-5px] right-6 h-2.5 w-2.5 bg-[#1e293b] border-r border-b border-slate-700 rotate-45" />
          </div>
        ))}
        <button
          onClick={() => { setIsOpen(true); setNotifVisible(false); }}
          style={{ backgroundColor: widgetCfg.primaryColor }}
          className="h-14 w-14 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.6)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group border-0"
        >
          <Bot className="h-6 w-6 group-hover:animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 w-[440px] h-[600px] max-h-[85vh] flex flex-col rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-fade-up"
      style={{ backgroundColor: widgetCfg.bgColor, fontFamily: widgetCfg.fontFamily }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ backgroundColor: widgetCfg.primaryColor }}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
            {widgetCfg.logoUrl
              ? <img src={widgetCfg.logoUrl} alt="logo" className="h-full w-full object-contain" />
              : <Bot className="h-5 w-5 text-white" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{widgetCfg.name}</h3>
            <p className="text-[10px] text-white/70 flex items-center gap-1 font-medium tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> ONLINE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/70">
          {messages.length > 0 && (
            <button
              onClick={startNewConversation}
              title="New conversation"
              className="p-2 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => { saveVisitorProfile(); setIsOpen(false); }}
            className="p-2 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Lead Capture Form */}
      {showLeadForm && (
        <form onSubmit={handleLeadSubmit} className="flex-1 flex flex-col justify-center px-5 py-6 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Before we start...</h3>
            <p className="text-xs text-slate-400">Enter your details to begin chatting.</p>
          </div>
          <input
            type="text"
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
          />
          <div>
            <input
              type="email"
              value={leadEmail}
              onChange={(e) => { setLeadEmail(e.target.value); setLeadError(""); }}
              placeholder="Your email *"
              required
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
            {leadError && <p className="text-xs text-red-400 mt-1">{leadError}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmittingLead}
            className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmittingLead ? "Starting..." : "Start Chat →"}
          </button>
        </form>
      )}

      {/* Exit Capture Banner */}
      {!showLeadForm && showExitCapture && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 animate-fade-up">
          <span className="text-base">👋</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white leading-snug">{exitCaptureMessage}</p>
          </div>
          <button
            onClick={() => setShowExitCapture(false)}
            className="text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Chat Area */}
      {!showLeadForm && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex justify-start gap-2">
              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                {widgetCfg.logoUrl
                  ? <img src={widgetCfg.logoUrl} alt="logo" className="h-full w-full object-contain" />
                  : <Bot className="h-4 w-4 text-white/70" />}
              </div>
              <div className="border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed" style={{ backgroundColor: `${widgetCfg.primaryColor}22`, color: widgetCfg.textColor }}>
                {widgetCfg.welcomeMessage}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            return (
              <div key={idx}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] leading-relaxed" style={{ backgroundColor: `${widgetCfg.primaryColor}33`, borderColor: `${widgetCfg.primaryColor}55`, border: "1px solid", color: widgetCfg.textColor }}>
                      {(msg as any).imagePreview && (
                        <img src={(msg as any).imagePreview} alt="Uploaded" className="max-h-32 rounded-lg mb-2 object-contain" />
                      )}
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex justify-start gap-2">
                      <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0 mt-1">
                        {widgetCfg.logoUrl
                          ? <img src={widgetCfg.logoUrl} alt="logo" className="h-full w-full object-contain" />
                          : <Bot className="h-4 w-4 text-white/70" />}
                      </div>
                      <div className="border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%] leading-relaxed prose prose-invert prose-sm max-w-none" style={{ backgroundColor: `${widgetCfg.bgColor}cc`, color: widgetCfg.textColor }}>
                        {msg.content ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : (
                          <span className="flex gap-1 items-center h-4">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Suggestion chips — only under the last assistant message */}
                    {isLast && suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-9">
                        {suggestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(q)}
                            className="text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer hover:opacity-80"
                            style={{ borderColor: `${widgetCfg.primaryColor}66`, color: widgetCfg.primaryColor }}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                    {isLast && products.length > 0 && (
                      <div className="mt-2 ml-9">
                        <ProductCards products={products} />
                      </div>
                    )}
                    {isLast && actions.length > 0 && (
                      <div className="mt-2 ml-9">
                        <ActionButtons actions={actions} />
                      </div>
                    )}
                    {isLast && booking && (
                      <div className="mt-3 ml-9">
                        <p className="text-sm font-medium text-white mb-3">
                          I can help you schedule {booking.name}! Pick a time that works:
                        </p>
                        {!showCalendly ? (
                          <button
                            onClick={() => setShowCalendly(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#006BFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0057d4] transition-colors"
                          >
                            📅 Schedule a Meeting
                          </button>
                        ) : (
                          <div className="rounded-xl overflow-hidden border border-[#006BFF]/30">
                            <iframe
                              src={`${booking.url}?embed_type=Inline&embed_domain=1`}
                              width="100%"
                              height="560"
                              style={{ border: "none" }}
                              title="Schedule a meeting"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Calendly sticky bar — outside scroll area, always visible when iframe is open */}
      {showCalendly && booking && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-[#006BFF]/10 border-t border-[#006BFF]/30">
          <span className="text-xs text-slate-400">Booking calendar open</span>
          <button
            onClick={handleBookingConfirmed}
            className="text-xs font-semibold text-[#006BFF] hover:underline flex items-center gap-1"
          >
            ✓ Already booked? Continue
          </button>
        </div>
      )}

      {/* Input Area */}
      {!showLeadForm && (
        <div className="p-3 border-t border-white/10" style={{ backgroundColor: widgetCfg.bgColor }}>
          {imageAttachment && (
            <div className="relative inline-block mb-2 ml-1">
              <img src={imageAttachment.previewUrl} alt="Upload preview" className="h-16 w-16 object-cover rounded-lg border border-border" />
              <button
                onClick={() => setImageAttachment(null)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <div className="relative flex items-end gap-2 rounded-xl border border-white/10 p-1 transition-all" style={{ backgroundColor: `${widgetCfg.bgColor}cc` }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Upload image to search"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={imageAttachment ? "Add a message or send image..." : (widgetCfg.placeholder || "Message...")}
              className="w-full max-h-32 min-h-[40px] bg-transparent text-sm placeholder-slate-500 border-0 focus:ring-0 resize-none py-2.5"
              style={{ color: widgetCfg.textColor }}
              rows={1}
              disabled={isStreaming}
            />
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !imageAttachment) || isStreaming}
              className="mb-1 mr-1 p-2 rounded-lg text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: widgetCfg.primaryColor }}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {showBranding && (
            <div className="mt-2 text-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
                Powered by <Bot className="h-3 w-3" /> AskYourSite
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
