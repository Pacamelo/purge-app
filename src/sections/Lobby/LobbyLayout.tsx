/**
 * LobbyLayout Component
 *
 * Centered single-column layout for the Lobby section.
 * Clean gradient background with trust-building visual design.
 */

import { ReactNode } from 'react';
import { PurgeLogo } from '@/components/Brand';

interface LobbyLayoutProps {
  children: ReactNode;
  /** Show online mode warning banner */
  showOnlineWarning?: boolean;
}

export function LobbyLayout({ children, showOnlineWarning = false }: LobbyLayoutProps) {
  return (
    <div className="h-full w-full bg-forge-bg-primary flex flex-col overflow-hidden font-mono">
      {/* Online Mode Warning Banner */}
      {showOnlineWarning && (
        <div className="bg-forge-warning/20 border-b-2 border-forge-warning px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-forge-warning text-lg">&#9888;</span>
          <span className="font-mono text-sm text-forge-warning uppercase tracking-wider">
            Online Mode - You are trusting this website with your data
          </span>
          <span className="text-forge-warning text-lg">&#9888;</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-center px-4 py-4 border-b border-forge-border bg-forge-bg-secondary">
        <div className="flex flex-col items-center gap-2">
          <PurgeLogo size="lg" variant="white" />
          <p className="text-xs text-forge-text-dim uppercase tracking-wider">
            Private/Universal Redaction & Governance Engine
          </p>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-forge-border bg-forge-bg-secondary">
        <p className="text-center text-xs text-forge-text-dim">
          Client-side processing only. Your data never leaves your device.
        </p>
      </footer>
    </div>
  );
}
