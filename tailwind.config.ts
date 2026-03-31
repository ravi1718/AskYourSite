import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#dbeafe",
        glow: "#7dd3fc",
        ember: "#fb7185",
        panel: "#111827",
        background: "#0A0A0A",
        primary: "#3b82f6",
        secondary: "#8b5cf6",
        surface: "#111111",
        border: "#1A1A1A",
        text: "#F8FAFC",
      },
      boxShadow: {
        halo: "0 0 0 1px rgba(59, 130, 246, 0.25), 0 24px 80px rgba(0, 0, 0, 0.6)",
        card: "0 0 0 1px #1A1A1A, 0 10px 30px rgba(0, 0, 0, 0.4)",
        glow: "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-violet": "0 0 20px rgba(139, 92, 246, 0.5)",
        "glow-lg": "0 0 40px rgba(59, 130, 246, 0.4), 0 0 80px rgba(139, 92, 246, 0.2)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        // existing
        float: "float 6s ease-in-out infinite",
        pulseLine: "pulseLine 3s ease-in-out infinite",
        "fade-up": "fadeSlideUp 0.6s ease-out both",
        shimmer: "shimmer 2.2s ease-in-out infinite",
        // new
        "gradient-x": "gradient-x 4s ease infinite",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "pulse-ring-slow": "pulse-ring 3s cubic-bezier(0.4,0,0.6,1) infinite",
        marquee: "marquee 25s linear infinite",
        "marquee-reverse": "marquee-reverse 25s linear infinite",
        "border-beam": "border-beam-spin 4s linear infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        breathe: "breathe 4s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "slide-in-left": "slide-in-left 0.5s ease-out both",
        blink: "blink 1.2s step-start infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseLine: {
          "0%, 100%": { opacity: "0.4", transform: "scaleX(0.96)" },
          "50%": { opacity: "1", transform: "scaleX(1)" },
        },
        fadeSlideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0)" },
        },
        "border-beam-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.15)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(59,130,246,0.7), 0 0 60px rgba(139,92,246,0.3)",
          },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
