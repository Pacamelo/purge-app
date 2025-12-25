/**
 * Partial Mask Utilities
 * Category-specific masking that preserves format while hiding sensitive data
 *
 * Each PII category gets a sensible default partial mask:
 * - SSN: show last 4 digits
 * - Credit Card: show last 4, preserve format
 * - Email: show first char + full domain
 * - Phone: show last 4, preserve format
 * - Address: hide house number only
 * - Person Name: first char of each name part
 * - IP Address: show last octet
 * - Date of Birth: show year only
 */

import type { PIICategory } from '@/core/types';

const MASK_CHAR = '*';

/**
 * SSN: ***-**-1234 (show last 4)
 * Input formats: 123-45-6789, 123456789, 123 45 6789
 */
export function maskSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 9) {
    // Invalid SSN length, mask entirely
    return MASK_CHAR.repeat(value.length);
  }
  const last4 = digits.slice(-4);
  return `${MASK_CHAR}${MASK_CHAR}${MASK_CHAR}-${MASK_CHAR}${MASK_CHAR}-${last4}`;
}

/**
 * Credit Card: ****-****-****-5678 (show last 4, preserve format)
 * Supports 15-16 digit cards (Amex, Visa, MC, Discover)
 */
export function maskCreditCard(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 15 || digits.length > 16) {
    // Invalid card length, mask entirely
    return MASK_CHAR.repeat(value.length);
  }
  const last4 = digits.slice(-4);

  // Detect original format (dashes, spaces, or continuous)
  if (value.includes('-')) {
    // 16-digit: ****-****-****-5678
    // 15-digit (Amex): ****-******-*5678
    if (digits.length === 16) {
      return `${MASK_CHAR.repeat(4)}-${MASK_CHAR.repeat(4)}-${MASK_CHAR.repeat(4)}-${last4}`;
    }
    return `${MASK_CHAR.repeat(4)}-${MASK_CHAR.repeat(6)}-${MASK_CHAR}${last4}`;
  } else if (value.includes(' ')) {
    if (digits.length === 16) {
      return `${MASK_CHAR.repeat(4)} ${MASK_CHAR.repeat(4)} ${MASK_CHAR.repeat(4)} ${last4}`;
    }
    return `${MASK_CHAR.repeat(4)} ${MASK_CHAR.repeat(6)} ${MASK_CHAR}${last4}`;
  }

  // Continuous format
  return MASK_CHAR.repeat(digits.length - 4) + last4;
}

/**
 * Email: j***@domain.com (show first char + full domain)
 */
export function maskEmail(value: string): string {
  const atIndex = value.indexOf('@');
  if (atIndex < 1) {
    // Invalid email, mask entirely
    return MASK_CHAR.repeat(value.length);
  }

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex); // Includes @

  if (localPart.length <= 1) {
    // Very short local part, add mask chars
    return localPart + MASK_CHAR.repeat(3) + domain;
  }

  const firstChar = localPart[0];
  // Show first char, mask rest (max 5 mask chars for aesthetics)
  const maskLength = Math.min(localPart.length - 1, 5);
  return firstChar + MASK_CHAR.repeat(maskLength) + domain;
}

/**
 * Phone: (***) ***-1234 (show last 4, preserve format)
 * Handles: (555) 123-4567, 555-123-4567, +1-555-123-4567, 5551234567
 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10) {
    // Too short for valid phone, mask entirely
    return MASK_CHAR.repeat(value.length);
  }

  const last4 = digits.slice(-4);

  // Detect format and preserve it
  if (value.includes('(') && value.includes(')')) {
    // (555) 123-4567 format
    return `(${MASK_CHAR.repeat(3)}) ${MASK_CHAR.repeat(3)}-${last4}`;
  } else if (value.startsWith('+')) {
    // International format: +1-***-***-1234
    const countryCodeMatch = value.match(/^\+\d+/);
    const countryCode = countryCodeMatch ? countryCodeMatch[0] : '+1';
    return `${countryCode}-${MASK_CHAR.repeat(3)}-${MASK_CHAR.repeat(3)}-${last4}`;
  } else if (value.includes('-')) {
    // 555-123-4567 format
    return `${MASK_CHAR.repeat(3)}-${MASK_CHAR.repeat(3)}-${last4}`;
  } else if (value.includes('.')) {
    // 555.123.4567 format
    return `${MASK_CHAR.repeat(3)}.${MASK_CHAR.repeat(3)}.${last4}`;
  }

  // Continuous format
  return MASK_CHAR.repeat(digits.length - 4) + last4;
}

/**
 * Address: *** Example St (hide house number only)
 */
