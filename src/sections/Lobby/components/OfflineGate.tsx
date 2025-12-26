/**
 * OfflineGate Component
 *
 * Wraps the Lobby content and displays appropriate gate UI based on offline enforcement status.
 * Provides guidance for maximum privacy assurance.
 *
 * - When online: Shows UI encouraging user to go offline (or allows bypass with warning)
 * - When offline: Renders children (file intake UI)
 * - On reconnection during processing: Shows warning UI
 * - On complete: Prompts to download before reconnecting
 *
 * NOTE: This is a best-effort privacy indicator, not a security guarantee.
 */

import { ReactNode } from 'react';
import {
  type OfflineEnforcementState,
  type OfflineEnforcementActions,
} from '@/core/hooks/useOfflineEnforcement';
import { OfflineBlockedState } from './OfflineBlockedState';
import { ReconnectedAbort } from './ReconnectedAbort';
import { ForceCloseCountdown } from './ForceCloseCountdown';

interface OfflineGateProps {
  children: ReactNode;
  /** Offline enforcement state from parent's useOfflineEnforcement hook */
  offlineState: OfflineEnforcementState;
  /** Offline enforcement actions from parent's useOfflineEnforcement hook */
  offlineActions: OfflineEnforcementActions;
}

/**
 * OfflineGate wraps Lobby content and encourages offline-first usage for privacy
 *
 * IMPORTANT: The parent component must call useOfflineEnforcement() and pass
 * the state and actions here. This ensures a single source of truth for the
 * offline enforcement state machine.
 */
export function OfflineGate({
  children,
  offlineState,
  offlineActions,
}: OfflineGateProps) {
  // Render based on enforcement status
  switch (offlineState.status) {
    case 'online_blocked':
      return (
        <OfflineBlockedState
          onAcknowledgeOnlineRisk={offlineActions.acknowledgeOnlineRisk}
        />
      );

    case 'sw_blocked':
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-forge-bg-primary">
          <div className="text-6xl mb-4">&#9888;</div>
          <h2 className="text-xl font-mono text-[var(--forge-error)] mb-4 uppercase tracking-wider">
            Service Workers Detected
          </h2>
          <p className="text-forge-text-secondary font-mono text-sm text-center max-w-md mb-6 leading-relaxed">
            Active service workers can intercept your data even in offline mode.
            For maximum privacy, please clear site data or use a private/incognito window.
          </p>
          <div className="space-y-2 text-sm font-mono text-forge-text-dim text-center mb-6">
            <p>Chrome: Settings &rarr; Privacy &rarr; Clear browsing data &rarr; Cookies</p>
            <p>Firefox: Settings &rarr; Privacy &rarr; Manage Data &rarr; Remove</p>
            <p>Safari: Preferences &rarr; Privacy &rarr; Manage Website Data</p>
          </div>
          <button
            onClick={offlineActions.reset}
            className="px-4 py-2 text-sm font-mono uppercase bg-forge-bg-secondary border border-forge-border text-forge-text-secondary hover:text-forge-accent hover:border-forge-accent transition-colors"
          >
            Try Again
          </button>
        </div>
      );

    case 'quota_exhausted':
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-forge-bg-primary">
          <div className="text-6xl mb-4">&#128274;</div>
          <h2 className="text-xl font-mono text-forge-warning mb-4 uppercase tracking-wider">
            Offline Quota Exhausted
          </h2>
          <p className="text-forge-text-secondary font-mono text-sm text-center max-w-md mb-6 leading-relaxed">
            You've used all your offline processing tokens. Go online briefly to refresh your quota.
          </p>
          <p className="text-forge-text-dim font-mono text-xs text-center max-w-md mb-6">
            Remaining: {offlineState.quotaRemaining} tokens
          </p>
          <button
            onClick={offlineActions.reset}
            className="px-4 py-2 text-sm font-mono uppercase bg-forge-bg-secondary border border-forge-border text-forge-text-secondary hover:text-forge-accent hover:border-forge-accent transition-colors"
          >
            Check Again
          </button>
        </div>
      );

    case 'reconnected_abort':
      return <ReconnectedAbort onReset={offlineActions.reset} />;

    case 'reconnected_warning':
      return (
        <ForceCloseCountdown
          seconds={offlineState.countdownSeconds}
          isWarning={true}
          onForceClose={offlineActions.forceClose}
          onExtend={null} // No extensions allowed in warning state
          extensionsRemaining={0}
        />
      );

    case 'complete':
      return (
        <>
          {/* Show the complete UI behind the countdown overlay */}
          <div className="relative">
            {children}
            <ForceCloseCountdown
              seconds={offlineState.countdownSeconds}
              isWarning={false}
              onForceClose={offlineActions.forceClose}
              onExtend={
                offlineState.extensionsUsed < offlineState.maxExtensions
                  ? offlineActions.extendCountdown
                  : null
              }
              extensionsRemaining={offlineState.maxExtensions - offlineState.extensionsUsed}
            />
          </div>
        </>
      );

    case 'awaiting_download':
      // Processing complete, waiting for user to download
      // Just render children - no overlay needed
      // The download will trigger tab close for offline mode
      return <>{children}</>;

    case 'online_acknowledged':
    case 'offline_ready':
    case 'processing':
      // Normal operation - render children
      // online_acknowledged shows warning banner handled in parent
      return <>{children}</>;

    default:
      return <>{children}</>;
  }
}

/**
 * Export state and actions types for use by parent components
 */
export type { OfflineEnforcementState, OfflineEnforcementActions };
