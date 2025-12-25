/**
 * OnlineTrustWarning Component
 *
 * Modal dialog requiring explicit trust acknowledgment before allowing
 * online processing. Makes it crystal clear that the user is trusting
 * the website operators with their data.
 */

import { useState } from 'react';

interface OnlineTrustWarningProps {
  /** Called when user dismisses and wants to go offline instead */
  onDismiss: () => void;
  /** Called when user explicitly acknowledges and accepts online risk */
  onAcknowledge: () => void;
}

export function OnlineTrustWarning({ onDismiss, onAcknowledge }: OnlineTrustWarningProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-w-lg w-full bg-forge-bg-primary border-2 border-forge-warning">
        {/* Header */}
        <div className="bg-forge-warning/20 border-b border-forge-warning px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">&#9888;</span>
            <div>
              <h2 className="text-xl font-mono text-forge-warning uppercase tracking-wider">
                You Are Online
              </h2>
              <p className="text-forge-text-secondary font-mono text-sm">
                Offline processing is recommended for sensitive data
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Trust Statement */}
          <div className="bg-forge-bg-secondary border border-forge-border p-4">
            <p className="text-forge-text-primary font-mono text-sm mb-3">
              By proceeding online, you are trusting that:
            </p>
            <ul className="space-y-2 font-mono text-sm">
              <li className="flex gap-2">
                <span className="text-forge-warning">&#8226;</span>
                <span className="text-forge-text-secondary">
                  This website will not transmit your data
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-forge-warning">&#8226;</span>
                <span className="text-forge-text-secondary">
                  The code running in your browser is what it claims to be
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-forge-warning">&#8226;</span>
                <span className="text-forge-text-secondary">
                  No third-party scripts are intercepting your files
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-forge-warning">&#8226;</span>
                <span className="text-forge-text-secondary">
                  Browser extensions won't access your data
                </span>
              </li>
            </ul>
          </div>

          {/* Reality Check */}
          <div className="text-center">
            <p className="text-forge-text-dim font-mono text-xs italic">
              "You are trusting a stranger on the internet with claims they won't touch your data."
            </p>
          </div>

          {/* Acknowledgment Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={`w-5 h-5 border-2 flex items-center justify-center transition-colors
                           ${acknowledged
                             ? 'bg-forge-warning border-forge-warning'
                             : 'border-forge-border group-hover:border-forge-text-secondary'
                           }`}
              >
                {acknowledged && (
                  <span className="text-black text-sm font-bold">&#10003;</span>
                )}
              </div>
            </div>
            <span className="text-forge-text-primary font-mono text-sm leading-relaxed">
              I understand and accept that I am trusting this website with my data.
              For sensitive files, I should go offline instead.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="border-t border-forge-border p-4 flex gap-3 justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 font-mono text-sm uppercase tracking-wider
                       bg-forge-accent/20 border border-forge-accent text-forge-accent
                       hover:bg-forge-accent hover:text-black
                       transition-colors"
          >
            Go Offline Instead
          </button>
          <button
            onClick={onAcknowledge}
            disabled={!acknowledged}
            className={`px-4 py-2 font-mono text-sm uppercase tracking-wider
                       border transition-colors
                       ${acknowledged
                         ? 'bg-forge-warning/20 border-forge-warning text-forge-warning hover:bg-forge-warning hover:text-black cursor-pointer'
                         : 'bg-forge-bg-tertiary border-forge-border text-forge-text-dim cursor-not-allowed'
                       }`}
          >
            I Understand, Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
