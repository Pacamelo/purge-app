/**
 * useFileHash Hook
 *
 * Calculates SHA-256 hash of files using Web Crypto API.
 *
 * IMPORTANT: This proves FILE INTEGRITY (wasn't modified during processing).
 * This does NOT prove the file wasn't copied/uploaded.
 * The UI should be honest about this distinction.
 */

import { useState, useCallback } from 'react';

export interface FileHashState {
  /** SHA-256 hash of original file */
  originalHash: string | null;
  /** SHA-256 hash of processed file */
  processedHash: string | null;
  /** Timestamp when hashes were calculated */
  timestamp: string | null;
  /** Whether hashing is in progress */
  isHashing: boolean;
  /** Error message if hashing failed */
  error: string | null;
}

export interface UseFileHashResult {
  state: FileHashState;
  /** Calculate hash of original file */
  hashOriginalFile: (file: File) => Promise<string>;
  /** Calculate hash of processed blob */
  hashProcessedBlob: (blob: Blob) => Promise<string>;
  /** Reset state */
  reset: () => void;
  /** Get hash comparison result */
  getComparisonResult: () => HashComparisonResult;
}

export interface HashComparisonResult {
  /** Whether both hashes exist */
  hasBothHashes: boolean;
  /** Whether hashes match (file unchanged) */
  hashesMatch: boolean;
  /** Human-readable message */
  message: string;
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate SHA-256 hash of an ArrayBuffer
 */
async function calculateSHA256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToHex(hashBuffer);
}

/**
 * Truncate hash for display (first 8 + last 8 chars)
 */
export function truncateHash(hash: string): string {
  if (hash.length <= 20) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export function useFileHash(): UseFileHashResult {
  const [state, setState] = useState<FileHashState>({
    originalHash: null,
    processedHash: null,
    timestamp: null,
    isHashing: false,
    error: null,
  });

  /**
   * Hash the original file
   */
  const hashOriginalFile = useCallback(async (file: File): Promise<string> => {
    setState((prev) => ({ ...prev, isHashing: true, error: null }));

    try {
      const buffer = await file.arrayBuffer();
      const hash = await calculateSHA256(buffer);

      setState((prev) => ({
        ...prev,
        originalHash: hash,
        timestamp: new Date().toISOString(),
        isHashing: false,
      }));

      return hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to hash file';
      setState((prev) => ({
        ...prev,
        isHashing: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Hash the processed blob
   */
  const hashProcessedBlob = useCallback(async (blob: Blob): Promise<string> => {
    setState((prev) => ({ ...prev, isHashing: true, error: null }));

    try {
      const buffer = await blob.arrayBuffer();
      const hash = await calculateSHA256(buffer);

      setState((prev) => ({
        ...prev,
        processedHash: hash,
        timestamp: new Date().toISOString(),
        isHashing: false,
      }));

      return hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to hash blob';
      setState((prev) => ({
        ...prev,
        isHashing: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      originalHash: null,
      processedHash: null,
      timestamp: null,
      isHashing: false,
      error: null,
    });
  }, []);

  /**
   * Get comparison result
   */
  const getComparisonResult = useCallback((): HashComparisonResult => {
    const { originalHash, processedHash } = state;

    if (!originalHash && !processedHash) {
      return {
        hasBothHashes: false,
        hashesMatch: false,
        message: 'No files have been hashed yet',
      };
    }

    if (!originalHash) {
      return {
        hasBothHashes: false,
        hashesMatch: false,
        message: 'Original file hash not calculated',
      };
    }

    if (!processedHash) {
      return {
        hasBothHashes: false,
        hashesMatch: false,
        message: 'Processed file hash not calculated',
      };
    }

    const hashesMatch = originalHash === processedHash;

    return {
      hasBothHashes: true,
      hashesMatch,
      message: hashesMatch
        ? 'File was not modified during processing'
        : 'File was modified during processing (redactions applied)',
    };
  }, [state]);

  return {
    state,
    hashOriginalFile,
    hashProcessedBlob,
    reset,
    getComparisonResult,
  };
}
