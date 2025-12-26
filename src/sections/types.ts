/**
 * Section Types
 * TypeScript interfaces for Lobby and Vault sections
 */

import type { PurgeState, QueuedFile, ProcessedFile, Detection, ScrubConfig, ColumnSelectionConfig, SpreadsheetMetadata } from '@/core/types';
import type { OfflineEnforcementState, OfflineEnforcementActions } from '@/core/hooks/useOfflineEnforcement';

/**
 * Common props shared between sections
 */
export interface BaseSectionProps {
  /** Current state machine state */
  state: PurgeState;
  /** Offline enforcement state */
  offlineState: OfflineEnforcementState;
  /** Offline enforcement actions */
  offlineActions: OfflineEnforcementActions;
}

/**
 * Props for the Lobby section
 * Handles: idle, loaded, and gate states
 */
export interface LobbyProps extends BaseSectionProps {
  /** Files queued for processing */
  queuedFiles: QueuedFile[];
  /** Spreadsheet metadata for column selection */
  spreadsheetMetadata: SpreadsheetMetadata | null;
  /** Column selection config */
  columnConfig: ColumnSelectionConfig | null;
  /** Current scrub config */
  config: ScrubConfig;
  /** Paper jam reason if any */
  jamReason: string | null;
  /** Handle files dropped into feed slot */
  onFilesDropped: (files: File[]) => Promise<void>;
  /** Handle file removal from queue */
  onRemoveFile: (id: string) => void;
  /** Handle column selection change */
  onColumnSelectionChange: (config: ColumnSelectionConfig) => void;
  /** Handle column selection confirm */
  onColumnSelectionConfirm: () => void;
  /** Handle column selection cancel */
  onColumnSelectionCancel: () => void;
  /** Handle start scan - transitions to Vault */
  onStartScan: () => Promise<void>;
  /** Handle clear jam */
  onClearJam: () => void;
}

/**
 * Props for the Vault section
 * Handles: column_select, scanning, preview, shredding, complete, jammed states
 */
export interface VaultProps extends BaseSectionProps {
  /** Files queued for processing */
  queuedFiles: QueuedFile[];
  /** Files that have been processed */
  processedFiles: ProcessedFile[];
  /** All detections found */
  detections: Detection[];
  /** Filtered detections based on sensitivity */
  filteredDetections: Detection[];
  /** IDs of selected detections */
  selectedDetections: Set<string>;
  /** Count of visible selected items */
  visibleSelectedCount: number;
  /** Current scrub config */
  config: ScrubConfig;
  /** Spreadsheet metadata for column selection */
  spreadsheetMetadata: SpreadsheetMetadata | null;
  /** Column selection config */
  columnConfig: ColumnSelectionConfig | null;
  /** Paper jam reason if any */
  jamReason: string | null;
  /** Paper jam count */
  jamCount: number;
  /** Whether processing is active */
  isProcessing: boolean;
  /** Processing progress */
  progress: {
    currentFileIndex: number;
    totalFiles: number;
    currentFileName: string;
    phase: 'detecting' | 'redacting' | 'finalizing';
    percent: number;
  } | null;
  /** Handle toggle detection selection */
  onToggleDetection: (id: string) => void;
  /** Handle select all detections */
  onSelectAll: () => void;
  /** Handle deselect all detections */
  onDeselectAll: () => void;
  /** Handle toggle category */
  onToggleCategory: (category: string) => void;
  /** Handle redaction style change */
  onStyleChange: (style: ScrubConfig['redactionStyle']) => void;
  /** Handle replacement text change */
  onReplacementTextChange: (text: string) => void;
  /** Handle sensitivity change */
  onSensitivityChange: (sensitivity: ScrubConfig['sensitivity']) => void;
  /** Handle rescan with new config */
  onRescan: () => Promise<void>;
  /** Handle proceed to shredding */
  onProceedToShred: () => Promise<void>;
  /** Handle single file download */
  onDownload: (file: ProcessedFile) => void;
  /** Handle download all files as ZIP */
  onDownloadAll: () => Promise<void>;
  /** Handle reset - returns to Lobby */
  onReset: () => void;
  /** Handle clear jam */
  onClearJam: () => void;
  /** Handle column selection change */
  onColumnSelectionChange: (config: ColumnSelectionConfig) => void;
  /** Handle column selection confirm */
  onColumnSelectionConfirm: () => void;
  /** Handle column selection cancel */
  onColumnSelectionCancel: () => void;
}

/**
 * States that belong to the Lobby section
 */
export const LOBBY_STATES: PurgeState[] = ['idle', 'loaded'];

/**
 * States that belong to the Vault section
 */
export const VAULT_STATES: PurgeState[] = ['column_select', 'scanning', 'preview', 'shredding', 'complete', 'jammed'];

/**
 * Offline enforcement statuses that block and show in Lobby
 */
export const GATE_BLOCKED_STATUSES = [
  'online_blocked',
  'sw_blocked',
  'quota_exhausted',
  'reconnected_abort',
] as const;

/**
 * Determine which section should be active based on state
 */
export function determineActiveSection(
  purgeState: PurgeState,
  offlineStatus: OfflineEnforcementState['status']
): 'lobby' | 'vault' {
  // Gate states always show Lobby with blocking overlay
  if ((GATE_BLOCKED_STATUSES as readonly string[]).includes(offlineStatus)) {
    return 'lobby';
  }

  // Vault states
  if ((VAULT_STATES as readonly string[]).includes(purgeState)) {
    return 'vault';
  }

  // Default to Lobby
  return 'lobby';
}
