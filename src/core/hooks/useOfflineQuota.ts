/**
 * useOfflineQuota Hook
 *
 * React hook for offline quota enforcement.
 * Provides quota state and actions for the document processor.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  offlineQuotaStore,
  QuotaExhaustedError,
} from '@/core/services/quota/OfflineQuotaStore';
import { requestQuotaRefresh, type RefreshResult } from '@/core/services/quota/QuotaRefreshAPI';

// ============================================================================
// Types
// ============================================================================

export interface UseOfflineQuotaReturn {
  /** Number of tokens remaining */
  tokensRemaining: number;
  /** Whether quota is exhausted (0 tokens) */
  isExhausted: boolean;
  /** Whether quota store is ready */
  isInitialized: boolean;
  /** Check if a file can be processed */
  canProcessFile: () => boolean;
  /** Consume one token (call after successful processing) */
  consumeToken: () => Promise<void>;
  /** Request quota refresh from server (stubbed) */
  requestRefresh: () => Promise<RefreshResult>;
  /** Error message if any */
  quotaError: string | null;
  /** Last refresh timestamp */
  lastRefresh: string | null;
}

// ============================================================================
// Hook
// ============================================================================

export function useOfflineQuota(): UseOfflineQuotaReturn {
  const [tokensRemaining, setTokensRemaining] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  // Initialize quota store on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const state = await offlineQuotaStore.initialize();
        if (mounted) {
          setTokensRemaining(state.tokensRemaining);
          setLastRefresh(state.lastRefresh);
          setIsInitialized(true);
          setQuotaError(null);
        }
      } catch (error) {
        if (mounted) {
          setQuotaError(
            error instanceof Error ? error.message : 'Failed to initialize quota'
          );
          setIsInitialized(true); // Still mark as initialized, but with 0 tokens
          setTokensRemaining(0);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Checks if a file can be processed (has tokens remaining)
   */
  const canProcessFile = useCallback((): boolean => {
    if (!isInitialized) return false;
    return offlineQuotaStore.canProcess();
  }, [isInitialized]);

  /**
   * Consumes one token after successful file processing
   */
  const consumeToken = useCallback(async (): Promise<void> => {
    try {
      const remaining = await offlineQuotaStore.decrement();
      setTokensRemaining(remaining);
      setQuotaError(null);
    } catch (error) {
      if (error instanceof QuotaExhaustedError) {
        setTokensRemaining(0);
        setQuotaError('Offline quota exhausted. Go online to continue.');
      } else {
        setQuotaError(
          error instanceof Error ? error.message : 'Failed to update quota'
        );
      }
      throw error;
    }
  }, []);

  /**
   * Requests quota refresh from server (stubbed for now)
   */
  const requestRefresh = useCallback(async (): Promise<RefreshResult> => {
    try {
      const result = await requestQuotaRefresh();

      if (result.success) {
        // Update local state with new tokens
        await offlineQuotaStore.reset(result.tokens);
        setTokensRemaining(result.tokens);
        setLastRefresh(new Date().toISOString());
        setQuotaError(null);
      }

      return result;
    } catch (error) {
      const errorResult: RefreshResult = {
        success: false,
        reason: 'api_error',
      };
      setQuotaError(
        error instanceof Error ? error.message : 'Failed to refresh quota'
      );
      return errorResult;
    }
  }, []);

  return {
    tokensRemaining,
    isExhausted: tokensRemaining <= 0,
    isInitialized,
    canProcessFile,
    consumeToken,
    requestRefresh,
    quotaError,
    lastRefresh,
  };
}

// Re-export error type for consumers
export { QuotaExhaustedError } from '@/core/services/quota/OfflineQuotaStore';
