/**
 * PURGE Module
 * Private/Universal Redaction & Governance Engine
 *
 * Document scrubber for portable office documents
 * Removes PII entirely client-side with visual indicators
 *
 * TRUST MODEL: Best-effort privacy indicators
 * - Monitors for network requests during processing
 * - Provides visibility into storage changes
 * - Encourages offline processing for maximum assurance
 *
 * NOTE: PURGE provides indicators and transparency, not security guarantees.
 * For sensitive data, use airplane mode and verify with browser DevTools.
 */

import { usePurgeStore } from '@/core/store/usePurgeStore';
import { PurgeErrorBoundary } from '@/components/PurgeErrorBoundary';
import { SectionRouter } from '@/sections';

/**
 * Main PURGE module component with error boundary
 * Routes between Lobby and Vault sections based on state
 */
export default function PurgeModule() {
  const reset = usePurgeStore((s) => s.reset);

  return (
    <PurgeErrorBoundary onReset={reset}>
      <SectionRouter />
    </PurgeErrorBoundary>
  );
}
