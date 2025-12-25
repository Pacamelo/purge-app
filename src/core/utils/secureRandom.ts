/**
 * Secure Random Utilities
 *
 * Uses crypto.getRandomValues() for cryptographically secure random values.
 * This replaces Math.random() which is predictable and not suitable for
 * security-sensitive ID generation.
 */

/**
 * Generate a cryptographically secure random ID
 * Returns a 24-character hex string (96 bits of entropy)
 */
export function generateSecureId(): string {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random ID with a prefix
 * @param prefix - String prefix for the ID (e.g., 'det', 'req', 'file')
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}-${generateSecureId()}`;
}
