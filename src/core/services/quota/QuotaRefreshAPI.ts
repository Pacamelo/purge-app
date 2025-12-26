/**
 * QuotaRefreshAPI
 *
 * Stubbed API client for quota refresh.
 * Currently returns offline/unavailable status.
 *
 * Future implementation will:
 * 1. POST to /api/quota/refresh with auth token
 * 2. Server validates user tier and usage
 * 3. Returns new token count or denial
 */

// ============================================================================
// Types
// ============================================================================

export type RefreshResult =
  | { success: true; tokens: number }
  | { success: false; reason: 'offline' | 'api_error' | 'not_authenticated' | 'rate_limited' };

// ============================================================================
// API Functions
// ============================================================================

/**
 * Checks if the browser has network connectivity.
 * Stub: Uses navigator.onLine
 * Future: Actual ping to server endpoint
 */
export async function checkOnlineStatus(): Promise<boolean> {
  // Basic check using navigator.onLine
  if (!navigator.onLine) {
    return false;
  }

  // Future: Actually ping the server to verify connectivity
  // try {
  //   const response = await fetch('/api/health', {
  //     method: 'HEAD',
  //     cache: 'no-store',
  //   });
  //   return response.ok;
  // } catch {
  //   return false;
  // }

  return true;
}

/**
 * Requests a quota refresh from the server.
 *
 * STUB IMPLEMENTATION:
 * - Returns { success: false, reason: 'offline' } when offline
 * - Returns { success: false, reason: 'not_authenticated' } when online
 *   (since auth isn't implemented yet)
 *
 * FUTURE IMPLEMENTATION:
 * - POST to /api/quota/refresh with JWT auth
 * - Server validates user, tier, and usage limits
 * - Returns new token allocation
 */
export async function requestQuotaRefresh(): Promise<RefreshResult> {
  // Check connectivity first
  const isOnline = await checkOnlineStatus();

  if (!isOnline) {
    return {
      success: false,
      reason: 'offline',
    };
  }

  // STUB: Auth not implemented yet
  // In production, this would:
  // 1. Get auth token from auth store
  // 2. POST to API_ENDPOINT
  // 3. Parse response

  // For now, return not_authenticated to indicate the flow is working
  // but actual server refresh isn't available yet
  return {
    success: false,
    reason: 'not_authenticated',
  };

  // FUTURE IMPLEMENTATION:
  // try {
  //   const authToken = getAuthToken(); // From auth store
  //   if (!authToken) {
  //     return { success: false, reason: 'not_authenticated' };
  //   }
  //
  //   const response = await fetch(API_ENDPOINT, {
  //     method: 'POST',
  //     headers: {
  //       'Authorization': `Bearer ${authToken}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       requestedTokens: DEFAULT_TOKENS,
  //     }),
  //   });
  //
  //   if (response.status === 429) {
  //     return { success: false, reason: 'rate_limited' };
  //   }
  //
  //   if (response.status === 401) {
  //     return { success: false, reason: 'not_authenticated' };
  //   }
  //
  //   if (!response.ok) {
  //     return { success: false, reason: 'api_error' };
  //   }
  //
  //   const data = await response.json();
  //   return {
  //     success: true,
  //     tokens: data.tokens ?? DEFAULT_TOKENS,
  //   };
  // } catch {
  //   return { success: false, reason: 'api_error' };
  // }
}

/**
 * Helper to format refresh result for display
 */
export function formatRefreshResult(result: RefreshResult): string {
  if (result.success) {
    return `Quota refreshed: ${result.tokens} tokens available`;
  }

  switch (result.reason) {
    case 'offline':
      return 'Cannot refresh quota while offline. Please reconnect.';
    case 'not_authenticated':
      return 'Sign in to refresh your quota.';
    case 'rate_limited':
      return 'Too many refresh attempts. Please try again later.';
    case 'api_error':
      return 'Failed to refresh quota. Please try again.';
    default:
      return 'Unknown error refreshing quota.';
  }
}
