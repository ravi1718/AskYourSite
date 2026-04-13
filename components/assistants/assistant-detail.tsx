"use client";

import { useState, useRef, useCallback } from "react";
import { AYS_MARKER, parseMarkers, type BookingPayload } from "@/lib/chat/parse-markers";
import ReactMarkdown from "react-markdown";
import { Bot, Check, Code, Copy, Globe, Paperclip, RefreshCcw, Send, Settings, Paintbrush, Upload, Save, X, FileText, MessageSquareText, ArrowLeft, ShieldCheck, Zap, GitBranch } from "lucide-react";
import { AgentTab } from "./agent-tab";
import { WorkflowTab } from "./workflow-tab";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Outfit", value: "Outfit" },
  { label: "Poppins", value: "Poppins" },
  { label: "System Default", value: "system-ui" },
];

const TONE_OPTIONS = [
  { label: "Helpful", value: "helpful" },
  { label: "Professional", value: "professional" },
  { label: "Friendly", value: "friendly" },
  { label: "Casual", value: "casual" },
  { label: "Formal", value: "formal" },
];

const ROLE_OPTIONS = [
  { label: "General Assistant", value: "general" },
  { label: "Sales Agent", value: "sales" },
  { label: "Customer Support", value: "support" },
  { label: "Documentation Assistant", value: "docs" },
  { label: "HR Assistant", value: "hr" },
  { label: "E-Commerce Shopping", value: "ecommerce" },
];

