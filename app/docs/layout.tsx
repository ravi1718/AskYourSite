import type { Metadata } from "next";
import { DocsLayout } from "@/components/docs/docs-layout";
import "highlight.js/styles/github-dark.css";

export const metadata: Metadata = {
  title: { default: "Docs — AskYourSite", template: "%s — AskYourSite Docs" },
  description:
    "Official documentation for AskYourSite — learn how to set up your AI assistant, embed the widget, connect integrations, and use the API.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocsLayout>{children}</DocsLayout>;
}
