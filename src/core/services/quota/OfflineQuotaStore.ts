/**
 * OfflineQuotaStore
 *
 * Tamper-resistant storage for offline usage quota.
 * Uses HMAC signatures and IndexedDB backup for integrity.
 *
 * Security measures:
 * 1. HMAC-SHA256 signature on all stored data
 * 2. IndexedDB backup for cross-validation
 * 3. Device fingerprint binding
 * 4. Tampering detection with quota reset
 */

import {
  generateDeviceFingerprint,
  verifyDeviceFingerprint,
} from './DeviceFingerprint';
import { secureWarn } from '@/core/utils/secureLogger';

// ============================================================================
// Types
// ============================================================================

export interface QuotaState {
  /** Remaining processing tokens (0-50) */
  tokensRemaining: number;
  /** ISO timestamp of last refresh */
  lastRefresh: string;
  /** Device fingerprint this quota is bound to */
  deviceFingerprint: string;
  /** Schema version for migrations */
  version: number;
}

interface SignedQuotaState {
  data: QuotaState;
  signature: string;
}

// ============================================================================
// Constants
// ============================================================================

const LS_KEY = 'purge_offline_quota';
const IDB_NAME = 'purge_quota_db';
const IDB_STORE = 'quota';
const IDB_KEY = 'current';
const SCHEMA_VERSION = 1;
const DEFAULT_TOKENS = 50;
const HMAC_SALT = 'purge_quota_v1_'; // Not secret, just domain separation

// ============================================================================
// HMAC Utilities
// ============================================================================

/**
 * Derives an HMAC key from the device fingerprint.
 * The fingerprint acts as a device-bound secret.
 */
async function deriveKey(fingerprint: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(HMAC_SALT + fingerprint);

  // Import as raw key material
  const rawKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  return rawKey;
}

/**
 * Signs quota state with HMAC-SHA256
 */
async function signState(state: QuotaState, fingerprint: string): Promise<string> {
  const key = await deriveKey(fingerprint);
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(state));

  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies HMAC signature
 */
async function verifySignature(
  signed: SignedQuotaState,
  fingerprint: string
): Promise<boolean> {
  try {
    const expectedSignature = await signState(signed.data, fingerprint);
    return expectedSignature === signed.signature;
  } catch {
    return false;
  }
}

// ============================================================================
// IndexedDB Utilities
// ============================================================================

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
  });
}

async function readFromIDB(): Promise<SignedQuotaState | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get(IDB_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);

      tx.oncomplete = () => db.close();
    });
  } catch {
    // IndexedDB may be unavailable (private browsing, etc.)
    return null;
  }
}

async function writeToIDB(signed: SignedQuotaState): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const request = store.put(signed, IDB_KEY);

      request.onerror = () => reject(request.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Silently fail - localStorage is primary
  }
}

async function clearIDB(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const request = store.delete(IDB_KEY);

      request.onerror = () => reject(request.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Silently fail
  }
}

// ============================================================================
// OfflineQuotaStore Class
// ============================================================================

export class OfflineQuotaStore {
  private cachedState: QuotaState | null = null;
  private fingerprint: string | null = null;

  /**
   * Initializes the store, loading existing state or creating new
   */
  async initialize(): Promise<QuotaState> {
    // Get device fingerprint first
    this.fingerprint = await generateDeviceFingerprint();

    // Try to load existing state
    const state = await this.load();

    if (state) {
      this.cachedState = state;
      return state;
    }

    // Create new state for first-time users
    const newState = await this.createInitialState();
    this.cachedState = newState;
    return newState;
  }

  /**
   * Gets current tokens remaining (cached for performance)
   */
  getTokens(): number {
    return this.cachedState?.tokensRemaining ?? 0;
  }

  /**
   * Checks if processing is allowed
   */
  canProcess(): boolean {
    return (this.cachedState?.tokensRemaining ?? 0) > 0;
  }

  /**
   * Decrements quota by 1 token. Returns new remaining count.
   * Throws if quota is exhausted.
   */
  async decrement(): Promise<number> {
    if (!this.cachedState || !this.fingerprint) {
      throw new Error('QuotaStore not initialized');
    }

    if (this.cachedState.tokensRemaining <= 0) {
      throw new QuotaExhaustedError('No tokens remaining');
    }

    const newState: QuotaState = {
      ...this.cachedState,
      tokensRemaining: this.cachedState.tokensRemaining - 1,
    };

    await this.save(newState);
    this.cachedState = newState;

    return newState.tokensRemaining;
  }

  /**
   * Resets quota to specified token count (used by refresh API)
   */
  async reset(tokens: number): Promise<void> {
    if (!this.fingerprint) {
      this.fingerprint = await generateDeviceFingerprint();
    }

    const newState: QuotaState = {
      tokensRemaining: Math.min(tokens, DEFAULT_TOKENS),
      lastRefresh: new Date().toISOString(),
      deviceFingerprint: this.fingerprint,
      version: SCHEMA_VERSION,
    };

    await this.save(newState);
    this.cachedState = newState;
  }