export function AssistantDetailClient({ assistant, sources, userId, imageSearchEnabled = false, featureFlags = {} }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"preview" | "train" | "design" | "automate" | "install">("preview");

  // Widget config state
  const defaultConfig = {
    primaryColor: "#3b82f6",
    bgColor: "#0f172a",
    textColor: "#f8fafc",
    fontFamily: "Inter",
    systemPrompt: "",
    logoUrl: "",
    role: "general",
    tone: assistant.tone || "helpful",
    placeholder: "Ask me anything...",
    welcomeMessage: assistant.welcome_message || "Hi! How can I help you today?",
    removeBranding: false,
    leadCaptureEnabled: false,
    exitCaptureEnabled: false,
    exitCaptureMessage: "Before you go — can I help you with anything else?",
    incentiveText: "",
    checkoutUrl: "",
    orderTrackingUrl: "",
    supportUrl: "",
    orderWebhookUrl: "",
    notificationEnabled: false,
    notificationMessage1: "",
    notificationMessage2: "",
    notificationDelay: 4,
  };
  const [widgetConfig, setWidgetConfig] = useState<Record<string, any>>({
    ...defaultConfig,
    ...(assistant.widget_config || {}),
  });
  const [savingSection, setSavingSection] = useState<number | null>(null);
  const [saveResult, setSaveResult] = useState<string | null>(null);
  const [saveResultSection, setSaveResultSection] = useState<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const updateConfig = (key: string, value: string) => {
    setWidgetConfig((prev) => ({ ...prev, [key]: value }));
    setSaveResult(null);
  };

  const handleSaveAppearance = async (section: number) => {
    setSavingSection(section);
    setSaveResult(null);
    setSaveResultSection(null);
    try {
      const res = await fetch("/api/assistants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantId: assistant.id,
          userId,
          widgetConfig,
          welcomeMessage: widgetConfig.welcomeMessage,
          tone: widgetConfig.tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaveResult("Saved!");
      setSaveResultSection(section);
    } catch (err: any) {
      setSaveResult(`Error: ${err.message}`);
      setSaveResultSection(section);
    } finally {
      setSavingSection(null);
    }
  };

  // Cropper states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [logoFileUrl, setLogoFileUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    setLogoFileUrl(URL.createObjectURL(file));
    setCropModalOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleLogoCropConfirm = async () => {
    if (!logoFileUrl || !croppedAreaPixels) return;
    setIsUploadingLogo(true);
    setCropModalOpen(false);

    try {
      const croppedImageFile = await getCroppedImg(logoFileUrl, croppedAreaPixels, logoFileName);
      if (!croppedImageFile) throw new Error("Failed to crop image");

      const formData = new FormData();
      formData.append("file", croppedImageFile);
      formData.append("assistantId", assistant.id);
      formData.append("userId", userId);
      const res = await fetch("/api/assistants/upload-logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      updateConfig("logoUrl", data.logoUrl);
      setSaveResult("Logo updated! Click Save Appearance to confirm.");
    } catch (err: any) {
      setSaveResult(`Logo error: ${err.message}`);
    } finally {
      setIsUploadingLogo(false);
      setLogoFileUrl(null);
    }
  };
  
  // Data ingestion state
  const [scrapeUrl, setScrapeUrl] = useState(assistant.website_url || "");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const [crawlProgress, setCrawlProgress] = useState<string | null>(null);

  // Multimodal Data ingestion state
  const [plainText, setPlainText] = useState("");
  const [isIngestingText, setIsIngestingText] = useState(false);
  const [isIngestingFiles, setIsIngestingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat preview state
  const [chatInput, setChatInput] = useState("");
  const [chatSessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: assistant.welcome_message || "Hi, I am your AI assistant. How can I help?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([]);
  const [chatBooking, setChatBooking] = useState<BookingPayload | null>(null);
  const [chatImage, setChatImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Embed copy state
  const [copied, setCopied] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<"vanilla" | "nextjs" | "react" | "shopify">("vanilla");

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const embedCode = `<script
  src="${origin}/embed.js"
  data-agent-id="${assistant.id}"
  async
></script>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBlock = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(key);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const handleScrapeAndIngest = async () => {
    if (!scrapeUrl) return;
    setIsScraping(true);
    setScrapeResult(null);
    setCrawlProgress("Starting full-site crawl...");

    try {
      // 1. Crawl the entire website (all pages)
      setCrawlProgress("Crawling website — discovering all pages (this may take 1-2 minutes)...");
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl })
      });
      const crawlData = await crawlRes.json();
      
      if (!crawlRes.ok || !crawlData.success) {
        throw new Error(crawlData.error || "Failed to crawl website");
      }

      const pages = crawlData.pages || [];
      setCrawlProgress(`Discovered ${pages.length} page${pages.length !== 1 ? 's' : ''}. Starting training...`);

      if (pages.length === 0) {
        throw new Error("No pages with content found on the website");
      }

      // 2. Ingest each page into pgvector
      let totalChunks = 0;
      let pagesProcessed = 0;
      const errors: string[] = [];

      for (const page of pages) {
        pagesProcessed++;
        setCrawlProgress(`Training on page ${pagesProcessed} of ${pages.length}: ${page.url}`);

        try {
          const ingestRes = await fetch("/api/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              markdown: page.markdown,
              assistantId: assistant.id,
              sourceUrl: page.url
            })
          });
          const ingestData = await ingestRes.json();
          
          if (!ingestRes.ok || !ingestData.success) {
            errors.push(`${page.url}: ${ingestData.error || "Failed to ingest"}`);
            continue;
          }

          totalChunks += ingestData.chunksProcessed || 0;
        } catch (err: any) {
          errors.push(`${page.url}: ${err.message}`);
        }
      }

      if (totalChunks === 0 && errors.length > 0) {
        throw new Error(`Failed to process any pages. Errors: ${errors.join("; ")}`);
      }

      const errorSuffix = errors.length > 0 ? ` (${errors.length} page${errors.length !== 1 ? 's' : ''} failed)` : "";
      setScrapeResult(`Successfully trained on ${totalChunks} data chunks from ${pagesProcessed - errors.length} pages${errorSuffix}.`);
      setCrawlProgress(null);
      router.refresh();
    } catch (err: any) {
      setScrapeResult(`Error: ${err.message}`);
      setCrawlProgress(null);
    } finally {
      setIsScraping(false);
    }
  };

  const handleTextIngest = async () => {
    if (!plainText.trim()) return;
    setIsIngestingText(true);
    setScrapeResult(null);
    setCrawlProgress("Ingesting plain text...");

    try {
      const ingestRes = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown: plainText,
          assistantId: assistant.id,
          sourceUrl: `Manual Text Input - ${new Date().toLocaleString()}`
        })
      });
      const ingestData = await ingestRes.json();
      
      if (!ingestRes.ok || !ingestData.success) {
        throw new Error(ingestData.error || "Failed to ingest text");
      }

      setScrapeResult(`Successfully trained on ${ingestData.chunksProcessed || 0} chunks from plain text.`);
      setPlainText("");
      router.refresh();
    } catch (err: any) {
      setScrapeResult(`Error: ${err.message}`);
    } finally {
      setIsIngestingText(false);
      setCrawlProgress(null);
    }
  };

  const handleFileIngest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsIngestingFiles(true);
    setScrapeResult(null);

    let totalChunks = 0;
    let filesProcessed = 0;
    const errors: string[] = [];

    for (const file of files) {
      setCrawlProgress(`Parsing and ingesting ${file.name}...`);
      try {
        let text = "";

        if (file.name.toLowerCase().endsWith('.pdf')) {
          const formData = new FormData();
          formData.append('file', file);
          
          const parseRes = await fetch('/api/parse-pdf', {
            method: 'POST',
            body: formData,
          });
          const parseData = await parseRes.json();
          if (!parseRes.ok || !parseData.success) {
            throw new Error(parseData.error || "Failed to parse PDF document");
          }
          text = parseData.text;
        } else {
          text = await file.text();
        }

        const ingestRes = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markdown: text,
            assistantId: assistant.id,
            sourceUrl: file.name
          })
        });
        const ingestData = await ingestRes.json();
        
        if (!ingestRes.ok || !ingestData.success) {
          errors.push(`${file.name}: ${ingestData.error || "Failed"}`);
          continue;
        }

        totalChunks += ingestData.chunksProcessed || 0;
        filesProcessed++;
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    if (totalChunks === 0 && errors.length > 0) {
      setScrapeResult(`Error: ${errors.join("; ")}`);
    } else {
      const errorSuffix = errors.length > 0 ? ` (${errors.length} failed)` : "";
      setScrapeResult(`Successfully trained on ${totalChunks} chunks from ${filesProcessed} local files${errorSuffix}.`);
      router.refresh();
    }

    setIsIngestingFiles(false);
    setCrawlProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelectPlayground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
      setChatImage({ base64, mimeType, previewUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? chatInput).trim();
    if (!text && !chatImage) return;

    setChatSuggestions([]);
    setChatBooking(null);
    const currentImage = chatImage;
    setChatImage(null);
    const userContent = text || "🔍 Image search";
    const newMessages = [...messages, { role: "user", content: userContent, imagePreview: currentImage?.previewUrl }];
    setMessages(newMessages);
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
          assistantId: assistant.id,
          sessionId: chatSessionId,
          ...(currentImage && {
            imageBase64: currentImage.base64,
            imageMimeType: currentImage.mimeType,
          }),
        })
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        let fullRawResponse = "";
        let markerFound = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullRawResponse += chunk;

          if (!markerFound) {
            const markerIdx = fullRawResponse.indexOf(AYS_MARKER);
            const displayText = markerIdx !== -1
              ? (markerFound = true, fullRawResponse.substring(0, markerIdx))
              : fullRawResponse;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: displayText };
              return updated;
            });
          }
        }

        // Parse all markers once stream ends
        const parsed = parseMarkers(fullRawResponse);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: parsed.text };
          return updated;
        });
        if (parsed.suggestions.length > 0) setChatSuggestions(parsed.suggestions);
        if (parsed.booking) setChatBooking(parsed.booking);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to AI." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="py-6">
      <Link href="/dashboard/assistants" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Assistants
      </Link>
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-display font-semibold text-white tracking-tight mb-2">
            {assistant.name}
          </h1>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {assistant.website_url || "No website URL linked"}
          </p>
        </div>
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary uppercase tracking-wider">
            {assistant.status}
          </span>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="lg:w-64 shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === "preview" ? "bg-primary text-white shadow-glow" : "text-slate-400 hover:bg-surface hover:text-white"
            )}
          >
            <Bot className="h-5 w-5" />
            Playground Preview
          </button>
          <button
            onClick={() => setActiveTab("train")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === "train" ? "bg-primary text-white shadow-glow" : "text-slate-400 hover:bg-surface hover:text-white"
            )}
          >
            <RefreshCcw className="h-5 w-5" />
            Train
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === "design" ? "bg-primary text-white shadow-glow" : "text-slate-400 hover:bg-surface hover:text-white"
            )}
          >
            <Paintbrush className="h-5 w-5" />
            Design
          </button>
          <Link
            href={`/dashboard/assistants/${assistant.id}/overrides`}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:bg-surface hover:text-white"
          >
            <ShieldCheck className="h-5 w-5" />
            Response Rules
          </Link>
          <button
            onClick={() => setActiveTab("automate")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === "automate" ? "bg-violet-600/20 text-violet-300 border border-violet-500/30" : "text-slate-400 hover:bg-surface hover:text-white"
            )}
          >
            <Zap className="h-5 w-5" />
            Automate
          </button>
          <button
            onClick={() => setActiveTab("install")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors border mt-4",
              activeTab === "install" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-border text-slate-400 hover:bg-surface hover:text-white"
            )}
          >
            <Code className="h-5 w-5" />
            Install on Website
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === "preview" && (
            <div className="animate-fade-up">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Playground</h2>
                <p className="text-sm text-slate-400">Test your assistant's knowledge base and responses.</p>
              </div>
              
              <div className="border border-border bg-background rounded-2xl shadow-card flex flex-col h-[600px] overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex gap-3 max-w-[85%]",
                      m.role === "assistant" ? "self-start" : "self-end ml-auto flex-row-reverse"
                    )}>
                      {m.role === "assistant" && (
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 mt-1 overflow-hidden">
                           {widgetConfig?.logoUrl ? (
                             <img src={widgetConfig.logoUrl} alt="Bot" className="w-full h-full object-contain bg-white" />
                           ) : (
                             <Bot className="h-4 w-4 text-primary" />
                           )}
                        </div>
                      )}
                      <div className={cn(
                        "px-4 py-3 text-sm rounded-2xl shadow-sm",
                        m.role === "assistant" 
                          ? "bg-surface border border-border text-slate-300 rounded-tl-sm" 
                          : "bg-primary/20 border border-primary/30 text-white rounded-tr-sm"
                      )}>
                        {m.role !== "assistant" && m.imagePreview && (
                          <img src={m.imagePreview} alt="Uploaded" className="max-h-32 rounded-lg mb-2 object-contain block" />
                        )}
                        {m.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_a]:text-primary [&_a]:underline [&_strong]:text-white [&_strong]:font-semibold [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2">
                            <ReactMarkdown
                              components={{
                                code({ className, children, ...props }) {
                                  const isBlock = className?.includes('language-');
                                  if (isBlock) {
                                    return (
                                      <pre className="bg-background border border-border rounded-lg p-3 my-2 overflow-x-auto">
                                        <code className={cn("text-xs text-emerald-400", className)} {...props}>
                                          {children}
                                        </code>
                                      </pre>
                                    );
                                  }
                                  return (
                                    <code className="bg-background border border-border px-1.5 py-0.5 rounded text-xs text-emerald-400" {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                                pre({ children }) {
                                  return <>{children}</>;
                                },
                              }}
                            >
                              {m.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Suggestion chips — shown after last assistant message */}
                  {!isTyping && chatSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-11">
                      {chatSuggestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(q)}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Booking card — shown when assistant detects booking intent */}
                  {!isTyping && chatBooking && (
                    <div className="ml-11 mt-1">
                      <p className="text-sm font-medium text-white mb-3">
                        I can help you schedule {chatBooking.name}! Pick a time that works:
                      </p>
                      <div className="rounded-xl overflow-hidden border border-[#006BFF]/30">
                        <iframe
                          src={`${chatBooking.url}?embed_type=Inline&embed_domain=1`}
                          width="100%"
                          height="630"
                          frameBorder={0}
                          title="Schedule a meeting"
                        />
                      </div>
                    </div>
                  )}

                  {isTyping && (
                    <div className="bg-surface border border-border rounded-2xl rounded-tl-sm self-start px-4 py-3 text-sm text-slate-400 flex items-center gap-2 max-w-[85%]">
                      <span className="flex gap-1">
                        <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce"></span>
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-surface border-t border-border space-y-2">
                  {/* Image preview */}
                  {chatImage && (
                    <div className="relative inline-block">
                      <img src={chatImage.previewUrl} alt="Upload preview" className="h-16 w-16 object-cover rounded-lg border border-border" />
                      <button
                        onClick={() => setChatImage(null)}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                  {imageSearchEnabled && (
                    <input ref={chatFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelectPlayground} />
                  )}
                  <div className="relative flex items-center gap-2">
                    {imageSearchEnabled && (
                      <button
                        type="button"
                        onClick={() => chatFileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-primary transition-colors shrink-0"
                        title="Upload image to search"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                    )}
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={chatImage ? "Add a message or send image..." : "Ask the agent a question..."}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={isTyping || (!chatInput.trim() && !chatImage)}
                      className="bg-primary text-white hover:bg-blue-400 px-4 py-3 h-auto absolute right-1 rounded-lg"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "train" && (
            <div className="animate-fade-up">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white">Live Data Training</h2>
                <p className="text-sm text-slate-400">Crawl your entire website and vectorize all pages into the agent's memory using Firecrawl and Gemini Embeddings.</p>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-8">
                {/* 1. URL */}
                <div>
                  <label className="text-sm font-semibold text-white block mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Target Website URL
                  </label>
                  <p className="text-xs text-slate-400 mb-3">Crawl and vectorize an entire website automatically using Firecrawl.</p>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 shadow-inner"
                    />
                    <Button 
                      onClick={handleScrapeAndIngest}
                      disabled={isScraping || !scrapeUrl}
                      className="bg-primary hover:bg-blue-500 text-white min-w-[140px] gap-2 shadow-glow"
                    >
                      {isScraping ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                      {isScraping ? "Crawling..." : "Crawl & Train"}
                    </Button>
                  </div>
                </div>

                <hr className="border-border" />

                {/* 2. Upload Document */}
                <div>
                  <label className="text-sm font-semibold text-white block mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Upload Documents
                  </label>
                  <p className="text-xs text-slate-400 mb-3">Upload local text, markdown, or JSON files to train the agent.</p>
                  <div className="flex gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".txt,.md,.csv,.json,.pdf"
                      onChange={handleFileIngest}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isIngestingFiles}
                      className="bg-surface border border-border hover:bg-border text-white min-w-[120px] gap-2 shadow-sm w-full py-8 border-dashed"
                    >
                      {isIngestingFiles ? <RefreshCcw className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
                      {isIngestingFiles ? "Processing..." : "Select Files (.pdf, .txt, .md, .csv)"}
                    </Button>
                  </div>
                </div>

                <hr className="border-border" />

                {/* 3. Plain Text */}
                <div>
                  <label className="text-sm font-semibold text-white block mb-2 flex items-center gap-2">
                    <MessageSquareText className="h-4 w-4 text-primary" /> Plain Text Data
                  </label>
                  <p className="text-xs text-slate-400 mb-3">Paste raw text data, FAQs, or internal notes directly.</p>
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={plainText}
                      onChange={(e) => setPlainText(e.target.value)}
                      placeholder="Paste your content here..."
                      rows={4}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 shadow-inner resize-y"
                    />
                    <Button 
                      onClick={handleTextIngest}
                      disabled={isIngestingText || !plainText.trim()}
                      className="bg-primary hover:bg-blue-500 text-white gap-2 shadow-glow w-fit self-end"
                    >
                      {isIngestingText ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {isIngestingText ? "Ingesting..." : "Train on Text"}
                    </Button>
                  </div>
                </div>

                {/* Status Messages */}
                {(crawlProgress || scrapeResult) && (
                  <div className="pt-2 border-t border-border mt-6">
                    {crawlProgress && (
                      <div className="px-4 py-3 rounded-xl border text-sm flex items-center gap-2 bg-primary/10 border-primary/20 text-primary animate-pulse mb-3">
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                        {crawlProgress}
                      </div>
                    )}

                    {scrapeResult && (
                      <div className={cn(
                        "px-4 py-3 rounded-xl border text-sm flex items-center gap-2",
                        scrapeResult.includes("Error") 
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      )}>
                        {scrapeResult.includes("Error") ? <RefreshCcw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        {scrapeResult}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">Ingested Documents</h3>
                {sources.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border border-dashed border-border text-slate-500 text-sm">
                    No data sources trained yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sources.map((src: any) => (
                      <div key={src.id} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
                        <span className="text-sm text-slate-300 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" />
                          {src.source_url}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(src.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "design" && (
            <div className="animate-fade-up">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Edit Appearance</h2>
                  <p className="text-sm text-slate-400">Customize your chat widget's look, behavior, and branding.</p>
                </div>
                <div className="flex items-center gap-3">
                  {saveResult && (
                    <span className={cn("text-sm font-medium", saveResult.includes("Error") ? "text-rose-400" : "text-emerald-400")}>
                      {saveResult.includes("Error") ? saveResult : <span className="flex items-center gap-1"><Check className="h-4 w-4" />{saveResult}</span>}
                    </span>
                  )}
                  <Button onClick={() => handleSaveAppearance(1)} disabled={savingSection !== null} className="bg-primary hover:bg-blue-500 text-white gap-2 shadow-glow">
                    {savingSection !== null ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {savingSection !== null ? "Saving..." : "Save All Changes"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[260px_1fr_280px]">
                {/* ── Left column: Look & Feel ── */}
                <div className="space-y-5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Look &amp; Feel</p>

                  {/* Colors */}
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">Colors</p>
                    <div className="space-y-2">
                      {[
                        { label: "Primary", key: "primaryColor" },
                        { label: "Background", key: "bgColor" },
                        { label: "Text", key: "textColor" },
                      ].map(({ label, key }) => (
                        <div key={key} className="flex items-center gap-2">
                          <input type="color" value={widgetConfig[key]} onChange={(e) => updateConfig(key, e.target.value)} className="h-8 w-8 rounded-lg border border-border cursor-pointer bg-transparent shrink-0" />
                          <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                          <input type="text" value={widgetConfig[key]} onChange={(e) => updateConfig(key, e.target.value)} className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 py-1.5 text-white text-xs outline-none focus:border-primary/50" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-800" />

                  {/* Font & Tone */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">Font &amp; Tone</p>
                    <select value={widgetConfig.fontFamily} onChange={(e) => updateConfig("fontFamily", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50 cursor-pointer">
                      {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                    <select value={widgetConfig.tone} onChange={(e) => updateConfig("tone", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50 cursor-pointer">
                      {TONE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="border-t border-slate-800" />

                  {/* Role */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">Assistant Role</p>
                    <select value={widgetConfig.role || "general"} onChange={(e) => updateConfig("role", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50 cursor-pointer">
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>

                  <div className="border-t border-slate-800" />

                  {/* Messages */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">Messages</p>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Welcome Message</label>
                      <input type="text" value={widgetConfig.welcomeMessage} onChange={(e) => updateConfig("welcomeMessage", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50" placeholder="Hi! How can I help you today?" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Input Placeholder</label>
                      <input type="text" value={widgetConfig.placeholder} onChange={(e) => updateConfig("placeholder", e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50" placeholder="Ask me anything..." />
                    </div>
                  </div>
                </div>

                {/* ── Center column: Live Preview ── */}
                <div className="lg:sticky lg:top-8 self-start">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Live Preview</p>
                  <div className="rounded-2xl border border-border overflow-hidden shadow-card" style={{ backgroundColor: widgetConfig.bgColor, fontFamily: widgetConfig.fontFamily }}>
                    <div className="px-4 py-3 flex items-center gap-4 border-b border-white/10" style={{ backgroundColor: widgetConfig.primaryColor }}>
                      {widgetConfig.logoUrl ? (
                        <img src={widgetConfig.logoUrl} alt="Logo" className="w-[48px] h-[48px] rounded-full object-contain bg-white/10 p-1 shrink-0" />
                      ) : (
                        <div className="w-[48px] h-[48px] rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-white">{assistant.name}</span>
                    </div>
                    {widgetConfig.leadCaptureEnabled ? (
                      <div className="p-5 min-h-[340px] flex flex-col justify-center gap-4">
                        <div>
                          <p className="text-sm font-semibold mb-0.5" style={{ color: widgetConfig.textColor }}>Before we start...</p>
                          <p className="text-xs opacity-60" style={{ color: widgetConfig.textColor }}>Enter your details to begin chatting.</p>
                        </div>
                        <input readOnly placeholder="Your name (optional)" className="w-full rounded-xl px-3 py-2.5 text-xs border border-white/10 outline-none opacity-80" style={{ backgroundColor: `${widgetConfig.bgColor}cc`, color: widgetConfig.textColor }} />
                        <input readOnly placeholder="Your email *" className="w-full rounded-xl px-3 py-2.5 text-xs border border-white/10 outline-none opacity-80" style={{ backgroundColor: `${widgetConfig.bgColor}cc`, color: widgetConfig.textColor }} />
                        <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: widgetConfig.primaryColor }}>Start Chat →</button>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 min-h-[340px] flex flex-col justify-end">
                          <div className="flex gap-2 items-end self-start max-w-[85%]">
                            <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center overflow-hidden mb-1" style={{ backgroundColor: `${widgetConfig.primaryColor}30` }}>
                              {widgetConfig.logoUrl ? (
                                <img src={widgetConfig.logoUrl} alt="Bot" className="w-full h-full object-contain bg-white" />
                              ) : (
                                <Bot className="h-3.5 w-3.5" style={{ color: widgetConfig.primaryColor }} />
                              )}
                            </div>
                            <div className="rounded-xl px-3 py-2 text-xs border border-white/10" style={{ backgroundColor: `${widgetConfig.primaryColor}15`, color: widgetConfig.textColor, borderBottomLeftRadius: 4 }}>
                              {widgetConfig.welcomeMessage || "Hi! How can I help?"}
                            </div>
                          </div>
                        </div>
                        <div className="px-4 pb-4">
                          <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5" style={{ backgroundColor: `${widgetConfig.bgColor}cc` }}>
                            <span className="text-xs flex-1 opacity-50" style={{ color: widgetConfig.textColor }}>{widgetConfig.placeholder || "Ask me anything..."}</span>
                            <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: widgetConfig.primaryColor }}>
                              <Send className="h-3 w-3 text-white" />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {!widgetConfig.removeBranding && (
                      <div className="px-4 pb-3 text-center">
                        <span className="text-[10px] opacity-40 uppercase tracking-widest font-semibold flex items-center justify-center gap-1" style={{ color: widgetConfig.textColor }}>
                          <Bot className="h-2.5 w-2.5" /> Powered by AskYourSite
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right column: Branding & Behaviour ── */}
                <div className="space-y-5">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Branding &amp; Behaviour</p>

                  {/* Logo */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">Widget Logo</p>
                    <div className="flex items-center gap-3">
                      {widgetConfig.logoUrl ? (
                        <img src={widgetConfig.logoUrl} alt="Widget logo" className="h-12 w-12 rounded-xl object-cover border border-border" />
                      ) : (
                        <div className="h-12 w-12 rounded-xl bg-background border border-dashed border-border flex items-center justify-center">
                          <Bot className="h-5 w-5 text-slate-600" />
                        </div>
                      )}
                      <div>
                        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
                        <button onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo} className="text-xs px-3 py-1.5 rounded-lg border border-border text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                          {isUploadingLogo ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                        </button>
                        <p className="text-[10px] text-slate-600 mt-1">PNG, JPG, SVG · 64×64px</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800" />

                  {/* System Prompt */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">System Prompt</p>
                    <textarea value={widgetConfig.systemPrompt} onChange={(e) => updateConfig("systemPrompt", e.target.value)} rows={4} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50 resize-none" placeholder="e.g., Always greet the user by name..." />
                  </div>

                  <div className="border-t border-slate-800" />

                  {/* Feature Toggles */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">Features</p>
                    {[
                      { key: "removeBranding", label: "Remove Branding", desc: "Hide 'Powered by AskYourSite'", gate: featureFlags.remove_branding },
                      { key: "leadCaptureEnabled", label: "Lead Capture Form", desc: "Ask for email before chatting", gate: featureFlags.lead_capture },
                      { key: "exitCaptureEnabled", label: "Exit Capture", desc: "Show message when visitor leaves", gate: true },
                    ].filter(({ gate }) => gate !== false).map(({ key, label, desc }) => (
                      <div key={key} onClick={() => setWidgetConfig((c: any) => ({ ...c, [key]: !c[key] }))} className={cn("flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none", widgetConfig[key] ? "border-primary/50 bg-primary/5" : "border-border hover:border-slate-600")}>
                        <div>
                          <p className="text-xs font-medium text-white">{label}</p>
                          <p className="text-[10px] text-slate-500">{desc}</p>
                        </div>
                        <div className={cn("relative w-10 h-5 rounded-full transition-all duration-200 shrink-0", widgetConfig[key] ? "bg-primary" : "bg-slate-700")}>
                          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200", widgetConfig[key] ? "translate-x-5" : "translate-x-0.5")} />
                        </div>
                      </div>
                    ))}
                    {widgetConfig.exitCaptureEnabled && (
                      <input type="text" value={widgetConfig.exitCaptureMessage || ""} onChange={(e) => setWidgetConfig((c: any) => ({ ...c, exitCaptureMessage: e.target.value }))} placeholder="Before you go — can I help you with anything else?" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50" />
                    )}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-500">Incentive Message <span className="text-slate-600">(optional)</span></p>
                      <input type="text" value={widgetConfig.incentiveText || ""} onChange={(e) => setWidgetConfig((c: any) => ({ ...c, incentiveText: e.target.value }))} placeholder='e.g. "Use code CHAT10 for 10% off!"' className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50" />
                    </div>
                  </div>

                  <div className="border-t border-slate-800" />

                  {/* Notification Bubbles */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-slate-600">Chat Bubble Notifications</p>
                    <div onClick={() => setWidgetConfig((c: any) => ({ ...c, notificationEnabled: !c.notificationEnabled }))} className={cn("flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all select-none", widgetConfig.notificationEnabled ? "border-primary/50 bg-primary/5" : "border-border hover:border-slate-600")}>
                      <div>
                        <p className="text-xs font-medium text-white">Enable Notification Bubbles</p>
                        <p className="text-[10px] text-slate-500">Show speech bubbles above the chat button</p>
                      </div>
                      <div className={cn("relative w-10 h-5 rounded-full transition-all duration-200 shrink-0", widgetConfig.notificationEnabled ? "bg-primary" : "bg-slate-700")}>
                        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200", widgetConfig.notificationEnabled ? "translate-x-5" : "translate-x-0.5")} />
                      </div>
                    </div>
                    {widgetConfig.notificationEnabled && (
                      <div className="space-y-2 pl-1">
                        <input type="text" value={widgetConfig.notificationMessage1 || ""} onChange={(e) => setWidgetConfig((c: any) => ({ ...c, notificationMessage1: e.target.value }))} placeholder="Message 1 (required)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50" />
                        <input type="text" value={widgetConfig.notificationMessage2 || ""} onChange={(e) => setWidgetConfig((c: any) => ({ ...c, notificationMessage2: e.target.value }))} placeholder="Message 2 (optional)" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-primary/50" />
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-500 shrink-0">Show after</p>
                          <select value={widgetConfig.notificationDelay ?? 4} onChange={(e) => setWidgetConfig((c: any) => ({ ...c, notificationDelay: Number(e.target.value) }))} className="bg-background border border-border rounded-lg px-2 py-1 text-white text-xs outline-none focus:border-primary/50 cursor-pointer">
                            {[2, 4, 8, 15].map((s) => <option key={s} value={s}>{s}s</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}


          {activeTab === "install" && (
            <div className="animate-fade-up space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Install on your website</h2>
                <p className="text-sm text-slate-400 mt-1">Choose your platform below to get step-by-step setup instructions.</p>
              </div>

              {/* Framework selector */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Choose your platform</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {([
                    { id: "vanilla", icon: "</>", label: "Vanilla JS", desc: "Plain HTML websites" },
                    { id: "nextjs",  icon: "▲",   label: "Next.js",   desc: "App Router or Pages Router" },
                    { id: "react",   icon: "⚛",   label: "React",     desc: "CRA or Vite apps" },
                    { id: "shopify", icon: "🛍",   label: "Shopify",   desc: "Storefront themes" },
                  ] as const).map((fw) => (
                    <button
                      key={fw.id}
                      onClick={() => setSelectedFramework(fw.id)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all",
                        selectedFramework === fw.id
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-border text-slate-400 hover:border-slate-500 hover:text-white"
                      )}
                    >
                      <span className="text-2xl leading-none">{fw.icon}</span>
                      <span className="text-sm font-semibold">{fw.label}</span>
                      <span className="text-xs opacity-70">{fw.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Vanilla JS instructions */}
              {selectedFramework === "vanilla" && (
                <div className="space-y-5">
                  <p className="text-sm font-semibold text-slate-300">Setup Instructions — Vanilla JS</p>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Step 1 — Copy your embed code</p>
                    <div className="relative">
                      <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{embedCode}</code></pre>
                      <Button onClick={copyEmbed} variant="ghost" className="absolute top-2 right-2 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-2">
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-2 text-xs">{copied ? "Copied" : "Copy code"}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Step 2 — Open your HTML file and paste just before <code className="text-primary bg-primary/10 px-1 rounded">&lt;/body&gt;</code></p>
                    <div className="relative">
                      <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{`<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <!-- your content -->

    ${embedCode}
  </body>
</html>`}</code></pre>
                    </div>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-slate-400">
                    Step 3 — Save the file and reload your site. The chat widget appears automatically in the bottom-right corner.
                  </div>
                </div>
              )}

              {/* Next.js instructions */}
              {selectedFramework === "nextjs" && (() => {
                const appRouterCode = `// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${origin}/embed.js"
          data-agent-id="${assistant.id}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}`;
                const pagesRouterCode = `// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
        <script
          src="${origin}/embed.js"
          data-agent-id="${assistant.id}"
          async
        />
      </body>
    </Html>
  )
}`;
                return (
                  <div className="space-y-5">
                    <p className="text-sm font-semibold text-slate-300">Setup Instructions — Next.js</p>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Step 1 — Copy your agent ID</p>
                      <div className="relative">
                        <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{assistant.id}</code></pre>
                        <Button onClick={() => copyBlock("agentid", assistant.id)} variant="ghost" className="absolute top-2 right-2 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-2">
                          {copiedBlock === "agentid" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2 text-xs">{copiedBlock === "agentid" ? "Copied" : "Copy"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Step 2 — App Router: add to <code className="text-primary bg-primary/10 px-1 rounded">app/layout.tsx</code></p>
                      <div className="relative">
                        <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{appRouterCode}</code></pre>
                        <Button onClick={() => copyBlock("nextapp", appRouterCode)} variant="ghost" className="absolute top-2 right-2 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-2">
                          {copiedBlock === "nextapp" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2 text-xs">{copiedBlock === "nextapp" ? "Copied" : "Copy"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Step 2 (alternative) — Pages Router: add to <code className="text-primary bg-primary/10 px-1 rounded">pages/_document.tsx</code></p>
                      <div className="relative">
                        <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{pagesRouterCode}</code></pre>
                        <Button onClick={() => copyBlock("nextpages", pagesRouterCode)} variant="ghost" className="absolute top-2 right-2 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-2">
                          {copiedBlock === "nextpages" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2 text-xs">{copiedBlock === "nextpages" ? "Copied" : "Copy"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-slate-400">
                      Step 3 — Run <code className="text-primary bg-primary/10 px-1 rounded">npm run dev</code> or deploy. The widget loads on every page automatically. The <code className="text-slate-300">strategy="lazyOnload"</code> flag ensures it doesn't block your page render.
                    </div>
                  </div>
                );
              })()}

              {/* React instructions */}
              {selectedFramework === "react" && (() => {
                const indexHtmlCode = `<!-- public/index.html -->
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <div id="root"></div>

    ${embedCode}
  </body>
</html>`;
                const useEffectCode = `// src/App.tsx (alternative — dynamic load)
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '${origin}/embed.js'
    script.setAttribute('data-agent-id', '${assistant.id}')
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  return <>{/* your app */}</>
}`;
                return (
                  <div className="space-y-5">
                    <p className="text-sm font-semibold text-slate-300">Setup Instructions — React (CRA / Vite)</p>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Option A — Paste in <code className="text-primary bg-primary/10 px-1 rounded">public/index.html</code> (recommended)</p>
                      <div className="relative">
                        <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{indexHtmlCode}</code></pre>
                        <Button onClick={() => copyBlock("reacthtml", indexHtmlCode)} variant="ghost" className="absolute top-2 right-2 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-2">
                          {copiedBlock === "reacthtml" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2 text-xs">{copiedBlock === "reacthtml" ? "Copied" : "Copy"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-slate-500 font-medium">Option B — Dynamic load via <code className="text-primary bg-primary/10 px-1 rounded">useEffect</code> (no HTML file access needed)</p>
                      <div className="relative">
                        <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{useEffectCode}</code></pre>
                        <Button onClick={() => copyBlock("reacteffect", useEffectCode)} variant="ghost" className="absolute top-2 right-2 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-2">
                          {copiedBlock === "reacteffect" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          <span className="ml-2 text-xs">{copiedBlock === "reacteffect" ? "Copied" : "Copy"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-slate-400">
                      Save and run your app — the widget mounts after React hydrates. Use Option A for static hosting; Option B if you're using a hosted CMS or framework that owns the HTML shell.
                    </div>
                  </div>
                );
              })()}

              {/* Shopify instructions */}
              {selectedFramework === "shopify" && (
                <div className="space-y-5">
                  <p className="text-sm font-semibold text-slate-300">Setup Instructions — Shopify</p>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Step 1 — Copy your embed code</p>
                    <div className="relative">
                      <pre className="bg-background border border-border rounded-xl p-4 text-sm text-slate-300 overflow-x-auto"><code>{embedCode}</code></pre>
                      <Button onClick={copyEmbed} variant="ghost" className="absolute top-2 right-2 bg-surface hover:bg-border text-white border border-border shadow-sm h-8 px-2">
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-2 text-xs">{copied ? "Copied" : "Copy code"}</span>
                      </Button>
                    </div>
                  </div>

                  <ol className="space-y-3 text-sm text-slate-400">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface border border-border text-xs flex items-center justify-center text-white font-semibold">2</span>
                      <span>In your Shopify admin, go to <span className="text-white font-medium">Online Store → Themes</span></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface border border-border text-xs flex items-center justify-center text-white font-semibold">3</span>
                      <span>Click <span className="text-white font-medium">⋯ (Actions) → Edit code</span> on your active theme</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface border border-border text-xs flex items-center justify-center text-white font-semibold">4</span>
                      <span>In the file tree on the left, open <span className="text-primary font-medium">Layout → theme.liquid</span></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface border border-border text-xs flex items-center justify-center text-white font-semibold">5</span>
                      <span>Find <code className="text-primary bg-primary/10 px-1 rounded">&lt;/body&gt;</code> near the bottom of the file and paste your embed code just before it</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface border border-border text-xs flex items-center justify-center text-white font-semibold">6</span>
                      <span>Click <span className="text-white font-medium">Save</span> — the widget is now live on your entire storefront</span>
                    </li>
                  </ol>

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-slate-400">
                    The widget will appear on all pages of your store including product pages, the cart, and the homepage. No app installation required.
                  </div>
                </div>
              )}

              {/* Universal info box */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
                <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Works everywhere</h4>
                  <p className="text-sm text-slate-400 mt-1">The same agent ID works across all platforms. Your widget configuration — colors, welcome message, lead capture — is fetched automatically. No extra setup needed.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "automate" && (
            <div className="animate-fade-up space-y-10">
              <div>
                <h2 className="text-xl font-semibold text-white">Automate</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Configure your agent's behavior, proactive triggers, webhooks, and multi-step workflows — everything your agent does autonomously in one place.
                </p>
              </div>
              <AgentTab
                assistantId={assistant.id}
                widgetConfig={widgetConfig}
                onConfigChange={(key, value) => setWidgetConfig(prev => ({ ...prev, [key]: value }))}
                onSave={() => handleSaveAppearance(99)}
                saving={savingSection === 99}
              />
              <div className="border-t border-border pt-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">Workflows</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Build multi-step automation sequences that run automatically after your agent fires an action — emails, webhooks, and timed delays.
                  </p>
                </div>
                <WorkflowTab assistantId={assistant.id} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && logoFileUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-white">Crop Logo</h3>
              <button onClick={() => setCropModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative w-full h-[300px] bg-black/50">
              <Cropper
                image={logoFileUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-400">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full cursor-pointer accent-primary"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setCropModalOpen(false)} className="hover:bg-surface text-slate-300">
                  Cancel
                </Button>
                <Button onClick={handleLogoCropConfirm} className="bg-primary hover:bg-blue-500 text-white shadow-glow">
                  Crop & Upload
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
