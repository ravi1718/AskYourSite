"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, Paperclip, Send, ChevronDown, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendGAEvent } from "@next/third-parties/google";

const AYS_MARKER = "__AYS_";

interface AysMarkers {
  text: string;
  suggestions: string[];
  products: Product[];
  actions: Action[];
}

interface Product {
  name?: string;
  price?: string;
  image?: string;
  url?: string;
  description?: string;
}

interface Action {
  label: string;
  url?: string;
  style?: "primary" | "secondary";
  icon?: "cart" | "track" | "support";
}

function parseMarkers(raw: string): AysMarkers {
  const result: AysMarkers = { text: raw, suggestions: [], products: [], actions: [] };

  // Split at the first occurrence of ANY marker so products/actions render even if suggestions are missing
  const MARKERS = ["__AYS_SUGGESTIONS__", "__AYS_PRODUCTS__", "__AYS_ACTIONS__"] as const;
  const firstIdx = MARKERS.map(m => raw.indexOf(m)).filter(i => i !== -1);
  if (!firstIdx.length) return result;

  const splitAt = Math.min(...firstIdx);
  result.text = raw.substring(0, splitAt);
  const tail = raw.substring(splitAt);

  const sugsIdx = tail.indexOf("__AYS_SUGGESTIONS__");
  if (sugsIdx !== -1) {
    const afterSugs = tail.substring(sugsIdx + "__AYS_SUGGESTIONS__".length);
    const p = afterSugs.indexOf("__AYS_PRODUCTS__");
    const a = afterSugs.indexOf("__AYS_ACTIONS__");
    let sugsRaw = afterSugs;
    if (p !== -1) sugsRaw = afterSugs.substring(0, p);
    else if (a !== -1) sugsRaw = afterSugs.substring(0, a);
    try { result.suggestions = JSON.parse(sugsRaw.trim()); } catch { /* skip */ }
  }

  const prodsIdx = tail.indexOf("__AYS_PRODUCTS__");
  if (prodsIdx !== -1) {
    const afterProds = tail.substring(prodsIdx + "__AYS_PRODUCTS__".length);
    const a = afterProds.indexOf("__AYS_ACTIONS__");
    const prodsRaw = a !== -1 ? afterProds.substring(0, a) : afterProds;
    try { result.products = JSON.parse(prodsRaw.trim()); } catch { /* skip */ }
  }

  const actsIdx = tail.indexOf("__AYS_ACTIONS__");
  if (actsIdx !== -1) {
    const actsRaw = tail.substring(actsIdx + "__AYS_ACTIONS__".length);
    try { result.actions = JSON.parse(actsRaw.trim()); } catch { /* skip */ }
  }

  return result;
}

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
}: {
  assistantId?: string;
  showBranding?: boolean;
  leadCaptureEnabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lead capture state
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadError, setLeadError] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestions]);

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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          assistantId: assistantId ?? "preview",
          sessionId,
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
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <Bot className="h-6 w-6 group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] flex flex-col rounded-2xl border border-border bg-surface/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(59,130,246,0.2)] z-50 overflow-hidden animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-glow">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AskYourSite Agent</h3>
            <p className="text-[10px] text-primary flex items-center gap-1 font-medium tracking-wide">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> ONLINE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:text-white hover:bg-white/5 rounded-md transition-colors"
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

      {/* Chat Area */}
      {!showLeadForm && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="bg-background/80 border border-border text-slate-300 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[90%] leading-relaxed shadow-card">
                Hi! How can I help you today?
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            return (
              <div key={idx}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-primary/20 border border-primary/30 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[85%] leading-relaxed shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                      {(msg as any).imagePreview && (
                        <img src={(msg as any).imagePreview} alt="Uploaded" className="max-h-32 rounded-lg mb-2 object-contain" />
                      )}
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex justify-start">
                      <div className="bg-background/80 border border-border text-slate-300 rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[90%] leading-relaxed shadow-card prose prose-invert prose-sm max-w-none">
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
                      <div className="flex flex-wrap gap-2 mt-2 ml-1">
                        {suggestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(q)}
                            className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                    {isLast && products.length > 0 && (
                      <div className="mt-2">
                        <ProductCards products={products} />
                      </div>
                    )}
                    {isLast && actions.length > 0 && (
                      <div className="mt-2">
                        <ActionButtons actions={actions} />
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

      {/* Input Area */}
      {!showLeadForm && (
        <div className="p-3 bg-background border-t border-border">
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
          <div className="relative flex items-end gap-2 rounded-xl border border-border bg-surface p-1 shadow-inner focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-primary transition-colors shrink-0"
              title="Upload image to search"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={imageAttachment ? "Add a message or send image..." : "Message..."}
              className="w-full max-h-32 min-h-[40px] bg-transparent text-sm text-white placeholder-slate-500 border-0 focus:ring-0 resize-none py-2.5"
              rows={1}
              disabled={isStreaming}
            />
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !imageAttachment) || isStreaming}
              className="mb-1 mr-1 p-2 rounded-lg bg-primary text-white hover:bg-blue-400 transition-colors shrink-0 shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
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
