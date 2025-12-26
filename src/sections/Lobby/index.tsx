/**
 * Lobby Section
 *
 * The entry experience for PURGE - handles:
 * - Gate states (offline blocking, service worker detection, etc.)
 * - File intake (FeedSlot, document queue)
 * - SCAN button to transition to Vault
 *
 * Layout: Centered single-column, clean gradient background
 */

import { useCallback } from 'react';
import { usePurgeStore } from '@/core/store/usePurgeStore';
import { useOfflineEnforcement } from '@/core/hooks/useOfflineEnforcement';
import { useSpreadsheetMetadata } from '@/core/hooks/useSpreadsheetMetadata';
import { useFileHash } from '@/core/hooks/useFileHash';
import { useDocumentProcessor } from '@/core/hooks/useDocumentProcessor';
import { useNetworkProof } from '@/core/hooks/useNetworkProof';
import { useStorageProof } from '@/core/hooks/useStorageProof';
import { useAirplaneMode } from '@/core/hooks/useAirplaneMode';
import { generateSecureId } from '@/core/utils/secureRandom';
import { validateFileType } from '@/core/utils/fileMagic';
import { secureWarn } from '@/core/utils/secureLogger';
import type { QueuedFile } from '@/core/types';

import { LobbyLayout } from './LobbyLayout';
import { OfflineGate, FeedSlot } from './components';
import { ShredderHousing } from '@/components/ShredderHousing';
import { LumbergSpeech } from '@/core/personality/LumbergSpeech';

