/**
 * useDocumentProcessor Hook
 * Main processing hook for document scrubbing workflow
 *
 * NOTE: The wipeMemory function zeros out tracked buffers as a visualization
 * of cleanup, but JavaScript does not provide true secure memory wiping.
 * The original file data may persist in browser memory until garbage collected.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import type {
  QueuedFile,
  ProcessedFile,
  Detection,
  ScrubConfig,
  ProcessingProgress,
  Redaction,
  MemoryStats,
  EntropyComparison,
  ParsedDocument,
  ContentSection,
} from '@/core/types';
import { usePurgeStore } from '@/core/store/usePurgeStore';
import { regexDetectionEngine } from '@/core/services/detection/RegexDetectionEngine';
import { getProcessorForFile } from '@/core/services/processors';
import { useFileEntropy } from './useFileEntropy';
import { generateSecureId } from '@/core/utils/secureRandom';
import { getPartialMask } from '@/core/utils/partialMask';
import { secureWarn, secureLog, safeFilename } from '@/core/utils/secureLogger';

/**
 * Result object returned by the useDocumentProcessor hook
 */
interface UseDocumentProcessorResult {
  /** Whether document processing is currently in progress */
  isProcessing: boolean;
  /** Current processing progress (null when not processing) */
  progress: ProcessingProgress | null;
  /** Array of PII detections found in scanned documents */
  detections: Detection[];
  /** Memory allocation and cleanup statistics */
  memoryStats: MemoryStats;
  /** Before/after entropy comparison for visualization */
  entropyComparison: EntropyComparison;
  /** Whether entropy calculation is in progress */
  isCalculatingEntropy: boolean;
  /** Content sections from parsed documents (for adversarial analysis) */
  contentSections: ContentSection[];

  /**
   * Scan files for PII detections
   * @param files - Array of queued files to scan
   * @param config - Configuration specifying which categories to detect
   * @returns Promise resolving to array of detections found
   */
  scanFiles: (files: QueuedFile[], config: ScrubConfig) => Promise<Detection[]>;

  /**
   * Process files and apply redactions to selected detections
   * @param files - Array of queued files to process
   * @param selectedDetections - Set of detection IDs to redact
   * @param config - Configuration specifying redaction style
   * @returns Promise resolving to array of processed files
   */
  processFiles: (
    files: QueuedFile[],
    selectedDetections: Set<string>,
    config: ScrubConfig
  ) => Promise<ProcessedFile[]>;

  /**
   * Wipe tracked memory buffers (visualization only - not cryptographically secure)
   */
  wipeMemory: () => Promise<void>;
}

/**
 * Generate purged filename by appending _purged before the extension
 * @param originalName - Original filename
 * @returns Filename with _purged suffix
 *
 * SECURITY: Defense-in-depth path traversal prevention.
 * Browser File API already sanitizes File.name to exclude directory paths,
 * but we strip path separators explicitly as belt-and-suspenders.
 */
function getPurgedFilename(originalName: string): string {
  // Strip any path separators (defense-in-depth against path traversal)
  const safeName = originalName.replace(/[/\\]/g, '_');
  const lastDot = safeName.lastIndexOf('.');
  if (lastDot === -1) return `${safeName}_purged`;
  return `${safeName.slice(0, lastDot)}_purged${safeName.slice(lastDot)}`;
}

