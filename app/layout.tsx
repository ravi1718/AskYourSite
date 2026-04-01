import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatWidget } from "@/components/chat-widget";
import { NavigationProgress } from "@/components/navigation-progress";
import { FaviconLoader } from "@/components/favicon-loader";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://askyoursite.in"),
  title: {
    default: "AskYourSite — AI Sales & Support Agent for Your Website",
    template: "%s — AskYourSite",
  },
  description:
    "Turn any website into an AI-powered sales and support agent in minutes. Train on your content, embed a widget, and let AI handle customer questions 24/7.",
  keywords: [
    "AI chatbot",
    "website AI agent",
    "AI sales agent",
    "AI support agent",
    "chatbot for website",
    "AI customer support",
    "embeddable chatbot",
    "AI assistant",
  ],
  authors: [{ name: "AskYourSite" }],
  alternates: {
    canonical: "https://askyoursite.in",
  },
  openGraph: {
    type: "website",
    url: "https://askyoursite.in",
    siteName: "AskYourSite",
    title: "AskYourSite — AI Sales & Support Agent for Your Website",
    description:
      "Turn any website into an AI-powered sales and support agent in minutes. Train on your content, embed a widget, and let AI handle customer questions 24/7.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AskYourSite — AI Sales & Support Agent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AskYourSite — AI Sales & Support Agent for Your Website",
    description:
      "Turn any website into an AI-powered sales and support agent in minutes.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${headingFont.variable} ${bodyFont.variable} bg-[var(--page-bg)] text-[var(--page-fg)]`}>
        <NavigationProgress />
        <ThemeProvider>
          {children}
          <ChatWidget assistantId={process.env.NEXT_PUBLIC_AYS_ASSISTANT_ID} />
        </ThemeProvider>
        <FaviconLoader />
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}
