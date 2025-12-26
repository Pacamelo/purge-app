/**
 * Vault Section
 *
 * The processing workspace for PURGE - handles:
 * - Column selection (XLSX)
 * - Scanning and detection
 * - Preview and configuration
 * - Shredding animation
 * - Output and download
 *
 * Layout: Two-column (TrustPanel 270px sidebar + Main content)
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { usePurgeStore, getSensitivityThreshold } from '@/core/store/usePurgeStore';
import { useOfflineEnforcement } from '@/core/hooks/useOfflineEnforcement';
import { useDocumentProcessor } from '@/core/hooks/useDocumentProcessor';
import { useNetworkProof } from '@/core/hooks/useNetworkProof';
import { useStorageProof } from '@/core/hooks/useStorageProof';
import { useAirplaneMode } from '@/core/hooks/useAirplaneMode';
import { useFileHash } from '@/core/hooks/useFileHash';
import { downloadFilesAsZip, downloadFile } from '@/core/utils/download';
import { secureWarn } from '@/core/utils/secureLogger';
import type { ProcessedFile, ColumnSelectionConfig } from '@/core/types';

import { VaultLayout } from './VaultLayout';
import {
  TrustPanel,
  DetectionPreview,
  ShredAnimation,
  OutputBin,
  ControlPanel,
  ColumnSelector,
} from './components';
import { ShredderHousing } from '@/components/ShredderHousing';
import { LumbergSpeech } from '@/core/personality/LumbergSpeech';

/**
 * Vault section - the processing workspace
 * Handles column_select, scanning, preview, shredding, and complete states
 */
export function Vault() {
  // Offline enforcement
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

  // Store actions
  const setState = usePurgeStore((s) => s.setState);
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

  // Trust panel hooks
  const networkProof = useNetworkProof();
  const storageProof = useStorageProof();
  const airplaneMode = useAirplaneMode();
  const fileHash = useFileHash();

  // Local state
  const [paranoidMode, setParanoidMode] = useState(false);
  const [fileHashes, setFileHashes] = useState<Map<string, { original: string; processed: string }>>(
    new Map()
  );
  const [processingTimestamp, setProcessingTimestamp] = useState<string | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Derive processing state flags
  const hasStartedProcessing = ['scanning', 'shredding', 'preview', 'complete'].includes(state);
  const hasCompletedProcessing = state === 'complete';

  // Filter detections by current sensitivity threshold
  const filteredDetections = useMemo(() => {
    const threshold = getSensitivityThreshold(config.sensitivity);
    return detections.filter((d) => d.confidence >= threshold);
  }, [detections, config.sensitivity]);

  // Count of visible selected items
  const visibleSelectedCount = useMemo(() => {
    const visibleIds = new Set(filteredDetections.map((d) => d.id));
    return [...selectedDetections].filter((id) => visibleIds.has(id)).length;
  }, [filteredDetections, selectedDetections]);

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

  // Hook method references
  const { stopRecording } = networkProof;
  const { takeAfterSnapshot, verifyWatermark } = storageProof;
  const { endProcessing: endAirplaneTracking } = airplaneMode;

  // Sync offline enforcement with PURGE state machine
  useEffect(() => {
    if (
      state === 'scanning' &&
      (offlineState.status === 'offline_ready' || offlineState.status === 'online_acknowledged')
    ) {
      offlineActions.startProcessing();
    } else if (state === 'complete' && offlineState.status === 'processing') {
      offlineActions.completeProcessing();
    }
  }, [state, offlineState.status, offlineActions]);

  // Mark download in offline enforcement
  useEffect(() => {
    if (hasDownloaded && !offlineState.hasDownloaded) {
      offlineActions.markDownloaded();
    }
  }, [hasDownloaded, offlineState.hasDownloaded, offlineActions]);

  // Handle processing completion
  useEffect(() => {
    if (state === 'complete') {
      stopRecording();
      takeAfterSnapshot();
      verifyWatermark();
      endAirplaneTracking();
      setProcessingTimestamp(new Date().toISOString());
    }
  }, [state, stopRecording, takeAfterSnapshot, verifyWatermark, endAirplaneTracking]);

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
    setState('loaded');
  }, [setState]);

  /**
   * Handle column selection cancel
   */
  const handleColumnSelectionCancel = useCallback(() => {
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
   * Handle rescan with new config
   */
  const handleRescan = useCallback(async () => {
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
    if (!offlineState.canProcess) {
      secureWarn(`Cannot shred - offline enforcement state: ${offlineState.status}`);
      return;
    }

    setState('shredding');

    try {
      const visibleIds = new Set(filteredDetections.map((d) => d.id));
      const visibleSelected = new Set(
        [...selectedDetections].filter((id) => visibleIds.has(id))
      );

      const results = await processFiles(queuedFiles, visibleSelected, config);

      for (const file of results) {
        addProcessedFile(file);

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

      await wipeMemory();
      clearDetectionValues();
      setState('complete');
    } catch (error) {
      secureWarn('Shredding failed', error);
    }
  }, [
    queuedFiles,
    selectedDetections,
    filteredDetections,
    config,
    setState,
    processFiles,
    addProcessedFile,
    wipeMemory,
    clearDetectionValues,
    fileHash,
    offlineState.canProcess,
    offlineState.status,
  ]);

  /**
   * Handle clear jam
   */
  const handleClearJam = useCallback(() => {
    clearJam();
  }, [clearJam]);

  /**
   * Handle reset (NEW SHRED) - returns to Lobby
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

  // Render content based on state
  const renderContent = () => {
    switch (state) {
      case 'column_select':
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
        return null;

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

      case 'jammed':
        return (
          <div className="p-4 bg-forge-error/10 border-t border-forge-error">
            <p className="text-forge-error text-center font-mono text-sm">
              PAPER JAM: {jamReason}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Trust Panel component
  const trustPanel = (
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
  );

  // NEW SHRED button
  const headerAction = (
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
  );

  return (
    <VaultLayout
      trustPanel={trustPanel}
      showOnlineWarning={offlineState.status === 'online_acknowledged'}
      headerAction={headerAction}
    >
      {/* Lumbergh Speech - show on certain states */}
      {['column_select', 'jammed', 'complete'].includes(state) && (
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
    </VaultLayout>
  );
}
