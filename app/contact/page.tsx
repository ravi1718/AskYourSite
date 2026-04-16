"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    setState("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("Could not send your message. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Minimal nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-[#1C1C1C] bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="AskYourSite" width={30} height={30} className="rounded-lg" />
            <span className="font-display text-base font-bold text-white tracking-tight">AskYourSite</span>
          </Link>
          <Link href="/"
            className="flex items-center gap-1.5 text-sm text-[#888] hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Page content */}
      <div className="pt-24 pb-24 min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left — info */}
            <div className="lg:pt-8">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[#1C1C1C] bg-[#0A0A0A] px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-[#888] mb-8">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00D9FF]" />
                  Contact
                </div>

                <h1 className="text-5xl font-display font-bold text-white tracking-tight leading-[1.05] mb-5">
                  Let&rsquo;s talk.
                </h1>
                <p className="text-[#888] text-lg leading-relaxed mb-12 max-w-sm">
                  Have a question, feedback, or want to explore a partnership? Send a message and I&rsquo;ll get back to you within one business day.
                </p>

                {/* Contact detail */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-9 w-9 rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] flex items-center justify-center">
                    <Mail className="h-4 w-4 text-[#00D9FF]" />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#555] uppercase tracking-widest mb-0.5">Email</p>
                    <a href="mailto:ravitej@askyoursite.in"
                      className="text-white hover:text-[#00D9FF] transition-colors font-medium">
                      ravitej@askyoursite.in
                    </a>
                  </div>
                </div>

                {/* Decorative grid lines */}
                <div className="mt-16 hidden lg:block">
                  <div className="grid grid-cols-3 gap-px bg-[#1C1C1C] rounded-2xl overflow-hidden">
                    {[
                      { label: "Response time", value: "< 24 hrs" },
                      { label: "Support", value: "Personal" },
                      { label: "Time zone", value: "IST" },
                    ].map((s) => (
                      <div key={s.label} className="bg-black p-5">
                        <p className="text-[11px] text-[#555] uppercase tracking-widest mb-1">{s.label}</p>
                        <p className="text-base font-semibold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right — form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="rounded-2xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden">
                <AnimatePresence mode="wait">
                  {state === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20 px-8 text-center"
                    >
                      <div className="h-14 w-14 rounded-2xl border border-[#00D9FF]/30 bg-[#00D9FF]/10 flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-7 w-7 text-[#00D9FF]" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-white mb-3">Message sent!</h2>
                      <p className="text-[#888] text-base leading-relaxed mb-8 max-w-xs">
                        Thanks for reaching out. I&rsquo;ll reply to{" "}
                        <span className="text-white font-medium">{form.email}</span> within one business day.
                      </p>
                      <button
                        onClick={() => { setState("idle"); setForm({ name: "", email: "", message: "" }); }}
                        className="text-sm text-[#888] hover:text-white transition-colors"
                      >
                        Send another message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="p-8 space-y-6"
                    >
                      <div>
                        <h2 className="text-xl font-display font-bold text-white mb-1">Send a message</h2>
                        <p className="text-[13px] text-[#555]">All fields are required.</p>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#888] uppercase tracking-widest mb-2">
                          Your name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Jane Smith"
                          required
                          className="w-full rounded-xl border border-[#1C1C1C] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#00D9FF]/40 transition-colors"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#888] uppercase tracking-widest mb-2">
                          Your email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="jane@company.com"
                          required
                          className="w-full rounded-xl border border-[#1C1C1C] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#00D9FF]/40 transition-colors"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-[11px] font-medium text-[#888] uppercase tracking-widest mb-2">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Tell me what's on your mind…"
                          required
                          rows={6}
                          className="w-full rounded-xl border border-[#1C1C1C] bg-[#050505] px-4 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#00D9FF]/40 transition-colors resize-none"
                        />
                      </div>

                      {/* Error */}
                      {state === "error" && errorMsg && (
                        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                          {errorMsg}
                        </p>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={state === "sending" || !form.name.trim() || !form.email.trim() || !form.message.trim()}
                        className="flex items-center justify-center gap-2 w-full rounded-xl bg-white py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {state === "sending" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
