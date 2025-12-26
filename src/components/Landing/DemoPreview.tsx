/**
 * DemoPreview Component
 *
 * Animated demonstration showing PII detection and redaction in action.
 * Shows a mock document with sensitive data being identified and redacted.
 */

import { useState, useEffect } from 'react';

interface RedactionItem {
  text: string;
  type: 'ssn' | 'email' | 'phone' | 'name';
  delay: number;
}

const DEMO_DATA: RedactionItem[] = [
  { text: '123-45-6789', type: 'ssn', delay: 0 },
  { text: 'john.doe@email.com', type: 'email', delay: 400 },
  { text: '(555) 123-4567', type: 'phone', delay: 800 },
  { text: 'John Smith', type: 'name', delay: 1200 },
];

const TYPE_LABELS: Record<string, string> = {
  ssn: 'SSN',
  email: 'Email',
  phone: 'Phone',
  name: 'Name',
};

export function DemoPreview() {
  const [redactedItems, setRedactedItems] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-run animation on mount and loop
  useEffect(() => {
    const runAnimation = () => {
      setIsAnimating(true);
      setRedactedItems(new Set());

      // Sequentially redact each item
      DEMO_DATA.forEach((item, index) => {
        setTimeout(() => {
          setRedactedItems((prev) => new Set([...prev, index]));
        }, item.delay + 500);
      });

      // Reset after animation completes
      setTimeout(() => {
        setIsAnimating(false);
      }, 2500);
    };

    // Initial run
    const initialTimeout = setTimeout(runAnimation, 1000);

    // Loop every 5 seconds
    const interval = setInterval(runAnimation, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mock Document */}
      <div className="bg-forge-bg-secondary border border-forge-border p-4 font-mono text-sm">
        {/* Document Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-forge-border">
          <DocumentIcon />
          <span className="text-forge-text-dim text-xs uppercase tracking-wider">
            employee_data.xlsx
          </span>
          {isAnimating && (
            <span className="ml-auto text-xs text-forge-accent animate-pulse">
              Scanning...
            </span>
          )}
        </div>

        {/* Mock Data Rows */}
        <div className="space-y-3">
          {DEMO_DATA.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-forge-text-dim text-xs w-12">
                {TYPE_LABELS[item.type]}:
              </span>
              <div className="flex-1 relative">
                {redactedItems.has(index) ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="bg-forge-accent text-forge-bg-primary px-2 py-0.5
                                 animate-[redact_0.3s_ease-out]"
                      style={{
                        animationFillMode: 'forwards',
                      }}
                    >
                      {'█'.repeat(Math.min(item.text.length, 12))}
                    </span>
                    <span className="text-forge-success text-xs">
                      <CheckIcon />
                    </span>
                  </div>
                ) : (
                  <span className="text-forge-text-secondary">{item.text}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-3 border-t border-forge-border flex items-center justify-between">
          <span className="text-forge-text-dim text-xs">
            {redactedItems.size} of {DEMO_DATA.length} items redacted
          </span>
          {redactedItems.size === DEMO_DATA.length && (
            <span className="text-forge-success text-xs flex items-center gap-1">
              <ShieldIcon />
              Protected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-forge-text-dim"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
