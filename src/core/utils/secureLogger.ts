/**
 * Secure Logging Utilities
 *
 * Provides logging functions that sanitize error messages to prevent
 * accidental PII leakage through console output.
 *
 * SECURITY: Error objects may contain file content, user data, or PII.
 * These utilities strip sensitive details before logging.
 */

/**
 * Safe error info for logging - strips potentially sensitive details
 */
interface SafeErrorInfo {
  type: string;
  message: string;
  // Deliberately excludes stack traces which may contain file paths/content
}

/**
 * Extract safe, loggable information from an error
 * Strips stack traces and any embedded data that might contain PII
 */
function sanitizeError(error: unknown): SafeErrorInfo {
  if (error instanceof Error) {
    // Only include error type and a sanitized message
    // Remove any content after newlines (often contains data)
    const message = error.message.split('\n')[0].slice(0, 100);
    return {
      type: error.constructor.name,
      message,
    };
  }

  if (typeof error === 'string') {
    return {
      type: 'String',
      message: error.slice(0, 100),
    };
  }

  return {
    type: 'Unknown',
    message: 'An error occurred',
  };
}

/**
 * Log a warning without exposing potentially sensitive error details
 * @param context - Description of what was happening (e.g., "Failed to hash file")
 * @param error - The error object (will be sanitized)
 */
export function secureWarn(context: string, error?: unknown): void {
  if (error !== undefined) {
    const safe = sanitizeError(error);
    console.warn(`PURGE: ${context} [${safe.type}]: ${safe.message}`);
  } else {
    console.warn(`PURGE: ${context}`);
  }
}

/**
 * Log an error without exposing potentially sensitive error details
 * @param context - Description of what was happening
 * @param error - The error object (will be sanitized)
 */
export function secureError(context: string, error?: unknown): void {
  if (error !== undefined) {
    const safe = sanitizeError(error);
    console.error(`PURGE: ${context} [${safe.type}]: ${safe.message}`);
  } else {
    console.error(`PURGE: ${context}`);
  }
}

/**
 * Log debug info - safe to use as it doesn't include error objects
 * @param message - Debug message (should not contain PII)
 */
export function secureLog(message: string): void {
  console.log(`PURGE: ${message}`);
}

/**
 * Safely get filename for logging (strips path, limits length)
 */
export function safeFilename(filename: string): string {
  // Extract just the filename without path
  const name = filename.split('/').pop() || filename;
  // Limit length and remove any potentially sensitive parts
  return name.slice(0, 50);
}
