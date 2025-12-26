/**
 * SectionRouter
 * Determines which section (Lobby or Vault) to render based on current state
 */

import { usePurgeStore } from '@/core/store/usePurgeStore';
import { useOfflineEnforcement } from '@/core/hooks/useOfflineEnforcement';
import { determineActiveSection } from './types';
import { Lobby } from './Lobby';
import { Vault } from './Vault';

/**
 * Routes between Lobby and Vault sections based on application state
 *
 * Lobby handles:
 * - Gate states (online_blocked, sw_blocked, quota_exhausted, reconnected_abort)
 * - Pre-processing states (idle, loaded)
 *
 * Vault handles:
 * - Processing states (column_select, scanning, preview, shredding, complete, jammed)
 */
export function SectionRouter() {
  const state = usePurgeStore((s) => s.state);
  const { state: offlineState } = useOfflineEnforcement();

  const activeSection = determineActiveSection(state, offlineState.status);

  if (activeSection === 'vault') {
    return <Vault />;
  }

  return <Lobby />;
}