export function useDocumentProcessor(): UseDocumentProcessorResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    allocated: 0,
    wiped: 0,
    buffersCleared: 0,
    totalBuffers: 0,
  });
  const [entropyComparison, setEntropyComparison] = useState<EntropyComparison>({
    before: null,
    after: null,
    changedRegions: [],
  });
  const [isCalculatingEntropy, setIsCalculatingEntropy] = useState(false);
  const [contentSections, setContentSections] = useState<ContentSection[]>([]);

  // Store refs for cleanup
  const buffersRef = useRef<ArrayBuffer[]>([]);
  const originalBytesRef = useRef<Uint8Array | null>(null);

  // Cache parsed documents by QueuedFile.id to ensure consistent fileId across scan and process
  const parsedDocsRef = useRef<Map<string, ParsedDocument>>(new Map());

  const updateFileStatus = usePurgeStore((s) => s.updateFileStatus);
  const triggerJam = usePurgeStore((s) => s.triggerJam);

  // Entropy calculation hook
  const { calculateEntropy, compareEntropy } = useFileEntropy();

  /**
   * Cleanup effect: Zero out and clear sensitive data on unmount.
   *
   * SECURITY NOTE: This is a best-effort cleanup. JavaScript does not provide
   * true secure memory wiping - data may persist until garbage collected.
   * The zeroing is primarily for demonstration and to encourage GC.
   */
  useEffect(() => {
    return () => {
      // Zero out the original file bytes buffer
      if (originalBytesRef.current) {
        originalBytesRef.current.fill(0);
        originalBytesRef.current = null;
      }

      // Zero out all tracked buffers
      buffersRef.current.forEach((buffer) => {
        new Uint8Array(buffer).fill(0);
      });
      buffersRef.current = [];

      // Clear parsed document cache
      parsedDocsRef.current.clear();

      secureLog('Memory cleanup on unmount');
    };
  }, []);

  /**
   * Scan files for PII detections
   */
  const scanFiles = useCallback(
    async (files: QueuedFile[], config: ScrubConfig): Promise<Detection[]> => {
      setIsProcessing(true);
      setIsCalculatingEntropy(true);
      const allDetections: Detection[] = [];

      // Clear parsed docs cache and sections at start of new scan
      parsedDocsRef.current.clear();
      setContentSections([]);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          setProgress({
            currentFileIndex: i,
            totalFiles: files.length,
            currentFileName: file.name,
            phase: 'detecting',
            percent: Math.round((i / files.length) * 100),
          });

          updateFileStatus(file.id, 'scanning');

          // Get processor for this file type
          const processor = getProcessorForFile(file.file);

          if (!processor) {
            updateFileStatus(file.id, 'error', 'Unsupported file format');
            continue;
          }

          try {
            // Parse the document and cache it for processFiles to reuse
            const parsed = await processor.parse(file.file);
            parsedDocsRef.current.set(file.id, parsed);

            // Collect content sections for adversarial analysis
            setContentSections((prev) => [...prev, ...parsed.content.sections]);

            // Track memory allocation
            buffersRef.current.push(new ArrayBuffer(file.size));
            setMemoryStats((s) => ({
              ...s,
              allocated: s.allocated + file.size,
              totalBuffers: s.totalBuffers + 1,
            }));

            // Calculate original entropy for first file (for visualization)
            if (i === 0) {
              try {
                const originalBytes = await file.file.arrayBuffer();
                originalBytesRef.current = new Uint8Array(originalBytes);
                const beforeEntropy = calculateEntropy(originalBytesRef.current, []);
                setEntropyComparison((prev) => ({
                  ...prev,
                  before: beforeEntropy,
                }));
              } catch (entropyError) {
                secureWarn('Failed to calculate original entropy', entropyError);
              }
            }

            // Run detection at HIGH sensitivity to capture all possible matches.
            // Filtering by user's chosen sensitivity happens client-side in the UI.
            const scanConfig: ScrubConfig = { ...config, sensitivity: 'high' };
            const result = await regexDetectionEngine.detect(parsed.content, scanConfig);

            allDetections.push(...result.detections);
            updateFileStatus(file.id, 'detected');

            // Update before entropy with PII markers
            if (i === 0 && originalBytesRef.current) {
              const beforeEntropyWithPII = calculateEntropy(
                originalBytesRef.current,
                result.detections
              );
              setEntropyComparison((prev) => ({
                ...prev,
                before: beforeEntropyWithPII,
              }));

              // ML-2 FIX: Clear original bytes immediately after entropy calculation
              // to reduce memory footprint. We don't need them anymore for scanning.
              originalBytesRef.current.fill(0);
              originalBytesRef.current = null;
            }

            setProgress((p) =>
              p
                ? {
                    ...p,
                    percent: Math.round(((i + 1) / files.length) * 100),
                  }
                : null
            );
          } catch (error) {
            secureWarn(`Error scanning file ${safeFilename(file.name)}`, error);
            updateFileStatus(
              file.id,
              'error',
              error instanceof Error ? error.message : 'Processing failed'
            );

            // Random jam chance (5%)
            if (Math.random() < 0.05) {
              triggerJam(`Paper jam while scanning ${file.name}`);
              throw new Error('Paper jam');
            }
          }
        }

        setDetections(allDetections);
        return allDetections;
      } finally {
        setIsProcessing(false);
        setIsCalculatingEntropy(false);
        setProgress(null);
      }
    },
    [updateFileStatus, triggerJam, calculateEntropy]
  );

  /**
   * Process files and apply redactions
   */
  const processFiles = useCallback(
    async (
      files: QueuedFile[],
      selectedDetections: Set<string>,
      config: ScrubConfig
    ): Promise<ProcessedFile[]> => {
      setIsProcessing(true);
      const processedFiles: ProcessedFile[] = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          setProgress({
            currentFileIndex: i,
            totalFiles: files.length,
            currentFileName: file.name,
            phase: 'redacting',
            percent: Math.round((i / files.length) * 50),
          });

          updateFileStatus(file.id, 'shredding');

          const processor = getProcessorForFile(file.file);

          if (!processor) {
            updateFileStatus(file.id, 'error', 'Unsupported file format');
            continue;
          }

          try {
            // Use cached parsed document from scanFiles to ensure consistent fileId
            // This fixes the bug where re-parsing generated a new random fileId
            // that wouldn't match detections from the scan phase
            let parsed = parsedDocsRef.current.get(file.id);
            if (!parsed) {
              // Fallback: parse if not cached (shouldn't happen in normal flow)
              secureWarn(`No cached parse for file ${safeFilename(file.name)}, re-parsing`);
              parsed = await processor.parse(file.file);
            }

            // Build redactions from selected detections
            const fileDetections = detections.filter(
              (d) => d.fileId === parsed.content.fileId && selectedDetections.has(d.id)
            );

            const redactions: Redaction[] = fileDetections.map((d) => ({
              detectionId: d.id,
              sectionId: d.sectionId,
              startOffset: d.startOffset,
              endOffset: d.endOffset,
              replacement: getReplacementText(d, config),
            }));

            // Apply redactions
            setProgress((p) =>
              p
                ? {
                    ...p,
                    phase: 'redacting',
                    percent: Math.round(50 + ((i + 0.5) / files.length) * 25),
                  }
                : null
            );

            const blob = await processor.applyRedactions(parsed, redactions);

            // Random jam chance (3%)
            if (Math.random() < 0.03) {
              triggerJam(`Paper jam while shredding ${file.name}`);
              throw new Error('Paper jam');
            }

            setProgress((p) =>
              p
                ? {
                    ...p,
                    phase: 'finalizing',
                    percent: Math.round(75 + ((i + 1) / files.length) * 25),
                  }
                : null
            );

            const processedFile: ProcessedFile = {
              id: generateSecureId(),
              originalName: file.name,
              purgedName: getPurgedFilename(file.name),
              originalSize: file.size,
              purgedSize: blob.size,
              type: file.type,
              blob,
              detectionsRemoved: redactions.length,
              timestamp: Date.now(),
            };

            processedFiles.push(processedFile);
            updateFileStatus(file.id, 'complete');

            // Calculate after entropy for first file (for visualization)
            if (i === 0) {
              try {
                setIsCalculatingEntropy(true);
                const processedBytes = await blob.arrayBuffer();
                const afterEntropy = calculateEntropy(new Uint8Array(processedBytes), []);

                // Update comparison with before/after and find changed regions
                setEntropyComparison((prev) => {
                  const comparison = compareEntropy(prev.before, afterEntropy);
                  return comparison;
                });
              } catch (entropyError) {
                secureWarn('Failed to calculate processed entropy', entropyError);
              } finally {
                setIsCalculatingEntropy(false);
              }
            }
          } catch (error) {
            if (error instanceof Error && error.message === 'Paper jam') {
              throw error;
            }
            secureWarn(`Error processing file ${safeFilename(file.name)}`, error);
            updateFileStatus(
              file.id,
              'error',
              error instanceof Error ? error.message : 'Processing failed'
            );
          }
        }

        return processedFiles;
      } finally {
        setIsProcessing(false);
        setProgress(null);
      }
    },
    [detections, updateFileStatus, triggerJam, calculateEntropy, compareEntropy]
  );

  /**
   * Wipe memory buffers
   *
   * SECURITY NOTE: This zeros out tracked buffers as a best-effort cleanup.
   * JavaScript does not provide true secure memory wiping - data may persist
   * in browser memory until garbage collected.
   */
  const wipeMemory = useCallback(async () => {
    const buffers = buffersRef.current;
    const totalSize = memoryStats.allocated;

    // Also clear original bytes ref (stores raw file data for entropy calculation)
    if (originalBytesRef.current) {
      originalBytesRef.current.fill(0);
      originalBytesRef.current = null;
    }

    if (buffers.length === 0) return;

    let wiped = 0;

    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      const view = new Uint8Array(buffer);

      // Zero out the buffer
      view.fill(0);

      wiped += buffer.byteLength;

      setMemoryStats((s) => ({
        ...s,
        wiped,
        buffersCleared: i + 1,
      }));

      // Small delay for visual effect
      await new Promise((r) => setTimeout(r, 50));
    }

    // Clear refs
    buffersRef.current = [];

    // Final update
    setMemoryStats({
      allocated: totalSize,
      wiped: totalSize,
      buffersCleared: buffers.length,
      totalBuffers: buffers.length,
    });
  }, [memoryStats.allocated]);

  return {
    isProcessing,
    progress,
    detections,
    memoryStats,
    entropyComparison,
    isCalculatingEntropy,
    contentSections,
    scanFiles,
    processFiles,
    wipeMemory,
  };
}

