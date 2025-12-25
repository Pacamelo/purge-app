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

import { useCallback, useEffect, useState, useMemo } from 'react';
import { usePurgeStore, getSensitivityThreshold } from '@/core/store/usePurgeStore';
import { ShredderHousing } from '@/components/ShredderHousing';
import { FeedSlot } from '@/components/FeedSlot/FeedSlot';
import { ControlPanel } from '@/components/ControlPanel/ControlPanel';
import { DetectionPreview } from '@/components/Preview/DetectionPreview';
import { ShredAnimation } from '@/components/Processing/ShredAnimation';
import { OutputBin } from '@/components/Output/OutputBin';
import { TrustPanel } from '@/components/TrustPanel/TrustPanel';
import { LumbergSpeech } from '@/core/personality/LumbergSpeech';
import { OfflineGate } from '@/components/OfflineGate';
import { PurgeErrorBoundary } from '@/components/PurgeErrorBoundary';
import { ColumnSelector } from '@/components/ColumnSelector';
import { NetworkModeToggle } from '@/components/NetworkModeToggle';
import { useDocumentProcessor } from '@/core/hooks/useDocumentProcessor';
import { useNetworkProof } from '@/core/hooks/useNetworkProof';
import { useStorageProof } from '@/core/hooks/useStorageProof';
import { useAirplaneMode } from '@/core/hooks/useAirplaneMode';
import { useFileHash } from '@/core/hooks/useFileHash';
import { useOfflineEnforcement } from '@/core/hooks/useOfflineEnforcement';
import { useSpreadsheetMetadata } from '@/core/hooks/useSpreadsheetMetadata';
import { generateSecureId } from '@/core/utils/secureRandom';
import { downloadFilesAsZip, downloadFile } from '@/core/utils/download';
import type { QueuedFile, ProcessedFile, ColumnSelectionConfig } from '@/core/types';
import { secureWarn } from '@/core/utils/secureLogger';
import { validateFileType } from '@/core/utils/fileMagic';

// Re-export generateSecureId as generateId for local use
const generateId = generateSecureId;

/**
 * Inner PURGE module component (wrapped by error boundary)
 */
