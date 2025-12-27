'use client';

import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Helper to check if an error is a JWT expired error
 */
export const isJWTExpiredError = (error: any): boolean => {
  if (!error) return false;
  const message = error?.message || error?.error_description || String(error);
  return message.toLowerCase().includes('jwt') && 
         (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid'));
};

/**
 * Hook that provides utilities for handling Supabase operations with automatic JWT refresh
 */
export function useSupabaseWithRetry() {
  const { supabase, refreshSession } = useAuth();

  /**
   * Wraps a Supabase operation with automatic JWT refresh on expiration
   * @param operation - The async operation to execute
   * @param maxRetries - Maximum number of retries (default: 2)
   * @returns The result of the operation
   */
  const withRetry = useCallback(async <T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    maxRetries = 2
  ): Promise<{ data: T | null; error: any }> => {
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Check if the error is JWT related
        if (result.error && isJWTExpiredError(result.error)) {
          if (attempt < maxRetries) {
            console.log(`JWT expired (attempt ${attempt + 1}), refreshing session...`);
            const refreshed = await refreshSession();
            if (refreshed) {
              continue; // Retry the operation
            }
          }
          lastError = result.error;
          continue;
        }
        
        return result;
      } catch (err: any) {
        if (isJWTExpiredError(err) && attempt < maxRetries) {
          console.log(`JWT expired exception (attempt ${attempt + 1}), refreshing session...`);
          const refreshed = await refreshSession();
          if (refreshed) {
            continue; // Retry the operation
          }
        }
        lastError = err;
      }
    }
    
    return { data: null, error: lastError };
  }, [refreshSession]);

  /**
   * Ensures the session is fresh before executing an operation
   */
  const ensureFreshSession = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.expires_at) {
        const timeUntilExpiry = (session.expires_at * 1000) - Date.now();
        
        // If expiring within 5 minutes, refresh proactively
        if (timeUntilExpiry < 5 * 60 * 1000) {
          const refreshed = await refreshSession();
          return refreshed;
        }
        return true;
      }
      
      // No session or no expiry info - try to refresh
      return await refreshSession();
    } catch {
      return false;
    }
  }, [supabase, refreshSession]);

  return {
    withRetry,
    ensureFreshSession,
    isJWTExpiredError,
  };
}

/**
 * Higher-order function to wrap any async function with JWT retry logic
 */
export function createRetryWrapper(
  supabase: any,
  refreshSession: () => Promise<boolean>
) {
  return async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 2
  ): Promise<T> {
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        if (isJWTExpiredError(err) && attempt < maxRetries) {
          console.log(`JWT expired (attempt ${attempt + 1}), refreshing session...`);
          const refreshed = await refreshSession();
          if (refreshed) {
            continue;
          }
        }
        lastError = err;
      }
    }
    
    throw lastError;
  };
}
