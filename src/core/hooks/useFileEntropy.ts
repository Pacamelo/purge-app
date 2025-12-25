/**
 * useFileEntropy Hook
 *
 * Calculates Shannon entropy for file data to visualize data randomness.
 * High entropy (near 8 bits) indicates random/encrypted/compressed data.
 * Low entropy (near 0 bits) indicates repetitive/uniform data.
 *
 * PII like names, SSNs, emails typically has moderate-high entropy.
 * Redacted text like "[REDACTED]" has low entropy due to repetition.
 *
 * References:
 * - Shannon entropy: https://en.wikipedia.org/wiki/Entropy_(information_theory)
 * - binvis.io: https://binvis.io/
 */

import { useCallback, useMemo, useState } from 'react';
import type { EntropyData, EntropyBlock, Detection, EntropyComparison } from '@/core/types';

/** Default block size for entropy calculation (256 bytes) */
const DEFAULT_BLOCK_SIZE = 256;

/** Maximum entropy for a byte (log2(256) = 8 bits) */
const MAX_ENTROPY = 8;

interface UseFileEntropyOptions {
  /** Size of each block in bytes (default: 256) */
  blockSize?: number;
}

interface UseFileEntropyResult {
  /** Calculate entropy for raw bytes */
  calculateEntropy: (
    bytes: Uint8Array,
    detections?: Detection[]
  ) => EntropyData;

  /** Calculate entropy for a File object */
  calculateFileEntropy: (
    file: File,
    detections?: Detection[]
  ) => Promise<EntropyData>;

  /** Calculate entropy for text content */
  calculateTextEntropy: (
    text: string,
    detections?: Detection[]
  ) => EntropyData;

  /** Compare before and after entropy */
  compareEntropy: (
    before: EntropyData | null,
    after: EntropyData | null
  ) => EntropyComparison;

  /** Loading state for async operations */
  isCalculating: boolean;

  /** Any error during calculation */
  error: Error | null;
}

/**
 * Calculate Shannon entropy for a byte array.
 * H = -Σ p_i * log2(p_i) where p_i is probability of byte value i
 *
 * @param bytes - Array of bytes to analyze
 * @returns Entropy in bits (0-8)
 */
function calculateBlockEntropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;

  // Build frequency map
  const freq = new Map<number, number>();
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    freq.set(byte, (freq.get(byte) || 0) + 1);
  }

  // Calculate entropy: H = -Σ p_i * log2(p_i)
  let entropy = 0;
  const len = bytes.length;

  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Normalize entropy value to 0-1 range.
 * @param entropy - Raw entropy (0-8)
 * @returns Normalized entropy (0-1)
 */
function normalizeEntropy(entropy: number): number {
  return Math.min(1, Math.max(0, entropy / MAX_ENTROPY));
}

/**
 * Check if a block overlaps with any PII detection.
 * @param blockOffset - Starting byte offset of the block
 * @param blockSize - Size of the block in bytes
 * @param detections - Array of PII detections
 * @returns true if block contains PII
 */
function blockContainsPII(
  blockOffset: number,
  blockSize: number,
  detections: Detection[]
): boolean {
  const blockEnd = blockOffset + blockSize;

  for (const detection of detections) {
    // Check for overlap
    if (detection.startOffset < blockEnd && detection.endOffset > blockOffset) {
      return true;
    }
  }

  return false;
}

/**
 * Hook for calculating file entropy.
 */
