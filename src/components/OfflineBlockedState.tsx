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
import { OnlineTrustWarning } from './OnlineTrustWarning';
import {
  type Platform,
  detectPlatform,
} from '@/core/constants/platformInstructions';

/** Platform-specific visual guides */
const PLATFORM_GUIDES: Record<Platform, {
  name: string;
  icon: React.ReactNode;
  steps: { action: string; detail: string }[];
}> = {
  mac: {
    name: 'macOS',
    icon: <AppleIcon />,
    steps: [
      { action: 'Click WiFi icon', detail: 'In the menu bar (top right)' },
      { action: 'Turn Wi-Fi Off', detail: 'Or hold Option + click for quick toggle' },
    ],
  },
  windows: {
    name: 'Windows',
    icon: <WindowsIcon />,
    steps: [
      { action: 'Click network icon', detail: 'In the taskbar (bottom right)' },
      { action: 'Toggle Wi-Fi Off', detail: 'Or enable Airplane mode' },
    ],
  },
  ios: {
    name: 'iOS',
    icon: <AppleIcon />,
    steps: [
      { action: 'Open Control Center', detail: 'Swipe down from top-right' },
      { action: 'Tap Airplane mode', detail: 'The airplane icon' },
    ],
  },
  android: {
    name: 'Android',
    icon: <AndroidIcon />,
    steps: [
      { action: 'Pull down notification shade', detail: 'Swipe from top of screen' },
      { action: 'Tap Airplane mode', detail: 'In Quick Settings' },
    ],
  },
  unknown: {
    name: 'Your Device',
    icon: <DeviceIcon />,
    steps: [
      { action: 'Disconnect WiFi', detail: 'Turn off wireless connection' },
      { action: 'Or enable Airplane mode', detail: 'Blocks all network access' },
    ],
  },
};

interface OfflineBlockedStateProps {
  /** Called when user acknowledges online risk and wants to proceed */
  onAcknowledgeOnlineRisk?: () => void;
}