/**
 * Get replacement text based on config
 */
function getReplacementText(
  detection: Detection,
  config: ScrubConfig
): string {
  switch (config.redactionStyle) {
    case 'blackout':
      return '█'.repeat(Math.min(detection.value.length, 20));

    case 'replacement':
      return config.replacementText || '[REDACTED]';

    case 'pseudonym':
      return generatePseudonym(detection.category);

    case 'partial':
      return getPartialMask(detection.category, detection.value);

    default:
      return '[REDACTED]';
  }
}

/**
 * Generate fake data for pseudonym mode
 */
function generatePseudonym(category: Detection['category']): string {
  const pseudonyms: Record<string, string[]> = {
    person_name: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams'],
    email: ['user@example.com', 'contact@company.org', 'info@domain.net'],
    phone: ['(555) 000-0000', '555-123-4567', '+1-555-EXAMPLE'],
    address: ['123 Example St, Anytown, USA 12345'],
    ssn: ['XXX-XX-XXXX'],
    credit_card: ['XXXX-XXXX-XXXX-XXXX'],
    ip_address: ['0.0.0.0', '127.0.0.1'],
    date_of_birth: ['01/01/1900'],
    custom: ['[CUSTOM DATA]'],
  };

  const options = pseudonyms[category] || ['[REDACTED]'];
  return options[Math.floor(Math.random() * options.length)];
}
