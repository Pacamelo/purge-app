/**
 * SecurityDisclaimer Component
 *
 * Provides clear, honest communication about what PURGE can and cannot do.
 * This should be visible to users before they process sensitive files.
 */

import { useState } from 'react';

interface SecurityDisclaimerProps {
  /** Whether the disclaimer can be collapsed after reading */
  collapsible?: boolean;
  /** Callback when user acknowledges the disclaimer */
  onAcknowledge?: () => void;
}

export function SecurityDisclaimer({
  collapsible = true,
  onAcknowledge,
}: SecurityDisclaimerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleAcknowledge = () => {
    setHasAcknowledged(true);
    if (collapsible) {
      setIsExpanded(false);
    }
    onAcknowledge?.();
  };

  if (!isExpanded && hasAcknowledged) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full p-2 text-left text-xs text-forge-text-secondary hover:text-forge-accent border border-forge-border rounded transition-colors"
      >
        Security Information (click to expand)
      </button>
    );
  }

  return (
    <div className="p-4 border border-[var(--forge-warning)] bg-[var(--forge-warning)]/10 rounded">
      <h3 className="font-bold text-[var(--forge-warning)] mb-3 flex items-center gap-2">
        <span className="text-lg">Important: Security Information</span>
      </h3>

      <div className="text-sm space-y-3 text-forge-text-primary">
        <div>
          <p className="font-bold text-forge-accent mb-1">PURGE DOES:</p>
          <ul className="list-disc pl-5 space-y-0.5 text-forge-text-secondary">
            <li>Process files entirely in your browser (no upload)</li>
            <li>Detect common PII patterns using regex matching</li>
            <li>Monitor for network requests during processing</li>
            <li>Show you indicators of storage and network activity</li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-[var(--forge-warning)] mb-1">
            PURGE CANNOT GUARANTEE:
          </p>
          <ul className="list-disc pl-5 space-y-0.5 text-forge-text-secondary">
            <li>
              <strong>Complete PII detection</strong> - Regex patterns have
              limits; unusual formats may be missed
            </li>
            <li>
              <strong>No data exfiltration</strong> - Browser extensions,
              service workers, or malware could access data
            </li>
            <li>
              <strong>Secure memory wiping</strong> - JavaScript cannot
              guarantee memory is overwritten. Data may persist in:
              <ul className="list-disc pl-5 mt-1 text-xs text-forge-text-dim">
                <li>Browser memory until garbage collected</li>
                <li>Page swap files on disk</li>
                <li>React DevTools state history</li>
                <li>Browser undo/clipboard buffers</li>
              </ul>
            </li>
            <li>
              <strong>Network isolation</strong> - Our monitoring can be
              bypassed by determined attackers
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t border-forge-border">
          <p className="font-bold text-forge-accent mb-1">
            FOR MAXIMUM SECURITY:
          </p>
          <ol className="list-decimal pl-5 space-y-0.5 text-forge-text-secondary">
            <li>
              <strong>Enable Airplane Mode</strong> before processing sensitive
              files
            </li>
            <li>
              <strong>Use browser DevTools</strong> (F12 → Network tab) to
              verify no requests
            </li>
            <li>
              <strong>Use an air-gapped device</strong> for highly sensitive
              data
            </li>
            <li>
              <strong>Close browser and restart</strong> after processing to
              clear memory
            </li>
            <li>
              <strong>Audit the source code</strong> at{' '}
              <a
                href="https://github.com/Pacamelo/forge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-forge-accent hover:underline"
              >
                github.com/Pacamelo/forge
              </a>
            </li>
          </ol>
        </div>

        {!hasAcknowledged && (
          <div className="pt-3">
            <button
              onClick={handleAcknowledge}
              className="px-4 py-2 bg-forge-accent text-forge-bg-primary font-medium rounded hover:opacity-90 transition-opacity"
            >
              I Understand
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