export function OfflineBlockedState({
  onAcknowledgeOnlineRisk,
}: OfflineBlockedStateProps) {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(null);
  const [dots, setDots] = useState('');
  const [showTrustWarning, setShowTrustWarning] = useState(false);

  // Detect platform on mount and auto-expand
  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);
    setExpandedPlatform(detected);
  }, []);

  // Animate waiting dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const platformOrder: Platform[] = ['mac', 'windows', 'ios', 'android'];

  return (
    <div className="h-full w-full bg-forge-bg-primary flex items-center justify-center p-8 relative">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">
            <span className="inline-block animate-pulse">&#128274;</span>
          </div>
          <h1 className="text-2xl font-mono text-forge-accent uppercase tracking-wider mb-2">
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

        {/* Quick Steps */}
        <div className="bg-forge-bg-tertiary border-2 border-forge-border p-5 mb-6">
          <div className="flex items-center justify-between gap-4 font-mono text-sm">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-forge-accent/20 border border-forge-accent flex items-center justify-center text-forge-accent text-xs font-bold">1</span>
              <span className="text-forge-text-primary">Go Offline</span>
            </div>
            <span className="text-forge-text-dim">&rarr;</span>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-forge-bg-secondary border border-forge-border flex items-center justify-center text-forge-text-dim text-xs font-bold">2</span>
              <span className="text-forge-text-secondary">Drop File</span>
            </div>
            <span className="text-forge-text-dim">&rarr;</span>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-forge-bg-secondary border border-forge-border flex items-center justify-center text-forge-text-dim text-xs font-bold">3</span>
              <span className="text-forge-text-secondary">Download</span>
            </div>
          </div>
        </div>

        {/* Platform-specific visual guides */}
        <div className="space-y-2 mb-6">
          <p className="text-forge-text-dim font-mono text-xs uppercase tracking-wider mb-3">
            How to go offline on your device:
          </p>
          {platformOrder.map((p) => {
            const guide = PLATFORM_GUIDES[p];
            const isExpanded = expandedPlatform === p;
            const isDetected = platform === p;

            return (
              <div
                key={p}
                className={`border transition-all ${
                  isExpanded
                    ? 'bg-forge-bg-secondary border-forge-accent/50'
                    : 'bg-forge-bg-tertiary border-forge-border hover:border-forge-text-dim'
                }`}
              >
                <button
                  onClick={() => setExpandedPlatform(isExpanded ? null : p)}
                  className="w-full px-4 py-3 flex items-center justify-between font-mono text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className={isExpanded ? 'text-forge-accent' : 'text-forge-text-dim'}>
                      {guide.icon}
                    </span>
                    <span className={isExpanded ? 'text-forge-text-primary' : 'text-forge-text-secondary'}>
                      {guide.name}
                    </span>
                    {isDetected && (
                      <span className="px-2 py-0.5 bg-forge-accent/20 text-forge-accent text-xs rounded-sm">
                        Detected
                      </span>
                    )}
                  </div>
                  <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <ExpandIcon />
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {guide.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 pl-2">
                        <span className="w-5 h-5 rounded-full bg-forge-accent/20 flex items-center justify-center text-forge-accent text-xs flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-forge-text-primary font-mono text-sm">
                            {step.action}
                          </p>
                          <p className="text-forge-text-dim font-mono text-xs mt-0.5">
                            {step.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Journey Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-4 bg-forge-bg-secondary border border-forge-border">
            {/* Step 1: Online (current) */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-forge-error/20 border-2 border-forge-error flex items-center justify-center">
                <WifiIcon className="text-forge-error" />
              </div>
              <span className="mt-2 text-xs font-mono text-forge-error uppercase tracking-wider">
                Online
              </span>
            </div>

            {/* Connector - animated */}
            <div className="flex items-center h-10">
              <div className="w-8 h-0.5 bg-forge-border relative overflow-hidden">
                <div className="absolute inset-0 bg-forge-accent/50 animate-pulse" style={{ width: '0%' }} />
              </div>
              <div className="text-forge-text-dim animate-pulse">
                <ChevronIcon />
              </div>
            </div>

            {/* Step 2: Going Offline */}
            <div className="flex flex-col items-center opacity-40">
              <div className="w-10 h-10 rounded-full bg-forge-bg-tertiary border-2 border-forge-border border-dashed flex items-center justify-center">
                <AirplaneModeIcon className="text-forge-text-dim" />
              </div>
              <span className="mt-2 text-xs font-mono text-forge-text-dim uppercase tracking-wider">
                Disconnect
              </span>
            </div>

            {/* Connector */}
            <div className="flex items-center h-10 opacity-40">
              <div className="w-8 h-0.5 bg-forge-border" />
              <div className="text-forge-text-dim">
                <ChevronIcon />
              </div>
            </div>

            {/* Step 3: Ready */}
            <div className="flex flex-col items-center opacity-40">
              <div className="w-10 h-10 rounded-full bg-forge-bg-tertiary border-2 border-forge-border border-dashed flex items-center justify-center">
                <CheckIcon className="text-forge-text-dim" />
              </div>
              <span className="mt-2 text-xs font-mono text-forge-text-dim uppercase tracking-wider">
                Ready
              </span>
            </div>
          </div>

          <div className="mt-4 font-mono text-forge-text-secondary text-sm flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-forge-error rounded-full animate-pulse" />
            <span>Turn off WiFi to continue{dots}</span>
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

/** Status Journey Icons */
function WifiIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function AirplaneModeIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/** Platform Icons */
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function WindowsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91V13.1l10 .15z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.523 15.341a.996.996 0 1 0 0-1.992.996.996 0 0 0 0 1.992zm-11.046 0a.996.996 0 1 0 0-1.992.996.996 0 0 0 0 1.992zm11.405-6.023 1.997-3.464a.416.416 0 0 0-.152-.567.416.416 0 0 0-.568.152L17.13 8.962a10.026 10.026 0 0 0-4.13-.89c-1.478 0-2.867.327-4.13.89L6.841 5.439a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.567l1.997 3.464C5.21 11.053 3.198 14.12 3 17.667h18c-.198-3.546-2.21-6.614-5.118-8.349z" />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}