  /**
   * Loads and validates quota state from storage
   */
  private async load(): Promise<QuotaState | null> {
    if (!this.fingerprint) {
      this.fingerprint = await generateDeviceFingerprint();
    }

    // Load from localStorage (primary)
    const lsData = this.loadFromLocalStorage();

    // Load from IndexedDB (backup)
    const idbData = await readFromIDB();

    // Case 1: Neither exists - first time user
    if (!lsData && !idbData) {
      return null;
    }

    // Case 2: Only localStorage exists
    if (lsData && !idbData) {
      const valid = await this.validateState(lsData);
      if (valid) {
        // Sync to IDB
        await writeToIDB(lsData);
        return lsData.data;
      }
      // Tampered - reset
      await this.handleTampering('localStorage signature invalid');
      return null;
    }

    // Case 3: Only IndexedDB exists (localStorage cleared)
    if (!lsData && idbData) {
      const valid = await this.validateState(idbData);
      if (valid) {
        // Restore to localStorage
        this.saveToLocalStorage(idbData);
        return idbData.data;
      }
      // Tampered - reset
      await this.handleTampering('IndexedDB signature invalid');
      return null;
    }

    // Case 4: Both exist - cross-validate
    if (lsData && idbData) {
      const lsValid = await this.validateState(lsData);
      const idbValid = await this.validateState(idbData);

      if (!lsValid && !idbValid) {
        // Both tampered
        await this.handleTampering('Both storage locations tampered');
        return null;
      }

      if (lsValid && !idbValid) {
        // Trust localStorage, restore IDB
        await writeToIDB(lsData);
        return lsData.data;
      }

      if (!lsValid && idbValid) {
        // Trust IndexedDB, restore localStorage
        this.saveToLocalStorage(idbData);
        return idbData.data;
      }

      // Both valid - check consistency
      if (lsData.data.tokensRemaining !== idbData.data.tokensRemaining) {
        // Mismatch - someone edited one but not the other
        // Use the lower value (pessimistic, prevents abuse)
        const trustedState =
          lsData.data.tokensRemaining < idbData.data.tokensRemaining
            ? lsData
            : idbData;

        // Sync both to trusted value
        this.saveToLocalStorage(trustedState);
        await writeToIDB(trustedState);

        return trustedState.data;
      }

      return lsData.data;
    }

    return null;
  }

  /**
   * Saves quota state to both storage locations
   */
  private async save(state: QuotaState): Promise<void> {
    if (!this.fingerprint) {
      throw new Error('Fingerprint not initialized');
    }

    const signature = await signState(state, this.fingerprint);
    const signed: SignedQuotaState = { data: state, signature };

    // Write to both locations
    this.saveToLocalStorage(signed);
    await writeToIDB(signed);
  }

  /**
   * Creates initial state for new users
   */
  private async createInitialState(): Promise<QuotaState> {
    if (!this.fingerprint) {
      this.fingerprint = await generateDeviceFingerprint();
    }

    const state: QuotaState = {
      tokensRemaining: DEFAULT_TOKENS,
      lastRefresh: new Date().toISOString(),
      deviceFingerprint: this.fingerprint,
      version: SCHEMA_VERSION,
    };

    await this.save(state);
    return state;
  }

  /**
   * Validates a signed state
   */
  private async validateState(signed: SignedQuotaState): Promise<boolean> {
    if (!this.fingerprint) return false;

    // Verify HMAC signature
    const signatureValid = await verifySignature(signed, this.fingerprint);
    if (!signatureValid) return false;

    // Verify device fingerprint matches
    const fpResult = await verifyDeviceFingerprint(signed.data.deviceFingerprint);
    if (!fpResult.matches) return false;

    // Verify schema version
    if (signed.data.version !== SCHEMA_VERSION) {
      // Future: handle migrations
      return false;
    }

    // Verify token bounds
    if (signed.data.tokensRemaining < 0 || signed.data.tokensRemaining > DEFAULT_TOKENS) {
      return false;
    }

    return true;
  }

  /**
   * Handles detected tampering by resetting quota to 0
   */
  private async handleTampering(reason: string): Promise<void> {
    secureWarn(`Quota tampering detected: ${reason}`);

    // Create a zeroed state
    const zeroState: QuotaState = {
      tokensRemaining: 0,
      lastRefresh: new Date().toISOString(),
      deviceFingerprint: this.fingerprint || (await generateDeviceFingerprint()),
      version: SCHEMA_VERSION,
    };

    await this.save(zeroState);
    this.cachedState = zeroState;
  }

  /**
   * LocalStorage helpers
   */
  private loadFromLocalStorage(): SignedQuotaState | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private saveToLocalStorage(signed: SignedQuotaState): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(signed));
    } catch {
      // Storage quota exceeded or unavailable
    }
  }

  /**
   * Clears all quota data (for testing/debugging)
   */
  async clear(): Promise<void> {
    localStorage.removeItem(LS_KEY);
    await clearIDB();
    this.cachedState = null;
  }
}

// ============================================================================
// Errors
// ============================================================================

export class QuotaExhaustedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExhaustedError';
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const offlineQuotaStore = new OfflineQuotaStore();
