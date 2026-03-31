import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — AskYourSite",
};

export default function TermsPage() {
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

        <h1 className="font-display text-4xl font-bold text-white mb-3">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: March 31, 2025</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using AskYourSite (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              AskYourSite provides an AI-powered chat assistant platform that allows users to train
              AI assistants on their website content and embed them on external websites. The Service
              is provided on a subscription basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. You must notify us immediately of any
              unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>Violate any applicable laws or regulations</li>
              <li>Train assistants on content you do not have the right to use</li>
              <li>Distribute spam, malware, or harmful content through your assistant</li>
              <li>Attempt to reverse-engineer or disrupt the Service</li>
              <li>Misrepresent the AI assistant as a human to users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Subscription and Billing</h2>
            <p>
              Subscriptions are billed monthly and renew automatically. All prices are displayed
              exclusive of applicable taxes. Taxes will be calculated and added at checkout based on
              your billing address.
            </p>
            <p className="mt-3">
              You may cancel your subscription at any time. Cancellation takes effect at the end of
              the current billing period. We do not offer refunds for partial periods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Free Trial</h2>
            <p>
              New accounts receive a 7-day free trial. No credit card is required to start the trial.
              At the end of the trial period, you must subscribe to a paid plan to continue using
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>
              You retain ownership of all content you submit to train your AI assistants. By submitting
              content, you grant AskYourSite a limited license to process that content solely for the
              purpose of providing the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>
              AskYourSite is provided &quot;as is&quot; without warranties of any kind. We are not liable for
              any indirect, incidental, or consequential damages arising from your use of the Service.
              Our total liability shall not exceed the amount you paid us in the three months preceding
              the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. AI-Generated Content</h2>
            <p>
              The AI assistants are powered by large language models and may occasionally produce
              inaccurate or incomplete responses. You are responsible for reviewing and monitoring
              your assistant&apos;s responses. AskYourSite is not liable for any decisions made based
              on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms.
              You may delete your account at any time by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes
              via email or a notice on the Service. Continued use of the Service after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact Us</h2>
            <p>
              For questions about these Terms, please contact us at{" "}
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
