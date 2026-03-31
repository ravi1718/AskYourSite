"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Bot, Paperclip, Send, ChevronDown, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { sendGAEvent } from "@next/third-parties/google";

const SUGGESTIONS_DELIMITER = "__AYS_SUGGESTIONS__";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ImageAttachment {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

export function ChatWidget({ assistantId }: { assistantId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [imageAttachment, setImageAttachment] = useState<ImageAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      let mainBuffer = "";
      let suggestionsBuffer = "";
      let delimiterFound = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (delimiterFound) {
          suggestionsBuffer += chunk;
        } else {
          mainBuffer += chunk;
          const delimIdx = mainBuffer.indexOf(SUGGESTIONS_DELIMITER);
          if (delimIdx !== -1) {
            delimiterFound = true;
            const cleanText = mainBuffer.substring(0, delimIdx);
            suggestionsBuffer = mainBuffer.substring(delimIdx + SUGGESTIONS_DELIMITER.length);
            mainBuffer = cleanText;
          }
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: mainBuffer };
            return updated;
          });
        }
      }

      // Parse suggestions after stream fully ends
      if (delimiterFound && suggestionsBuffer) {
        try {
          const parsed = JSON.parse(suggestionsBuffer.trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSuggestions(parsed);
          }
        } catch {
          // malformed suggestions — skip silently
        }
      }
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

      {/* Chat Area */}
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
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-background border-t border-border">
        {/* Image preview */}
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
        <div className="mt-2 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
            Powered by <Bot className="h-3 w-3" /> AskYourSite
          </span>
        </div>
      </div>
    </div>
  );
}