export function useFileEntropy(
  options: UseFileEntropyOptions = {}
): UseFileEntropyResult {
  const { blockSize = DEFAULT_BLOCK_SIZE } = options;

  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Calculate entropy for raw bytes.
   */
  const calculateEntropy = useCallback(
    (bytes: Uint8Array, detections: Detection[] = []): EntropyData => {
      if (bytes.length === 0) {
        return {
          blocks: [],
          globalEntropy: 0,
          maxEntropy: 0,
          minEntropy: 0,
          totalBytes: 0,
          blockSize,
        };
      }

      const blocks: EntropyBlock[] = [];
      let minEntropy = MAX_ENTROPY;
      let maxEntropy = 0;

      // Process each block
      const numBlocks = Math.ceil(bytes.length / blockSize);

      for (let i = 0; i < numBlocks; i++) {
        const offset = i * blockSize;
        const end = Math.min(offset + blockSize, bytes.length);
        const blockBytes = bytes.slice(offset, end);

        const entropy = calculateBlockEntropy(blockBytes);
        const normalizedEntropy = normalizeEntropy(entropy);

        minEntropy = Math.min(minEntropy, entropy);
        maxEntropy = Math.max(maxEntropy, entropy);

        blocks.push({
          index: i,
          entropy,
          normalizedEntropy,
          offset,
          size: end - offset,
          containsPII: blockContainsPII(offset, end - offset, detections),
        });
      }

      // Calculate global entropy for entire file
      const globalEntropy = calculateBlockEntropy(bytes);

      return {
        blocks,
        globalEntropy,
        maxEntropy,
        minEntropy: blocks.length > 0 ? minEntropy : 0,
        totalBytes: bytes.length,
        blockSize,
      };
    },
    [blockSize]
  );

  /**
   * Calculate entropy for a File object.
   */
  const calculateFileEntropy = useCallback(
    async (file: File, detections: Detection[] = []): Promise<EntropyData> => {
      setIsCalculating(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        return calculateEntropy(bytes, detections);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to read file');
        setError(error);
        throw error;
      } finally {
        setIsCalculating(false);
      }
    },
    [calculateEntropy]
  );

  /**
   * Calculate entropy for text content.
   */
  const calculateTextEntropy = useCallback(
    (text: string, detections: Detection[] = []): EntropyData => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(text);
      return calculateEntropy(bytes, detections);
    },
    [calculateEntropy]
  );

  /**
   * Compare before and after entropy to find changed regions.
   */
  const compareEntropy = useCallback(
    (before: EntropyData | null, after: EntropyData | null): EntropyComparison => {
      const changedRegions: EntropyComparison['changedRegions'] = [];

      if (before && after) {
        // Find regions where entropy dropped significantly (PII was redacted)
        const minBlocks = Math.min(before.blocks.length, after.blocks.length);
        let regionStart: number | null = null;
        let regionDrop = 0;

        for (let i = 0; i < minBlocks; i++) {
          const entropyDrop = before.blocks[i].entropy - after.blocks[i].entropy;

          // Consider >1 bit drop as significant
          if (entropyDrop > 1) {
            if (regionStart === null) {
              regionStart = i;
              regionDrop = entropyDrop;
            } else {
              regionDrop = Math.max(regionDrop, entropyDrop);
            }
          } else if (regionStart !== null) {
            // End of region
            changedRegions.push({
              startBlock: regionStart,
              endBlock: i - 1,
              entropyDrop: regionDrop,
            });
            regionStart = null;
            regionDrop = 0;
          }
        }

        // Handle region at end
        if (regionStart !== null) {
          changedRegions.push({
            startBlock: regionStart,
            endBlock: minBlocks - 1,
            entropyDrop: regionDrop,
          });
        }
      }

      return {
        before,
        after,
        changedRegions,
      };
    },
    []
  );

  return useMemo(
    () => ({
      calculateEntropy,
      calculateFileEntropy,
      calculateTextEntropy,
      compareEntropy,
      isCalculating,
      error,
    }),
    [
      calculateEntropy,
      calculateFileEntropy,
      calculateTextEntropy,
      compareEntropy,
      isCalculating,
      error,
    ]
  );
}

// Export utility functions for direct use
export { calculateBlockEntropy, normalizeEntropy, MAX_ENTROPY, DEFAULT_BLOCK_SIZE };
