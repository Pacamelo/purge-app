/**
 * VaultLayout Component
 *
 * Two-column layout for the Vault section:
 * - Left: TrustPanel sidebar (270px, collapsible on mobile)
 * - Right: Main content area
 */

import { ReactNode, useState } from 'react';
import { PurgeLogo } from '@/components/Brand';

interface VaultLayoutProps {
  /** Content for the TrustPanel sidebar */
  trustPanel: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Show online mode warning banner */
  showOnlineWarning?: boolean;
  /** Header action button (e.g., NEW SHRED) */
  headerAction?: ReactNode;
}

export function VaultLayout({
  trustPanel,
  children,
  showOnlineWarning = false,
  headerAction,
}: VaultLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-full w-full bg-forge-bg-primary flex flex-col overflow-hidden font-mono">
      {/* Online Mode Warning Banner */}
      {showOnlineWarning && (
        <div className="bg-forge-warning/20 border-b-2 border-forge-warning px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-forge-warning text-lg">&#9888;</span>
          <span className="font-mono text-xs sm:text-sm text-forge-warning uppercase tracking-wider text-center">
            Online Mode - Trusting this website
          </span>
          <span className="text-forge-warning text-lg">&#9888;</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-forge-border bg-forge-bg-secondary">
        <div className="flex items-center gap-4">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-forge-text-secondary hover:text-forge-accent transition-colors"
            aria-label="Toggle trust panel"
          >
            <MenuIcon />
          </button>
          <PurgeLogo size="md" variant="white" />
          <p className="text-xs text-forge-text-dim uppercase tracking-wider hidden md:block">
            Private/Universal Redaction & Governance Engine
          </p>
        </div>
        <div className="flex items-center gap-4">
          {headerAction}
        </div>
      </header>

      {/* Main Content - Two column layout */}
      <main className="flex-1 overflow-hidden flex relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* LEFT COLUMN: Trust Panel (drawer on mobile) */}
        <aside
          className={`
            fixed lg:relative inset-y-0 left-0 z-50
            w-72 border-r border-forge-border bg-forge-bg-secondary
            overflow-y-auto flex-shrink-0
            transform transition-transform duration-300 ease-in-out
            lg:transform-none
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-forge-border">
            <span className="text-xs text-forge-text-dim uppercase tracking-wider">Trust Panel</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-forge-text-secondary hover:text-forge-accent transition-colors"
              aria-label="Close sidebar"
            >
              <CloseIcon />
            </button>
          </div>
          {trustPanel}
        </aside>

        {/* RIGHT COLUMN: Main content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
