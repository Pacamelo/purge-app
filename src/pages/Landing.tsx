/**
 * PURGE Landing Page
 * Minimal hero design - straight to app
 */
import { Link } from 'react-router-dom';
import { LogoReveal, PurgeLogo } from '../components/Brand';
import { DemoPreview } from '../components/Landing';

export default function Landing() {
  return (
    <div className="min-h-screen bg-forge-bg-primary text-forge-text-primary font-mono flex flex-col">
      {/* Minimal Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <PurgeLogo size="sm" variant="white" />
          <Link
            to="/app"
            className="px-4 py-2 bg-white text-forge-bg-primary font-bold uppercase tracking-wider text-sm hover:bg-forge-text-primary transition-colors"
          >
            Launch
          </Link>
        </div>
      </nav>

      {/* Hero Section - Takes 80%+ of viewport */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Large Animated Logo */}
          <div className="mb-8">
            <LogoReveal className="mx-auto" />
          </div>

          {/* Tagline - Lead with the differentiator */}
          <p className="text-2xl md:text-3xl text-forge-text-secondary mb-4">
            PII detection designed for offline use.
          </p>
          <p className="text-base md:text-lg text-forge-text-dim mb-6 max-w-2xl mx-auto">
            Go offline. Process your sensitive documents.
            <span className="text-white font-medium"> No network connection means no network exfiltration.</span>
          </p>

          {/* Core Value Prop - Offline Security */}
          <div className="mb-10 p-6 bg-forge-bg-secondary/70 border border-forge-accent/30 max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forge-accent/20 border border-forge-accent/50 flex items-center justify-center">
                <ShieldOfflineIcon />
              </div>
              <div className="text-left">
                <h3 className="text-forge-accent font-bold uppercase tracking-wider mb-2">
                  Why Offline Matters
                </h3>
                <p className="text-forge-text-secondary text-sm leading-relaxed">
                  Other tools ask you to <em>trust</em> that they won't upload your data.
                  With airplane mode enabled, <strong className="text-white">network exfiltration isn't possible</strong>—there's
                  no connection to exfiltrate over. Your SSNs, medical records, and financial data
                  stay on your device because there's nowhere else for them to go.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <TrustBadge
              icon={<AirplaneIcon />}
              title="Works Offline"
              description="No network required"
            />
            <TrustBadge
              icon={<LockIcon />}
              title="Browser-Only"
              description="No servers involved"
            />
            <TrustBadge
              icon={<UserOffIcon />}
              title="No Account"
              description="Nothing to sign up for"
            />
            <TrustBadge
              icon={<CodeIcon />}
              title="Open Source"
              description="Inspect the code"
            />
          </div>

          {/* Primary CTA */}
          <Link
            to="/app"
            className="inline-block px-10 py-5 bg-white text-forge-bg-primary font-bold text-lg uppercase tracking-wider hover:bg-forge-text-primary transition-all shadow-[6px_6px_0px_0px] shadow-white/20 hover:shadow-[8px_8px_0px_0px] hover:shadow-white/30"
          >
            Try Now
          </Link>

          {/* Secondary link */}
          <div className="mt-6">
            <Link
              to="/app"
              className="text-forge-text-dim hover:text-white transition-colors text-sm"
            >
              No signup required &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 border-t border-forge-border bg-forge-bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-lg text-forge-text-dim uppercase tracking-wider mb-10">
            How It Works
          </h2>

          {/* Three Step Process */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-12">
            <HowItWorksStep
              number={1}
              icon={<UploadIcon />}
              title="Drop"
              description="Upload your document"
            />
            <StepConnector />
            <HowItWorksStep
              number={2}
              icon={<ScanIcon />}
              title="Detect"
              description="AI finds sensitive data"
            />
            <StepConnector />
            <HowItWorksStep
              number={3}
              icon={<DownloadIcon />}
              title="Download"
              description="Get your clean file"
            />
          </div>

          {/* Live Demo Preview */}
          <div className="mt-8">
            <p className="text-center text-forge-text-dim text-xs uppercase tracking-wider mb-4">
              Live Preview
            </p>
            <DemoPreview />
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-forge-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-forge-text-dim">
          <span>purgedata.app</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** Trust badge with icon and description */
function TrustBadge({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-forge-bg-secondary/50 border border-forge-border/50 rounded-sm hover:border-forge-accent/30 transition-colors">
      <div className="text-forge-accent text-xl">{icon}</div>
      <div className="text-left">
        <div className="text-sm font-medium text-forge-text-primary">{title}</div>
        <div className="text-xs text-forge-text-dim">{description}</div>
      </div>
    </div>
  );
}

/** SVG Icons */
function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AirplaneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function UserOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="23" y2="8" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ShieldOfflineIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forge-accent">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/** How It Works Step */
function HowItWorksStep({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-forge-bg-tertiary border-2 border-forge-border flex items-center justify-center text-forge-accent">
          {icon}
        </div>
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-forge-accent text-forge-bg-primary text-xs font-bold flex items-center justify-center">
          {number}
        </span>
      </div>
      <h3 className="mt-3 text-forge-text-primary font-medium uppercase tracking-wider">
        {title}
      </h3>
      <p className="mt-1 text-forge-text-dim text-xs">{description}</p>
    </div>
  );
}

function StepConnector() {
  return (
    <div className="hidden md:flex items-center text-forge-border">
      <div className="w-12 h-0.5 bg-forge-border" />
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
