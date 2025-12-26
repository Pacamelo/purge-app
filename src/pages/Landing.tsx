/**
 * PURGE Marketing Landing Page
 * purgedata.app
 */
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How does PURGE keep my data private?',
      a: 'PURGE runs entirely in your browser. Your files are processed locally using JavaScript - no data ever leaves your device. We use no external APIs, no cloud services, and no server-side processing.',
    },
    {
      q: 'What file types are supported?',
      a: 'Currently PURGE supports Excel files (.xlsx). Support for CSV, PDF, and other document formats is coming soon.',
    },
    {
      q: 'How accurate is the PII detection?',
      a: 'Our regex-based detection catches common patterns like SSNs, credit cards, emails, phone numbers, and names. Advanced ML-powered detection for higher accuracy is coming soon.',
    },
    {
      q: 'Can I use PURGE offline?',
      a: 'Yes! In fact, we recommend it. For maximum privacy assurance, enable airplane mode before processing sensitive documents. PURGE works 100% offline after the initial page load.',
    },
    {
      q: 'What happens to my files after processing?',
      a: 'Nothing - they stay in your browser memory until you download the redacted version. We don\'t store, cache, or transmit your files. When you close the tab, everything is gone.',
    },
  ];

  return (
    <div className="min-h-screen bg-forge-bg-primary text-forge-text-primary font-mono">
      {/* Navigation */}
      <nav className="border-b border-forge-border bg-forge-bg-secondary">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-forge-text-dim">[</span>
            <span className="text-forge-accent text-xl font-bold">PURGE</span>
            <span className="text-forge-text-dim">]</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-forge-text-secondary hover:text-forge-accent transition-colors">
              Features
            </a>
            <a href="#faq" className="text-forge-text-secondary hover:text-forge-accent transition-colors">
              FAQ
            </a>
            <Link
              to="/app"
              className="px-4 py-2 bg-forge-accent text-forge-bg-primary font-bold uppercase tracking-wider hover:bg-forge-accent/90 transition-colors"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-forge-text-dim">[</span>
            <span className="text-forge-accent">PURGE</span>
            <span className="text-forge-text-dim">]</span>
          </h1>
          <p className="text-2xl md:text-3xl text-forge-text-secondary mb-4">
            Find what you missed.
          </p>
          <p className="text-lg text-forge-text-dim mb-12 max-w-2xl mx-auto">
            PII detection that runs entirely in your browser.
            <br />
            <span className="text-forge-accent">Your data never leaves your device.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="px-8 py-4 bg-forge-accent text-forge-bg-primary font-bold text-lg uppercase tracking-wider hover:bg-forge-accent/90 transition-colors shadow-[4px_4px_0px_0px] shadow-forge-accent/30"
            >
              Try Free - No Account Required
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-forge-bg-secondary border-t border-b border-forge-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            <span className="text-forge-text-dim">//</span> Why PURGE?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="shield"
              title="Truly Private"
              description="Unlike AWS Macie or Google DLP, PURGE never uploads your data. Everything happens in your browser - verify it yourself in DevTools."
            />
            <FeatureCard
              icon="search"
              title="Smart Detection"
              description="Catches SSNs, credit cards, emails, phone numbers, names, and more. Context-aware analysis reduces false positives."
            />
            <FeatureCard
              icon="chart"
              title="Quasi-ID Alerts"
              description="Detects dangerous combinations like ZIP + DOB that can re-identify individuals even after redaction."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            <span className="text-forge-text-dim">//</span> Your Data Stays Yours
          </h2>
          <p className="text-lg text-forge-text-secondary mb-8">
            Privacy isn't a feature - it's the architecture. PURGE was built from day one
            to process everything client-side. No accounts, no cloud, no telemetry.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <TrustItem icon="check" text="No server uploads" />
            <TrustItem icon="check" text="No account required" />
            <TrustItem icon="check" text="Works 100% offline" />
            <TrustItem icon="check" text="No tracking or analytics" />
            <TrustItem icon="check" text="Open-source soon" />
            <TrustItem icon="check" text="Verify in DevTools" />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="text-forge-text-dim">//</span> FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-forge-border bg-forge-bg-secondary"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-forge-bg-tertiary transition-colors"
                >
                  <span className="font-medium">{faq.q}</span>
                  <span className="text-forge-accent text-xl">
                    {openFaq === i ? '-' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-forge-text-secondary">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-forge-bg-secondary border-t border-forge-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to PURGE?</h2>
          <p className="text-lg text-forge-text-secondary mb-8">
            Start detecting PII in your documents. No signup, no credit card.
          </p>
          <Link
            to="/app"
            className="inline-block px-8 py-4 bg-forge-accent text-forge-bg-primary font-bold text-lg uppercase tracking-wider hover:bg-forge-accent/90 transition-colors shadow-[4px_4px_0px_0px] shadow-forge-accent/30"
          >
            Launch PURGE
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-forge-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-forge-text-dim">[</span>
            <span className="text-forge-accent font-bold">PURGE</span>
            <span className="text-forge-text-dim">]</span>
            <span className="text-forge-text-dim text-sm ml-2">
              Private/Universal Redaction & Governance Engine
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-forge-text-secondary">
            <a href="#" className="hover:text-forge-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-forge-accent transition-colors">Terms</a>
            <a href="#" className="hover:text-forge-accent transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const iconMap: Record<string, string> = {
    shield: '\u{1F6E1}',
    search: '\u{1F50D}',
    chart: '\u{1F4CA}',
  };

  return (
    <div className="p-6 border border-forge-border bg-forge-bg-tertiary">
      <div className="text-4xl mb-4">{iconMap[icon]}</div>
      <h3 className="text-xl font-bold mb-3 text-forge-accent">{title}</h3>
      <p className="text-forge-text-secondary">{description}</p>
    </div>
  );
}

function TrustItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-forge-border bg-forge-bg-secondary">
      <span className="text-forge-success text-lg">{icon === 'check' ? '\u2713' : icon}</span>
      <span className="text-forge-text-secondary">{text}</span>
    </div>
  );
}

