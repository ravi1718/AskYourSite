import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — AskYourSite",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <h1 className="font-display text-4xl font-bold text-white mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 31, 2025</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account,
              configure an AI assistant, or contact us for support. This includes your name, email address,
              and any website URLs you submit for training.
            </p>
            <p className="mt-3">
              We also collect usage data automatically — including pages visited, features used, and
              interactions with your AI assistants — to improve our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>Provide, maintain, and improve AskYourSite</li>
              <li>Process transactions and send related information</li>
              <li>Respond to comments, questions, and requests</li>
              <li>Send technical notices and support messages</li>
              <li>Monitor and analyze usage and trends</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase infrastructure. Chat conversations and training
              data are stored to power your AI assistants. We do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services to operate AskYourSite:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>Supabase — database and authentication</li>
              <li>Google Gemini — AI language model processing</li>
              <li>Firecrawl — website content crawling</li>
              <li>Dodo Payments — payment processing</li>
              <li>Vercel — hosting and infrastructure</li>
            </ul>
            <p className="mt-3">Each service has its own privacy policy governing use of your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
            <p>
              We use cookies to maintain your session and authentication state. We do not use cookies
              for advertising or cross-site tracking.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
            <p>
              You may request deletion of your account and associated data at any time by contacting us.
              You may also export your data by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:ravitej@askyoursite.in" className="text-primary hover:underline">
                ravitej@askyoursite.in
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">
            ← Back to AskYourSite
          </Link>
        </div>
      </div>
    </div>
  );
}