function PurgeModuleInner() {
  // Offline enforcement for privacy assurance
  const { state: offlineState, actions: offlineActions } = useOfflineEnforcement();

  // Store state
  const state = usePurgeStore((s) => s.state);
  const queuedFiles = usePurgeStore((s) => s.queuedFiles);
  const processedFiles = usePurgeStore((s) => s.processedFiles);
  const detections = usePurgeStore((s) => s.detections);
  const selectedDetections = usePurgeStore((s) => s.selectedDetections);
  const config = usePurgeStore((s) => s.config);
  const jamReason = usePurgeStore((s) => s.jamReason);
  const jamCount = usePurgeStore((s) => s.jamCount);
  const columnConfig = usePurgeStore((s) => s.columnConfig);
  const spreadsheetMetadata = usePurgeStore((s) => s.spreadsheetMetadata);
  // Note: columnAccessProof available via usePurgeStore when TrustPanel attestation display is added

  // Store actions
  const setState = usePurgeStore((s) => s.setState);
  const feedDocuments = usePurgeStore((s) => s.feedDocuments);
  const removeDocument = usePurgeStore((s) => s.removeDocument);
  const setDetections = usePurgeStore((s) => s.setDetections);
  const toggleDetection = usePurgeStore((s) => s.toggleDetection);
  const selectAllDetections = usePurgeStore((s) => s.selectAllDetections);
  const deselectAllDetections = usePurgeStore((s) => s.deselectAllDetections);
  const toggleCategory = usePurgeStore((s) => s.toggleCategory);
  const setRedactionStyle = usePurgeStore((s) => s.setRedactionStyle);
  const updateConfig = usePurgeStore((s) => s.updateConfig);
  const addProcessedFile = usePurgeStore((s) => s.addProcessedFile);
  const clearJam = usePurgeStore((s) => s.clearJam);
  const reset = usePurgeStore((s) => s.reset);
  const setColumnConfig = usePurgeStore((s) => s.setColumnConfig);
  const setSpreadsheetMetadata = usePurgeStore((s) => s.setSpreadsheetMetadata);
  // Note: setColumnAccessProof available via usePurgeStore when XlsxProcessor attestations are integrated
  const clearDetectionValues = usePurgeStore((s) => s.clearDetectionValues);

  // Processing hook
  const {
    isProcessing,
    progress,
    memoryStats,
    entropyComparison,
    isCalculatingEntropy,
    contentSections,
    scanFiles,
    processFiles,
    wipeMemory,
  } = useDocumentProcessor();

  // Spreadsheet metadata extraction hook
  const { extractMetadata } = useSpreadsheetMetadata();

  // Local state for paranoid mode (hide column headers)
  const [paranoidMode, setParanoidMode] = useState(false);

  // Trust panel hooks
  const networkProof = useNetworkProof();
  const storageProof = useStorageProof();
  const airplaneMode = useAirplaneMode();
  const fileHash = useFileHash();

  // Track file hashes for integrity verification
  const [fileHashes, setFileHashes] = useState<Map<string, { original: string; processed: string }>>(
    new Map()
  );
  const [processingTimestamp, setProcessingTimestamp] = useState<string | null>(null);

  // Derive processing state flags
  const hasStartedProcessing = ['scanning', 'shredding', 'preview', 'complete'].includes(state);
  const hasCompletedProcessing = state === 'complete';

  // Filter detections by current sensitivity threshold (client-side filtering)
  // This enables instant sensitivity changes without rescanning
  const filteredDetections = useMemo(() => {
    const threshold = getSensitivityThreshold(config.sensitivity);
    return detections.filter((d) => d.confidence >= threshold);
  }, [detections, config.sensitivity]);

  // Count of visible selected items (for display and shredding)
  const visibleSelectedCount = useMemo(() => {
    const visibleIds = new Set(filteredDetections.map((d) => d.id));
    return [...selectedDetections].filter((id) => visibleIds.has(id)).length;
  }, [filteredDetections, selectedDetections]);

  // Track if download has happened (for offline enforcement)
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Airplane mode controls for TrustPanel
  const airplaneModeControls = useMemo(
    () => ({
      acceptChallenge: airplaneMode.acceptChallenge,
      startProcessing: airplaneMode.startProcessing,
      completeProcessing: airplaneMode.endProcessing,
      reset: airplaneMode.reset,
    }),
    [airplaneMode.acceptChallenge, airplaneMode.startProcessing, airplaneMode.endProcessing, airplaneMode.reset]
  );

  // Sync offline enforcement with PURGE state machine
  useEffect(() => {
    // Allow starting from both offline_ready (offline) and online_acknowledged (trusted online)
    if (
      state === 'scanning' &&
      (offlineState.status === 'offline_ready' || offlineState.status === 'online_acknowledged')
    ) {
      offlineActions.startProcessing();
    } else if (state === 'complete' && offlineState.status === 'processing') {
      offlineActions.completeProcessing();
    }
  }, [state, offlineState.status, offlineActions]);

  // Mark download in offline enforcement when it happens
  useEffect(() => {
    if (hasDownloaded && !offlineState.hasDownloaded) {
      offlineActions.markDownloaded();
    }
  }, [hasDownloaded, offlineState.hasDownloaded, offlineActions]);

  // Start recording when processing begins
  // Note: Hook returns are stable references, so we use specific methods in dependencies
  const { startRecording, stopRecording } = networkProof;
  const { takeBeforeSnapshot, takeAfterSnapshot, plantWatermark, verifyWatermark } = storageProof;
  const { startProcessing: startAirplaneTracking, endProcessing: endAirplaneTracking } = airplaneMode;

  useEffect(() => {
    // R-1 FIX: Monitoring is now started in handleStartScan before state change
    // This effect only handles shredding state and cleanup on complete
    if (state === 'shredding') {
      // Shredding follows scanning, monitoring should already be active
      // but ensure it's running in case of direct state entry
      startRecording();
      takeBeforeSnapshot();
      plantWatermark();
    } else if (state === 'complete') {
      stopRecording();
      takeAfterSnapshot();
      verifyWatermark();
      // End airplane mode tracking
      endAirplaneTracking();
      setProcessingTimestamp(new Date().toISOString());
    }
  }, [
    state,
    startRecording,
    stopRecording,
    takeBeforeSnapshot,
    takeAfterSnapshot,
    plantWatermark,
    verifyWatermark,
    endAirplaneTracking,
  ]);

  /**
   * Handle files dropped into feed slot
   * M-7: Uses magic byte validation in addition to extension check
   */
  const handleFilesDropped = useCallback(
    async (files: File[]) => {
      const validFiles: QueuedFile[] = [];
      let hasXlsxFiles = false;

      for (const file of files) {
        // M-7: Full validation with magic bytes (not just extension)
        const validation = await validateFileType(file);

        if (validation.valid && validation.fileType) {
          const fileType = validation.fileType;

          // Log any warnings from validation
          for (const warning of validation.warnings) {
            secureWarn(`File validation warning: ${warning}`);
          }

          const fileId = generateId();
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

          // Hash original file for integrity verification
          try {
            const originalHash = await fileHash.hashOriginalFile(file);
            setFileHashes((prev) => {
              const next = new Map(prev);
              next.set(fileId, { original: originalHash, processed: '' });
              return next;
            });
          } catch (error) {
            secureWarn('Failed to hash file', error);
          }
        } else if (validation.error) {
          // Log why the file was rejected
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

              // Initialize column config with all columns selected
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

              // Transition to column selection state
              setState('column_select');
            } catch (error) {
              secureWarn('Failed to extract spreadsheet metadata', error);
              // Fall back to normal flow without column selection
            }
          }
        }
      }
    },
    [feedDocuments, fileHash, extractMetadata, paranoidMode, setSpreadsheetMetadata, setColumnConfig, setState]
  );

  /**
   * Handle column selection change
   */
  const handleColumnSelectionChange = useCallback(
    (newConfig: ColumnSelectionConfig) => {
      setColumnConfig(newConfig);
    },
    [setColumnConfig]
  );

  /**
   * Handle column selection confirm - proceed to scanning
   */
  const handleColumnSelectionConfirm = useCallback(() => {
    // Transition to loaded state, ready for scan
    setState('loaded');
  }, [setState]);

  /**
   * Handle column selection cancel - go back to loaded state with all columns
   */
  const handleColumnSelectionCancel = useCallback(() => {
    // Reset to all columns selected
    if (spreadsheetMetadata) {
      const allColumns = new Set<string>();
      const allSheets = new Set<string>();
      spreadsheetMetadata.sheets.forEach((sheet) => {
        allSheets.add(sheet.name);
        sheet.columns.forEach((col) => allColumns.add(col));
      });
      setColumnConfig({
        mode: 'all',
        selectedColumns: allColumns,
        selectedSheets: allSheets,
      });
    }
    setState('loaded');
  }, [spreadsheetMetadata, setColumnConfig, setState]);

  /**
   * Handle start scanning
   * R-1 FIX: Start monitoring BEFORE state transition to close race window
   */
  const handleStartScan = useCallback(async () => {
    // Guard: Ensure offline enforcement allows processing
    if (!offlineState.canProcess) {
      secureWarn(`Cannot scan - offline enforcement state: ${offlineState.status}`);
      return;
    }

    // R-1: Start monitoring BEFORE state change to prevent race condition
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
      // Jam state will be set by the hook if needed
    }
  }, [queuedFiles, config, setState, scanFiles, setDetections, offlineState.canProcess, offlineState.status, startRecording, takeBeforeSnapshot, plantWatermark, startAirplaneTracking]);

  /**
   * Handle rescan with new config
   */
  const handleRescan = useCallback(async () => {
    // Guard: Ensure offline enforcement allows processing
    if (!offlineState.canProcess) {
      secureWarn(`Cannot rescan - offline enforcement state: ${offlineState.status}`);
      return;
    }

    setState('scanning');

    try {
      const results = await scanFiles(queuedFiles, config);
      setDetections(results);
      setState('preview');
    } catch (error) {
      secureWarn('Rescan failed', error);
    }
  }, [queuedFiles, config, setState, scanFiles, setDetections, offlineState.canProcess, offlineState.status]);

  /**
   * Handle proceed to shredding
   */
  const handleProceedToShred = useCallback(async () => {
    // Guard: Ensure offline enforcement allows processing
    if (!offlineState.canProcess) {
      secureWarn(`Cannot shred - offline enforcement state: ${offlineState.status}`);
      return;
    }

    setState('shredding');

    try {
      // Only redact items that are both selected AND visible at current sensitivity
      const visibleIds = new Set(filteredDetections.map((d) => d.id));
      const visibleSelected = new Set(
        [...selectedDetections].filter((id) => visibleIds.has(id))
      );

      const results = await processFiles(queuedFiles, visibleSelected, config);

      for (const file of results) {
        addProcessedFile(file);

        // Hash processed file for integrity verification
        try {
          const processedHash = await fileHash.hashProcessedBlob(file.blob);
          setFileHashes((prev) => {
            const next = new Map(prev);
            const existing = next.get(file.id);
            if (existing) {
              next.set(file.id, { ...existing, processed: processedHash });
            } else {
              next.set(file.id, { original: '', processed: processedHash });
            }
            return next;
          });
        } catch (error) {
          secureWarn('Failed to hash processed file', error);
        }
      }

      // Wipe memory after processing
      await wipeMemory();

      // Clear PII values from detection objects for privacy
      clearDetectionValues();

      setState('complete');
    } catch (error) {
      secureWarn('Shredding failed', error);
    }
  }, [queuedFiles, selectedDetections, filteredDetections, config, setState, processFiles, addProcessedFile, wipeMemory, clearDetectionValues, fileHash, offlineState.canProcess, offlineState.status]);

  /**
   * Handle clear jam
   */
  const handleClearJam = useCallback(() => {
    clearJam();
  }, [clearJam]);

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    reset();
    networkProof.clearRequests();
    airplaneMode.reset();
    fileHash.reset();
    offlineActions.reset();
    setFileHashes(new Map());
    setProcessingTimestamp(null);
    setHasDownloaded(false);
  }, [reset, networkProof, airplaneMode, fileHash, offlineActions]);

  /**
   * Handle download single file
   */
  const handleDownload = useCallback((file: ProcessedFile) => {
    downloadFile(file);
    setHasDownloaded(true);
  }, []);

  /**
   * Handle download all files as ZIP
   */
  const handleDownloadAll = useCallback(async () => {
    await downloadFilesAsZip(processedFiles);
    setHasDownloaded(true);
  }, [processedFiles]);

  // Render based on state
  const renderContent = () => {
    switch (state) {
      case 'preview':
        return (
          <DetectionPreview
            detections={filteredDetections}
            selectedIds={selectedDetections}
            config={config}
            onToggleDetection={toggleDetection}
            onSelectAll={() => selectAllDetections(filteredDetections.map((d) => d.id))}
            onDeselectAll={deselectAllDetections}
            onToggleCategory={toggleCategory}
            onStyleChange={setRedactionStyle}
            onReplacementTextChange={(text) => updateConfig({ replacementText: text })}
            onSensitivityChange={(sensitivity) => updateConfig({ sensitivity })}
            onRescan={handleRescan}
            onProceed={handleProceedToShred}
            visibleSelectedCount={visibleSelectedCount}
            totalDetectionCount={detections.length}
            sections={contentSections}
          />
        );

      case 'scanning':
      case 'shredding':
        // Show animation with progress, or a "completing" state if progress is null
        // (progress becomes null briefly before state transitions to next phase)
        return (
          <ShredAnimation
            progress={progress ?? {
              currentFileIndex: 0,
              totalFiles: 1,
              currentFileName: 'Completing...',
              phase: state === 'scanning' ? 'detecting' : 'redacting',
              percent: 100,
            }}
            isActive={isProcessing}
            jamCount={jamCount}
          />
        );

      case 'complete':
        return (
          <OutputBin
            files={processedFiles}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
            isOfflineMode={!offlineState.startedOnline}
          />
        );

      case 'column_select':
        // Show column selector for XLSX files
        if (spreadsheetMetadata && columnConfig) {
          return (
            <div className="p-4 max-w-2xl mx-auto">
              <ColumnSelector
                metadata={spreadsheetMetadata}
                selection={columnConfig}
                onSelectionChange={handleColumnSelectionChange}
                onConfirm={handleColumnSelectionConfirm}
                onCancel={handleColumnSelectionCancel}
                paranoidMode={paranoidMode}
                onParanoidModeChange={setParanoidMode}
              />
            </div>
          );
        }
        // Fallback if no metadata (shouldn't happen)
        return null;

      default:
        return (
          <>
            {/* Feed Slot */}
            <FeedSlot
              onFilesDropped={handleFilesDropped}
              disabled={state === 'jammed'}
              queuedFiles={queuedFiles}
              onRemoveFile={removeDocument}
            />

            {/* Action Button */}
            {queuedFiles.length > 0 && state !== 'jammed' && (
              <div className="p-4 flex justify-center">
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
              <div className="p-4 bg-forge-error/10 border-t border-forge-error">
                <p className="text-forge-error text-center font-mono text-sm">
                  PAPER JAM: {jamReason}
                </p>
              </div>
            )}
          </>
        );
    }
  };

  // Determine if we should show the OfflineGate blocking states
  // Demo mode bypasses the online_blocked state
  const shouldShowOfflineGate =
    (!offlineState.demoModeEnabled && offlineState.status === 'online_blocked') ||
    offlineState.status === 'sw_blocked' ||
    offlineState.status === 'reconnected_abort' ||
    offlineState.status === 'reconnected_warning';

  // Show offline gate blocking UI when needed
  if (shouldShowOfflineGate) {
    return (
      <OfflineGate
        offlineState={offlineState}
        offlineActions={offlineActions}
      >
        {/* This won't render - OfflineGate will show blocking UI */}
        <div />
      </OfflineGate>
    );
  }

  return (
    <div className="h-full w-full bg-forge-bg-primary flex flex-col overflow-hidden font-mono">
      {/* Online Mode Warning Banner */}
      {offlineState.status === 'online_acknowledged' && (
        <div className="bg-forge-warning/20 border-b-2 border-forge-warning px-4 py-2 flex items-center justify-center gap-3">
          <span className="text-forge-warning text-lg">&#9888;</span>
          <span className="font-mono text-sm text-forge-warning uppercase tracking-wider">
            Online Mode - You are trusting this website with your data
          </span>
          <span className="text-forge-warning text-lg">&#9888;</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-forge-border bg-forge-bg-secondary">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            <span className="text-forge-text-dim">[</span>
            <span className="text-forge-accent">PURGE</span>
            <span className="text-forge-text-dim">]</span>
          </div>
          <div>
            <p className="text-xs text-forge-text-dim uppercase tracking-wider">
              Private/Universal Redaction & Governance Engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Network mode toggle */}
          <NetworkModeToggle
            isOnline={offlineState.isOnline}
            demoModeEnabled={offlineState.demoModeEnabled}
            onToggleDemoMode={offlineActions.toggleDemoMode}
            disabled={hasStartedProcessing}
          />
          {/* New Shred button */}
          {(state === 'complete' || queuedFiles.length > 0) && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm font-mono uppercase tracking-wider
                         bg-forge-bg-tertiary border border-forge-border
                         text-forge-text-secondary hover:text-forge-accent hover:border-forge-accent
                         shadow-[2px_2px_0px_0px] shadow-forge-bg-primary
                         active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                         transition-all"
            >
              [NEW SHRED]
            </button>
          )}
        </div>
      </header>

      {/* Main Content - Two column layout */}
      <main className="flex-1 overflow-hidden flex">
        {/* LEFT COLUMN: Trust Panel (always visible as disclaimer) */}
        <aside className="w-72 border-r border-forge-border bg-forge-bg-secondary overflow-y-auto flex-shrink-0">
          <TrustPanel
            networkRequests={networkProof.requests}
            isRecording={networkProof.isRecording}
            totalBytes={networkProof.totalBytes}
            beforeSnapshot={storageProof.beforeSnapshot}
            afterSnapshot={storageProof.afterSnapshot}
            storageDifferent={storageProof.isDifferent}
            watermarkStatus={storageProof.watermarkStatus}
            memoryStats={memoryStats}
            isWiping={isProcessing && progress?.phase === 'finalizing'}
            airplaneModeState={airplaneMode.state}
            airplaneModeControls={airplaneModeControls}
            fileHashes={fileHashes}
            timestamp={processingTimestamp}
            processedFiles={processedFiles}
            hasStartedProcessing={hasStartedProcessing}
            hasCompletedProcessing={hasCompletedProcessing}
            entropyComparison={entropyComparison}
            isCalculatingEntropy={isCalculatingEntropy}
            detections={filteredDetections}
            selectedDetections={selectedDetections}
            config={config}
          />
        </aside>

        {/* RIGHT COLUMN: Main content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Lumbergh Speech - only show on idle/loaded/jammed states */}
          {['idle', 'loaded', 'jammed', 'complete'].includes(state) && (
            <div className="p-4 max-w-2xl mx-auto w-full">
              <LumbergSpeech
                state={state}
                jamCount={jamCount}
                fileCount={queuedFiles.length}
              />
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {state === 'preview' ? (
              // Preview takes full width
              <div className="h-full overflow-hidden">{renderContent()}</div>
            ) : (
              // Other states use shredder housing
              <div className="h-full flex flex-col items-center justify-center p-4">
                <ShredderHousing state={state} isJammed={state === 'jammed'}>
                  <ControlPanel
                    state={state}
                    fileCount={queuedFiles.length}
                    onClearJam={handleClearJam}
                  />
                  {renderContent()}
                </ShredderHousing>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Main PURGE module component with error boundary
 * Wraps PurgeModuleInner to catch and handle errors gracefully
 */
export default function PurgeModule() {
  const reset = usePurgeStore((s) => s.reset);

  return (
    <PurgeErrorBoundary onReset={reset}>
      <PurgeModuleInner />
    </PurgeErrorBoundary>
  );
}
