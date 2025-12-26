/**
 * OfflineBlockedState Component
 *
 * Displays when the user is online and encourages offline usage.
 * Shows clear instructions for how to go offline on different platforms.
 * Also provides an "online bypass" option with trust warnings for users
 * who want to proceed while connected.
 *
 * Key message: Offline processing provides the strongest privacy assurance.
 */

import { useState, useEffect } from 'react';
import { PurgeLogo } from '@/components/Brand';
import { OnlineTrustWarning } from './OnlineTrustWarning';
import {
  type Platform,
  detectPlatform,
  PLATFORM_INSTRUCTIONS,
} from '@/core/constants/platformInstructions';

interface OfflineBlockedStateProps {
  /** Called when user acknowledges online risk and wants to proceed */
  onAcknowledgeOnlineRisk?: () => void;
}

export function OfflineBlockedState({
  onAcknowledgeOnlineRisk,
}: OfflineBlockedStateProps) {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [dots, setDots] = useState('');
  const [showTrustWarning, setShowTrustWarning] = useState(false);

  // Detect platform on mount
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  // Animate waiting dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const instructions = PLATFORM_INSTRUCTIONS[platform];

  return (
    <div className="h-full w-full bg-forge-bg-primary flex items-center justify-center p-8 relative">
      <div className="max-w-xl w-full">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <PurgeLogo size="lg" variant="white" className="mx-auto opacity-80" />
          </div>
          <h1 className="text-2xl font-mono text-white uppercase tracking-wider mb-2">
            Offline Required
          </h1>
          <p className="text-forge-text-secondary font-mono text-sm">
            This tool ONLY works offline.
          </p>
        </div>

        {/* Philosophy */}
        <div className="bg-forge-bg-secondary border border-forge-border p-6 mb-6">
          <p className="text-forge-text-primary font-mono text-center leading-relaxed">
            <span className="text-forge-accent">Why?</span> Offline processing provides the
            <br />
            <span className="text-forge-accent">strongest privacy assurance</span> available.
          </p>
        </div>

        {/* Instructions Box */}
        <div className="bg-forge-bg-tertiary border-2 border-forge-border p-6 mb-6">
          <h2 className="text-forge-accent font-mono uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
            <span>{instructions.icon}</span>
            <span>How to use:</span>
          </h2>

          <ol className="space-y-3 font-mono text-sm">
            <li className="flex gap-3">
              <span className="text-forge-accent flex-shrink-0">1.</span>
              <span className="text-forge-text-primary">
                Turn off WiFi / Enable Airplane Mode
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-forge-accent flex-shrink-0">2.</span>
              <span className="text-forge-text-primary">Drop your sensitive file</span>
            </li>
            <li className="flex gap-3">
              <span className="text-forge-accent flex-shrink-0">3.</span>
              <span className="text-forge-text-primary">Download the scrubbed result</span>
            </li>
            <li className="flex gap-3">
              <span className="text-forge-accent flex-shrink-0">4.</span>
              <span className="text-forge-text-primary">
                This tab will close automatically
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-forge-accent flex-shrink-0">5.</span>
              <span className="text-forge-text-primary">Then reconnect</span>
            </li>
          </ol>

          {/* Platform-specific help */}
          <div className="mt-6 pt-4 border-t border-forge-border">
            <p className="text-forge-text-dim font-mono text-xs uppercase tracking-wider mb-2">
              On your device ({platform}):
            </p>
            <ul className="space-y-1">
              {instructions.steps.map((step, i) => (
                <li key={i} className="text-forge-text-secondary font-mono text-xs flex gap-2">
                  <span className="text-forge-text-dim">&#8226;</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 bg-forge-error/10 border border-forge-error/30 px-4 py-2">
            <span className="w-3 h-3 bg-forge-error rounded-full animate-pulse" />
            <span className="font-mono text-forge-error uppercase text-sm tracking-wider">
              Online
            </span>
          </div>

          <div className="mt-4 font-mono text-forge-text-dim text-sm">
            Waiting for offline{dots}
          </div>
        </div>

        {/* Trust Explanation */}
        <div className="mt-8 text-center">
          <p className="text-forge-text-dim font-mono text-xs leading-relaxed max-w-md mx-auto">
            When offline, network requests are highly unlikely.
            <br />
            For maximum privacy, process sensitive files disconnected.
          </p>
        </div>

        {/* Online Bypass Option */}
        {onAcknowledgeOnlineRisk && (
          <div className="mt-8 pt-6 border-t border-forge-border">
            <div className="text-center">
              <p className="text-forge-text-dim font-mono text-xs mb-3">
                Not handling sensitive data?
              </p>
              <button
                onClick={() => setShowTrustWarning(true)}
                className="px-4 py-2 font-mono text-xs uppercase tracking-wider
                           bg-transparent border border-forge-text-dim text-forge-text-dim
                           hover:border-forge-warning hover:text-forge-warning
                           transition-colors"
              >
                Proceed Online (Not Recommended)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trust Warning Modal */}
      {showTrustWarning && onAcknowledgeOnlineRisk && (
        <OnlineTrustWarning
          onDismiss={() => setShowTrustWarning(false)}
          onAcknowledge={() => {
            setShowTrustWarning(false);
            onAcknowledgeOnlineRisk();
          }}
        />
      )}
    </div>
  );
}
