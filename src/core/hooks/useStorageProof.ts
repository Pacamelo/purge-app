/**
 * useStorageProof Hook
 * Monitors browser storage to show visibility into storage changes.
 *
 * SECURITY NOTE: This provides a snapshot comparison of storage counts.
 * It cannot detect all forms of data persistence (e.g., Service Worker
 * cache, browser history, etc.). This is a best-effort indicator.
 */

import { useState, useCallback, useRef } from 'react';
import type { StorageSnapshot } from '@/core/types';
import { generateSecureId } from '@/core/utils/secureRandom';

interface UseStorageProofResult {
  beforeSnapshot: StorageSnapshot | null;
  afterSnapshot: StorageSnapshot | null;
  isDifferent: boolean;
  watermarkStatus: 'not_planted' | 'planted' | 'verified' | 'failed';
  takeBeforeSnapshot: () => void;
  takeAfterSnapshot: () => void;
  plantWatermark: () => void;
  verifyWatermark: () => boolean;
}

const WATERMARK_KEY = 'purge_watermark_test';

/**
 * Count localStorage entries
 */
function countLocalStorage(): number {
  try {
    return localStorage.length;
  } catch {
    return 0;
  }
}

/**
 * Count sessionStorage entries
 */
function countSessionStorage(): number {
  try {
    return sessionStorage.length;
  } catch {
    return 0;
  }
}

/**
 * Count IndexedDB databases (approximate)
 */
async function countIndexedDB(): Promise<number> {
  try {
    if ('indexedDB' in window && 'databases' in indexedDB) {
      const databases = await (indexedDB as IDBFactory & { databases(): Promise<IDBDatabaseInfo[]> }).databases();
      return databases.length;
    }
  } catch {
    // databases() not supported in all browsers
  }
  return 0;
}

/**
 * Count cookies for current domain
 */
function countCookies(): number {
  try {
    const cookies = document.cookie;
    if (!cookies) return 0;
    return cookies.split(';').filter((c) => c.trim()).length;
  } catch {
    return 0;
  }
}

/**
 * Count Cache API caches (Service Worker cache storage)
 * Note: This counts the number of named caches, not individual cached resources
 */
async function countCacheAPI(): Promise<number> {
  if (!('caches' in window)) return 0;
  try {
    const cacheNames = await caches.keys();
    return cacheNames.length;
  } catch {
    return 0;
  }
}

/**
 * Take a snapshot of all browser storage
 */
async function takeSnapshot(): Promise<StorageSnapshot> {
  const [indexedDBCount, cacheAPICount] = await Promise.all([
    countIndexedDB(),
    countCacheAPI(),
  ]);

  return {
    localStorage: countLocalStorage(),
    sessionStorage: countSessionStorage(),
    indexedDB: indexedDBCount,
    cookies: countCookies(),
    cacheAPI: cacheAPICount,
    watermarkPlanted: false,
    watermarkVerified: false,
  };
}

/**
 * Hook to monitor browser storage and prove no data is saved
 */
export function useStorageProof(): UseStorageProofResult {
  const [beforeSnapshot, setBeforeSnapshot] = useState<StorageSnapshot | null>(null);
  const [afterSnapshot, setAfterSnapshot] = useState<StorageSnapshot | null>(null);
  const [watermarkStatus, setWatermarkStatus] = useState<
    'not_planted' | 'planted' | 'verified' | 'failed'
  >('not_planted');

  const watermarkValueRef = useRef<string>('');

  /**
   * Take a "before" snapshot
   */
  const takeBeforeSnapshot = useCallback(async () => {
    const snapshot = await takeSnapshot();
    setBeforeSnapshot(snapshot);
    setAfterSnapshot(null);
    setWatermarkStatus('not_planted');
  }, []);

  /**
   * Take an "after" snapshot
   */
  const takeAfterSnapshot = useCallback(async () => {
    const snapshot = await takeSnapshot();
    setAfterSnapshot(snapshot);
  }, []);

  /**
   * Plant a test watermark in sessionStorage
   */
  const plantWatermark = useCallback(() => {
    const value = `purge_test_${generateSecureId()}`;
    watermarkValueRef.current = value;

    try {
      sessionStorage.setItem(WATERMARK_KEY, value);
      setWatermarkStatus('planted');

      // Update before snapshot to include watermark
      setBeforeSnapshot((prev) =>
        prev
          ? {
              ...prev,
              sessionStorage: prev.sessionStorage + 1,
              watermarkPlanted: true,
            }
          : null
      );
    } catch {
      setWatermarkStatus('failed');
    }
  }, []);

  /**
   * Verify and remove the watermark
   */
  const verifyWatermark = useCallback(() => {
    try {
      const storedValue = sessionStorage.getItem(WATERMARK_KEY);

      if (storedValue === watermarkValueRef.current) {
        // Watermark found - remove it
        sessionStorage.removeItem(WATERMARK_KEY);
        setWatermarkStatus('verified');

        // Update after snapshot
        setAfterSnapshot((prev) =>
          prev
            ? {
                ...prev,
                watermarkVerified: true,
              }
            : null
        );

        return true;
      } else {
        setWatermarkStatus('failed');
        return false;
      }
    } catch {
      setWatermarkStatus('failed');
      return false;
    }
  }, []);

  // Check if storage changed (excluding our watermark)
  const isDifferent = (() => {
    if (!beforeSnapshot || !afterSnapshot) return false;

    // Compare counts, accounting for watermark
    const expectedLocalStorage = beforeSnapshot.localStorage;
    const expectedSessionStorage = beforeSnapshot.watermarkPlanted
      ? beforeSnapshot.sessionStorage - 1 // Watermark was removed
      : beforeSnapshot.sessionStorage;
    const expectedIndexedDB = beforeSnapshot.indexedDB;
    const expectedCookies = beforeSnapshot.cookies;
    const expectedCacheAPI = beforeSnapshot.cacheAPI;

    return (
      afterSnapshot.localStorage !== expectedLocalStorage ||
      afterSnapshot.sessionStorage !== expectedSessionStorage ||
      afterSnapshot.indexedDB !== expectedIndexedDB ||
      afterSnapshot.cookies !== expectedCookies ||
      afterSnapshot.cacheAPI !== expectedCacheAPI
    );
  })();

  return {
    beforeSnapshot,
    afterSnapshot,
    isDifferent,
    watermarkStatus,
    takeBeforeSnapshot,
    takeAfterSnapshot,
    plantWatermark,
    verifyWatermark,
  };
}
