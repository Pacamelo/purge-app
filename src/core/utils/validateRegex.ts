/**
 * Regex Validation Utilities
 *
 * Validates user-supplied regex patterns to prevent ReDoS attacks
 * and other security issues.
 */

export interface RegexValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Maximum allowed length for a regex pattern
 */
const MAX_PATTERN_LENGTH = 500;

/**
 * Patterns that indicate potentially dangerous regex constructs
 * These can cause exponential backtracking (ReDoS)
 */
const DANGEROUS_PATTERNS = [
  // Nested quantifiers: (a+)+ or (a*)*
  /\([^)]*[+*]\)[+*]/,
  // Overlapping alternation with quantifiers: (a|a)+
  /\([^)]*\|[^)]*\)[+*]/,
  // Quantifier on quantified group: (?:...){n}{m}
  /\{[0-9,]+\}\s*\{/,
  // (.*)+  or  (.*)*  - catastrophic backtracking
  /\(\.\*\)[+*]/,
  // (.+)+  or  (.+)*  - catastrophic backtracking
  /\(\.\+\)[+*]/,
  // Nested groups with + or * on inner and outer
  /\([^)]*\([^)]*[+*][^)]*\)[^)]*\)[+*]/,
];

/**
 * Validate a regex pattern for security issues
 *
 * @param pattern - The regex pattern string to validate
 * @returns Validation result with error message if invalid
 */
export function validateRegex(pattern: string): RegexValidationResult {
  // Check length
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return {
      valid: false,
      error: `Pattern too long (max ${MAX_PATTERN_LENGTH} characters, got ${pattern.length})`,
    };
  }

  // Check for empty pattern
  if (pattern.trim().length === 0) {
    return {
      valid: false,
      error: 'Pattern cannot be empty',
    };
  }

  // Check for dangerous patterns that could cause ReDoS
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) {
      return {
        valid: false,
        error: 'Pattern contains constructs that could cause slow matching. Avoid nested quantifiers like (a+)+ or (.*)+',
      };
    }
  }

  // Try to compile the regex to check syntax
  try {
    new RegExp(pattern);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      valid: false,
      error: `Invalid regex syntax: ${message}`,
    };
  }

  return { valid: true };
}

/**
 * Validate and compile a regex pattern
 * Returns the compiled RegExp if valid, null otherwise
 *
 * @param pattern - The regex pattern string
 * @param flags - Optional regex flags (default: 'g')
 * @returns Compiled RegExp or null with error
 */
export function safeCompileRegex(
  pattern: string,
  flags: string = 'g'
): { regex: RegExp | null; error?: string } {
  const validation = validateRegex(pattern);

  if (!validation.valid) {
    return { regex: null, error: validation.error };
  }

  try {
    return { regex: new RegExp(pattern, flags) };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { regex: null, error: `Failed to compile regex: ${message}` };
  }
}
