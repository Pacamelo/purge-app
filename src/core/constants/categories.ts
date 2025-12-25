/**
 * PII Category Definitions
 * Categories of personally identifiable information that PURGE can detect
 */

import type { PIICategory } from '@/core/types';

export interface CategoryDefinition {
  id: PIICategory;
  name: string;
  description: string;
  icon: string;
  examples: string[];
  defaultEnabled: boolean;
}

export const categories: CategoryDefinition[] = [
  {
    id: 'person_name',
    name: 'Names',
    description: 'Personal names, first/last names',
    icon: 'N',
    examples: ['John Smith', 'Jane Doe', 'Dr. Robert Johnson'],
    defaultEnabled: true,
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Email addresses',
    icon: '@',
    examples: ['john@example.com', 'jane.doe@company.org'],
    defaultEnabled: true,
  },
  {
    id: 'phone',
    name: 'Phone',
    description: 'Phone numbers in various formats',
    icon: '#',
    examples: ['(555) 123-4567', '+1-555-123-4567', '555.123.4567'],
    defaultEnabled: true,
  },
  {
    id: 'address',
    name: 'Address',
    description: 'Physical addresses, street addresses',
    icon: 'A',
    examples: ['123 Main St, Anytown, USA 12345'],
    defaultEnabled: true,
  },
  {
    id: 'ssn',
    name: 'SSN',
    description: 'Social Security Numbers',
    icon: 'S',
    examples: ['123-45-6789', '123456789'],
    defaultEnabled: true,
  },
  {
    id: 'credit_card',
    name: 'Credit Card',
    description: 'Credit/debit card numbers',
    icon: '$',
    examples: ['4111-1111-1111-1111', '4111111111111111'],
    defaultEnabled: true,
  },
  {
    id: 'ip_address',
    name: 'IP Address',
    description: 'IPv4 and IPv6 addresses',
    icon: 'IP',
    examples: ['192.168.1.1', '10.0.0.1'],
    defaultEnabled: false,
  },
  {
    id: 'date_of_birth',
    name: 'Date of Birth',
    description: 'Birth dates in various formats',
    icon: 'D',
    examples: ['01/15/1990', 'January 15, 1990', '1990-01-15'],
    defaultEnabled: true,
  },
];

export const categoryMap = new Map(categories.map((c) => [c.id, c]));

export function getCategoryName(id: PIICategory): string {
  return categoryMap.get(id)?.name ?? id;
}

export function getCategoryIcon(id: PIICategory): string {
  return categoryMap.get(id)?.icon ?? '?';
}