export function Lobby() {
  // Offline enforcement
  const { state: offlineState, actions: offlineActions } = useOfflineEnforcement();

  // Store state
  const state = usePurgeStore((s) => s.state);
  const queuedFiles = usePurgeStore((s) => s.queuedFiles);
  const config = usePurgeStore((s) => s.config);
  const jamReason = usePurgeStore((s) => s.jamReason);
  const jamCount = usePurgeStore((s) => s.jamCount);

  // Store actions
  const setState = usePurgeStore((s) => s.setState);
  const feedDocuments = usePurgeStore((s) => s.feedDocuments);
  const removeDocument = usePurgeStore((s) => s.removeDocument);
  const clearJam = usePurgeStore((s) => s.clearJam);
  const setColumnConfig = usePurgeStore((s) => s.setColumnConfig);
  const setSpreadsheetMetadata = usePurgeStore((s) => s.setSpreadsheetMetadata);
  const setDetections = usePurgeStore((s) => s.setDetections);

  // Hooks
  const { extractMetadata } = useSpreadsheetMetadata();
  const fileHash = useFileHash();
  const { scanFiles } = useDocumentProcessor();
  const { startRecording } = useNetworkProof();
  const { takeBeforeSnapshot, plantWatermark } = useStorageProof();
  const { startProcessing: startAirplaneTracking } = useAirplaneMode();

  // Default paranoid mode - affects how metadata is extracted
  // (false = include column headers for better UX)
  const paranoidMode = false;

  /**
   * Handle files dropped into feed slot
   */
  const handleFilesDropped = useCallback(
    async (files: File[]) => {
      const validFiles: QueuedFile[] = [];
      let hasXlsxFiles = false;

      for (const file of files) {
        const validation = await validateFileType(file);

        if (validation.valid && validation.fileType) {
          const fileType = validation.fileType;

          for (const warning of validation.warnings) {
            secureWarn(`File validation warning: ${warning}`);
          }

          const fileId = generateSecureId();
          validFiles.push({
            id: fileId,
            file,
            name: file.name,
            size: file.size,
            type: fileType,
            status: 'queued',
          });

          if (fileType === 'xlsx') {
            hasXlsxFiles = true;
          }

          // Hash original file
          try {
            await fileHash.hashOriginalFile(file);
          } catch (error) {
            secureWarn('Failed to hash file', error);
          }
        } else if (validation.error) {
          secureWarn(`File rejected: ${validation.error}`);
        }
      }

      if (validFiles.length > 0) {
        feedDocuments(validFiles);

        // If any XLSX files, extract metadata and offer column selection
        if (hasXlsxFiles) {
          const xlsxFile = validFiles.find((f) => f.type === 'xlsx');
          if (xlsxFile) {
            try {
              const metadata = await extractMetadata(xlsxFile.file, !paranoidMode);
              setSpreadsheetMetadata(metadata);

              const allColumns = new Set<string>();
              const allSheets = new Set<string>();
              metadata.sheets.forEach((sheet) => {
                allSheets.add(sheet.name);
                sheet.columns.forEach((col) => allColumns.add(col));
              });

              setColumnConfig({
                mode: 'all',
                selectedColumns: allColumns,
                selectedSheets: allSheets,
              });

              setState('column_select');
            } catch (error) {
              secureWarn('Failed to extract spreadsheet metadata', error);
            }
          }
        }
      }
    },
    [feedDocuments, fileHash, extractMetadata, paranoidMode, setSpreadsheetMetadata, setColumnConfig, setState]
  );

  /**
   * Handle start scan - transitions to Vault
   */
  const handleStartScan = useCallback(async () => {
    if (!offlineState.canProcess) {
      secureWarn(`Cannot scan - offline enforcement state: ${offlineState.status}`);
      return;
    }

    // Start monitoring BEFORE state change
    startRecording();
    takeBeforeSnapshot();
    plantWatermark();
    startAirplaneTracking();

    setState('scanning');

    try {
      const results = await scanFiles(queuedFiles, config);
      setDetections(results);
      setState('preview');
    } catch (error) {
      secureWarn('Scan failed', error);
    }
  }, [
    queuedFiles,
    config,
    setState,
    scanFiles,
    setDetections,
    offlineState.canProcess,
    offlineState.status,
    startRecording,
    takeBeforeSnapshot,
    plantWatermark,
    startAirplaneTracking,
  ]);

  /**
   * Handle clear jam
   */
  const handleClearJam = useCallback(() => {
    clearJam();
  }, [clearJam]);

  // Determine if we should show OfflineGate blocking states
  const shouldShowGate =
    offlineState.status === 'online_blocked' ||
    offlineState.status === 'sw_blocked' ||
    offlineState.status === 'quota_exhausted' ||
    offlineState.status === 'reconnected_abort' ||
    offlineState.status === 'reconnected_warning';

  // Render gate states
  if (shouldShowGate) {
    return (
      <OfflineGate
        offlineState={offlineState}
        offlineActions={offlineActions}
      >
        <div />
      </OfflineGate>
    );
  }

  // Render normal Lobby (idle, loaded states)
  return (
    <LobbyLayout showOnlineWarning={offlineState.status === 'online_acknowledged'}>
      {/* Lumbergh Speech */}
      <div className="mb-6">
        <LumbergSpeech
          state={state}
          jamCount={jamCount}
          fileCount={queuedFiles.length}
        />
      </div>

      {/* Shredder with Feed Slot */}
      <ShredderHousing state={state} isJammed={state === 'jammed'}>
        <FeedSlot
          onFilesDropped={handleFilesDropped}
          disabled={state === 'jammed'}
          queuedFiles={queuedFiles}
          onRemoveFile={removeDocument}
        />
      </ShredderHousing>

      {/* SCAN Button */}
      {queuedFiles.length > 0 && state !== 'jammed' && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleStartScan}
            className="px-6 py-3 text-lg font-mono uppercase tracking-wider
                       bg-forge-error/20 border-2 border-forge-error
                       text-forge-error hover:bg-forge-error hover:text-white
                       shadow-[3px_3px_0px_0px] shadow-forge-error/50
                       active:shadow-none active:translate-x-[3px] active:translate-y-[3px]
                       transition-all"
          >
            [ SCAN {queuedFiles.length} FILE{queuedFiles.length !== 1 ? 'S' : ''} ]
          </button>
        </div>
      )}

      {/* Jam Message */}
      {state === 'jammed' && jamReason && (
        <div className="mt-4 p-4 bg-forge-error/10 border border-forge-error rounded">
          <p className="text-forge-error text-center font-mono text-sm mb-3">
            PAPER JAM: {jamReason}
          </p>
          <div className="flex justify-center">
            <button
              onClick={handleClearJam}
              className="px-4 py-2 text-sm font-mono uppercase
                         bg-forge-bg-secondary border border-forge-border
                         text-forge-text-secondary hover:text-forge-accent hover:border-forge-accent
                         transition-colors"
            >
              Clear Jam
            </button>
          </div>
        </div>
      )}
    </LobbyLayout>
  );
}
