/**
 * useFirstTimeUser Hook
 *
 * Detects if this is a first-time user and manages onboarding state.
 * Uses localStorage to persist the "has seen onboarding" flag.
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'purge_onboarding_completed';

export function useFirstTimeUser() {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    try {
      const hasCompleted = localStorage.getItem(STORAGE_KEY);
      setIsFirstTime(hasCompleted !== 'true');
    } catch {
      // localStorage not available, treat as not first time
      setIsFirstTime(false);
    }
    setIsLoading(false);
  }, []);

  // Mark onboarding as completed
  const markOnboardingComplete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // localStorage not available, ignore
    }
    setIsFirstTime(false);
  }, []);

  // Reset onboarding (for testing)
  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage not available, ignore
    }
    setIsFirstTime(true);
  }, []);

  return {
    isFirstTime,
    isLoading,
    markOnboardingComplete,
    resetOnboarding,
  };
}