export function maskAddress(value: string): string {
  // Match leading number(s) and replace with mask
  const match = value.match(/^(\d+)\s+(.+)$/);
  if (match) {
    const [, houseNum, streetPart] = match;
    return MASK_CHAR.repeat(houseNum.length) + ' ' + streetPart;
  }

  // If no leading number found, mask first word
  const words = value.split(/\s+/);
  if (words.length > 1) {
    words[0] = MASK_CHAR.repeat(words[0].length);
    return words.join(' ');
  }

  // Single word address, mask entirely
  return MASK_CHAR.repeat(value.length);
}

/**
 * Person Name: J*** S*** (first char of each name part)
 * Preserves titles (Mr., Mrs., Dr., etc.)
 */
export function maskPersonName(value: string): string {
  const parts = value.split(/\s+/);

  return parts
    .map((part) => {
      if (part.length === 0) return '';

      // Handle titles (Mr., Mrs., Dr., etc.) - keep them visible
      if (/^(Mr|Mrs|Ms|Miss|Dr|Prof)\.?$/i.test(part)) {
        return part;
      }

      if (part.length === 1) return part;

      const firstChar = part[0];
      // Show first char, mask rest (max 5 mask chars)
      const maskLength = Math.min(part.length - 1, 5);
      return firstChar + MASK_CHAR.repeat(maskLength);
    })
    .join(' ');
}

/**
 * IP Address: ***.***.***.123 (show last octet)
 */
export function maskIPAddress(value: string): string {
  const octets = value.split('.');
  if (octets.length !== 4) {
    // Invalid IPv4, mask entirely
    return MASK_CHAR.repeat(value.length);
  }

  return `${MASK_CHAR.repeat(3)}.${MASK_CHAR.repeat(3)}.${MASK_CHAR.repeat(3)}.${octets[3]}`;
}

/**
 * Date of Birth: show year only (e.g., 01/15/1990 -> masked/masked/1990)
 * Handles: MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
 */
export function maskDateOfBirth(value: string): string {
  // ISO format: YYYY-MM-DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(value)) {
    const year = value.slice(0, 4);
    const sep = value.includes('-') ? '-' : '/';
    return `${year}${sep}${MASK_CHAR}${MASK_CHAR}${sep}${MASK_CHAR}${MASK_CHAR}`;
  }

  // US format: MM/DD/YYYY or MM-DD-YYYY
  const match = value.match(/^(\d{1,2})([-/])(\d{1,2})\2(\d{4})$/);
  if (match) {
    const [, , sep, , year] = match;
    return `${MASK_CHAR}${MASK_CHAR}${sep}${MASK_CHAR}${MASK_CHAR}${sep}${year}`;
  }

  // Fallback: mask all but last 4 characters (assumed to be year)
  if (value.length >= 4) {
    return MASK_CHAR.repeat(value.length - 4) + value.slice(-4);
  }

  return MASK_CHAR.repeat(value.length);
}

/**
 * Custom category: mask middle portion, show first and last chars
 */
export function maskCustom(value: string): string {
  if (value.length <= 4) {
    return MASK_CHAR.repeat(value.length);
  }

  const visibleCount = Math.min(2, Math.floor(value.length / 4));
  const start = value.slice(0, visibleCount);
  const end = value.slice(-visibleCount);
  const middleLength = value.length - visibleCount * 2;

  return start + MASK_CHAR.repeat(middleLength) + end;
}

/**
 * Main dispatch function for partial masking
 * Returns a format-preserving masked version of the PII value
 */
export function getPartialMask(category: PIICategory, value: string): string {
  switch (category) {
    case 'ssn':
      return maskSSN(value);
    case 'credit_card':
      return maskCreditCard(value);
    case 'email':
      return maskEmail(value);
    case 'phone':
      return maskPhone(value);
    case 'address':
      return maskAddress(value);
    case 'person_name':
      return maskPersonName(value);
    case 'ip_address':
      return maskIPAddress(value);
    case 'date_of_birth':
      return maskDateOfBirth(value);
    case 'custom':
      return maskCustom(value);
    default:
      // Fallback: mask all but first and last character
      if (value.length <= 2) {
        return MASK_CHAR.repeat(value.length);
      }
      return value[0] + MASK_CHAR.repeat(value.length - 2) + value[value.length - 1];
  }
}
