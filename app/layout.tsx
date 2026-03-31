import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
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
  title: "AskYourSite",
  description: "Turn any website into an AI sales and support agent.",
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
          <ChatWidget />
        </ThemeProvider>
        <FaviconLoader />
      </body>
    </html>
  );
}
