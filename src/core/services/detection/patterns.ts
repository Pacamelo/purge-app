/**
 * PII Detection Patterns
 * Regex patterns for detecting personally identifiable information
 */

import type { PIICategory } from '@/core/types';

export interface PatternDefinition {
  category: PIICategory;
  pattern: RegExp;
  priority: number; // Higher priority patterns are checked first
  validator?: (match: string) => boolean; // Optional validation function
}

/**
 * Email pattern
 * Matches standard email formats
 */
const emailPattern: PatternDefinition = {
  category: 'email',
  pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  priority: 100,
};

/**
 * Phone patterns
 * Matches various US phone number formats
 */
const phonePattern: PatternDefinition = {
  category: 'phone',
  pattern: /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
  priority: 90,
  validator: (match) => {
    // Must have at least 10 digits
    const digits = match.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  },
};

/**
 * SSN pattern
 * Matches Social Security Numbers
 *
 * SSN validation rules per SSA:
 * - Area number (first 3 digits): Cannot be 000, 666, or 900-999
 * - Group number (middle 2 digits): Cannot be 00
 * - Serial number (last 4 digits): Cannot be 0000
 * - Reserved for advertising: 987-65-4320 through 987-65-4329
 *
 * @see https://www.ssa.gov/employer/ssnv.htm
 */
const ssnPattern: PatternDefinition = {
  category: 'ssn',
  pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  priority: 100,
  validator: (match) => {
    const digits = match.replace(/\D/g, '');

    // Must be exactly 9 digits
    if (digits.length !== 9) {
      return false;
    }

    const area = digits.slice(0, 3);
    const group = digits.slice(3, 5);
    const serial = digits.slice(5, 9);

    // Area number cannot be 000
    if (area === '000') {
      return false;
    }

    // Area number cannot be 666 (never been used, reserved)
    if (area === '666') {
      return false;
    }

    // Area number cannot be 900-999 (reserved for future use)
    if (area >= '900') {
      return false;
    }

    // Group number cannot be 00
    if (group === '00') {
      return false;
    }

    // Serial number cannot be 0000
    if (serial === '0000') {
      return false;
    }

    // Reserved for advertising: 987-65-4320 through 987-65-4329
    if (area === '987' && group === '65') {
      const serialNum = parseInt(serial, 10);
      if (serialNum >= 4320 && serialNum <= 4329) {
        return false;
      }
    }

    // Additional advertising SSN check: 078-05-1120 (Woolworth wallet SSN)
    if (digits === '078051120') {
      return false;
    }

    return true;
  },
};

/**
 * Credit card pattern
 * Matches major credit card formats (Visa, MC, Amex, Discover)
 */
const creditCardPattern: PatternDefinition = {
  category: 'credit_card',
  pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
  priority: 95,
  validator: (match) => {
    const digits = match.replace(/\D/g, '');
    // Must be 15-16 digits
    if (digits.length < 15 || digits.length > 16) {
      return false;
    }
    // Luhn algorithm check
    return luhnCheck(digits);
  },
};

/**
 * IP Address pattern
 * Matches IPv4 addresses
 */
const ipAddressPattern: PatternDefinition = {
  category: 'ip_address',
  pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  priority: 80,
};

/**
 * Date of Birth patterns
 * Matches common date formats that might be DOBs
 */
const dateOfBirthPattern: PatternDefinition = {
  category: 'date_of_birth',
  pattern: /\b(?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01])[-/](?:19|20)\d{2}\b|\b(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01])\b/g,
  priority: 70,
};

/**
 * Address pattern
 * Matches common US street address formats
 *
 * SECURITY: Pattern rewritten to prevent ReDoS attacks.
 * The original pattern (?:[A-Za-z]+\s+){1,4} caused exponential backtracking
 * with adversarial input like "12345 A A A A A A A A A A Street".
 * The fixed pattern uses possessive-like matching by being more specific.
 */
const addressPattern: PatternDefinition = {
  category: 'address',
  pattern:
    /\b\d{1,5}\s+[A-Za-z]+(?:\s+[A-Za-z]+){0,3}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\.?\b/gi,
  priority: 60,
};

/**
 * Person name pattern (with title)
 * Matches names preceded by common titles
 */
