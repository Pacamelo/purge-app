/**
 * OnboardingFlow Component
 *
 * First-time user onboarding modal that introduces PURGE's key concepts.
 * Shows 4 steps: Welcome, Privacy, Offline, Demo
 */

import { useState } from 'react';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

type Step = {
  title: string;
  content: React.ReactNode;
  icon: React.ReactNode;
};

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      title: 'Welcome to PURGE',
      icon: <ShredderIcon />,
      content: (
        <div className="space-y-4">
          <p className="text-forge-text-secondary">
            PURGE finds and removes personal information (PII) from your documents.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {['SSN', 'Emails', 'Phone Numbers', 'Names', 'Addresses'].map((item) => (
              <span
                key={item}
                className="px-3 py-1 bg-forge-accent/10 border border-forge-accent/30 text-forge-accent text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: '100% Private',
      icon: <LockIcon />,
      content: (
        <div className="space-y-4">
          <p className="text-forge-text-secondary">
            Everything runs in your browser. Your files never leave your device.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-forge-success">
              <CheckIcon />
              <span>Local processing</span>
            </div>
            <div className="flex items-center gap-2 text-forge-success">
              <CheckIcon />
              <span>No uploads</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Offline is Best',
      icon: <AirplaneIcon />,
      content: (
        <div className="space-y-4">
          <p className="text-forge-text-secondary">
            For maximum security, go offline before processing sensitive files.
          </p>
          <div className="bg-forge-bg-tertiary p-4 border border-forge-border">
            <p className="text-xs text-forge-text-dim text-center">
              When offline, it's physically impossible for data to leak.
              <br />
              <span className="text-forge-accent">This is the gold standard.</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Ready to Start',
      icon: <RocketIcon />,
      content: (
        <div className="space-y-4">
          <p className="text-forge-text-secondary">
            Drop your document and PURGE will automatically detect PII.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-forge-text-dim">
            <span className="text-forge-accent">1.</span> Drop
            <span className="text-forge-border">&rarr;</span>
            <span className="text-forge-accent">2.</span> Review
            <span className="text-forge-border">&rarr;</span>
            <span className="text-forge-accent">3.</span> Download
          </div>
        </div>
      ),
    },
  ];

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-md w-full bg-forge-bg-primary border-2 border-forge-accent">
        {/* Header */}
        <div className="bg-forge-bg-secondary border-b border-forge-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forge-accent/20 border border-forge-accent flex items-center justify-center text-forge-accent">
                {step.icon}
              </div>
              <h2 className="text-lg font-mono text-forge-text-primary uppercase tracking-wider">
                {step.title}
              </h2>
            </div>
            <button
              onClick={onSkip}
              className="text-xs text-forge-text-dim hover:text-forge-text-secondary transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[160px] flex items-center justify-center">
          {step.content}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pb-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === currentStep
                  ? 'bg-forge-accent w-6'
                  : 'bg-forge-border hover:bg-forge-text-dim'
                }
              `}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-forge-border p-4 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`
              px-4 py-2 font-mono text-sm uppercase tracking-wider
              transition-colors
              ${currentStep === 0
                ? 'text-forge-text-dim cursor-not-allowed'
                : 'text-forge-text-secondary hover:text-forge-accent'
              }
            `}
          >
            Back
          </button>
          <button
            onClick={() => {
              if (isLastStep) {
                onComplete();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
            className="px-6 py-2 font-mono text-sm uppercase tracking-wider
                       bg-forge-accent text-forge-bg-primary
                       hover:bg-forge-text-primary transition-colors"
          >
            {isLastStep ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons
function ShredderIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="8" rx="1" />
      <path d="M4 10h16" />
      <path d="M6 14v6" />
      <path d="M10 14v6" />
      <path d="M14 14v6" />
      <path d="M18 14v6" />
    </svg>
  );
}

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

function RocketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