const personNameWithTitlePattern: PatternDefinition = {
  category: 'person_name',
  pattern: /\b(?:Mr|Mrs|Ms|Miss|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g,
  priority: 50,
};

/**
 * Person name pattern (broad)
 * Matches capitalized word pairs that look like names without requiring a title.
 * Lower priority due to higher false positive rate.
 *
 * Note: This may match place names like "New York" - validator filters common ones.
 */
const personNameBroadPattern: PatternDefinition = {
  category: 'person_name',
  pattern: /\b[A-Z][a-z]{2,15}\s+[A-Z][a-z]{2,20}\b/g,
  priority: 30,
  validator: (match) => {
    // Filter common false positives (place names, company names, column headers, etc.)
    const commonPhrases = [
      // Place names
      'New York',
      'Los Angeles',
      'San Francisco',
      'San Diego',
      'Las Vegas',
      'United States',
      'United Kingdom',
      'North America',
      'South America',
      'North Carolina',
      'South Carolina',
      'New Jersey',
      'New Mexico',
      'New Hampshire',
      'New Zealand',
      // Company names
      'General Electric',
      'American Express',
      // Common column headers / field labels (spreadsheet noise)
      'Full Name',
      'First Name',
      'Last Name',
      'Middle Name',
      'Given Name',
      'Family Name',
      'Company Name',
      'Business Name',
      'Account Name',
      'Customer Name',
      'Employee Name',
      'Contact Name',
      'Display Name',
      'Legal Name',
      'Billing Name',
      'Shipping Name',
      'Primary Contact',
      'Emergency Contact',
      'Phone Number',
      'Email Address',
      'Street Address',
      'Mailing Address',
      'Billing Address',
      'Shipping Address',
      'Home Address',
      'Work Address',
      'Office Address',
      'Physical Address',
      'Postal Code',
      'Zip Code',
      'Area Code',
      'Country Code',
      'Report Date',
      'Start Date',
      'End Date',
      'Due Date',
      'Birth Date',
      'Hire Date',
      'Created Date',
      'Modified Date',
      'Last Modified',
      'Date Created',
      'Customer Service',
      'Technical Support',
      'Human Resources',
      'Account Number',
      'Reference Number',
      'Order Number',
      'Invoice Number',
      'Serial Number',
      'Tracking Number',
      'Case Number',
      'Report Number',
      'Total Amount',
      'Grand Total',
      'Net Amount',
      'Tax Amount',
    ];
    return !commonPhrases.includes(match);
  },
};

/**
 * International phone pattern (E.164 format)
 * Matches phone numbers in international format starting with +
 */
const intlPhonePattern: PatternDefinition = {
  category: 'phone',
  pattern: /\+[1-9]\d{6,14}\b/g,
  priority: 85,
};

/**
 * UK Postcode pattern
 * Matches UK postal codes (e.g., "SW1A 1AA", "M1 1AA", "B33 8TH")
 */
const ukPostcodePattern: PatternDefinition = {
  category: 'address',
  pattern: /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/gi,
  priority: 70,
};

/**
 * All patterns ordered by priority
 */
export const patterns: PatternDefinition[] = [
  emailPattern,
  ssnPattern,
  creditCardPattern,
  phonePattern,
  intlPhonePattern,
  ipAddressPattern,
  ukPostcodePattern,
  dateOfBirthPattern,
  addressPattern,
  personNameWithTitlePattern,
  personNameBroadPattern,
].sort((a, b) => b.priority - a.priority);

/**
 * Cache for filtered pattern sets by category combination.
 * Prevents repeated filtering on each scan call.
 */
const patternSetCache = new Map<string, PatternDefinition[]>();

/**
 * Get patterns for specific categories (cached)
 * Uses a cache to avoid repeated filtering for the same category combinations.
 */
export function getPatternsForCategories(
  enabledCategories: PIICategory[]
): PatternDefinition[] {
  // Create cache key from sorted categories
  const key = [...enabledCategories].sort().join('|');

  // Return cached set if available
  let cached = patternSetCache.get(key);
  if (cached) {
    return cached;
  }

  // Filter and cache
  cached = patterns.filter((p) => enabledCategories.includes(p.category));
  patternSetCache.set(key, cached);

  return cached;
}

/**
 * Luhn algorithm for credit card validation
 * Exported for direct testing
 */
export function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
