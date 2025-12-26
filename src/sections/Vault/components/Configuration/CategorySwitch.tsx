/**
 * CategorySwitch Component
 * Compact retro toggle switch for PII categories
 */

import { memo } from 'react';
import type { PIICategory } from '@/core/types';
import type { CategoryDefinition } from '@/core/constants/categories';

interface CategorySwitchProps {
  category: CategoryDefinition;
  enabled: boolean;
  onToggle: (category: PIICategory) => void;
}

export const CategorySwitch = memo(function CategorySwitch({
  category,
  enabled,
  onToggle,
}: CategorySwitchProps) {
  return (
    <button
      onClick={() => onToggle(category.id)}
      className={`
        flex items-center gap-2 px-2 py-1.5 w-full
        border transition-colors text-left
        ${enabled
          ? 'bg-forge-accent/10 border-forge-accent'
          : 'bg-forge-bg-tertiary border-forge-border hover:border-forge-text-dim'
        }
      `}
      title={category.description}
    >
      {/* Category icon */}
      <span
        className={`
          text-xs font-bold w-6 h-6 flex items-center justify-center shrink-0
          border
          ${enabled
            ? 'text-forge-accent border-forge-accent'
            : 'text-forge-text-dim border-forge-border'
          }
        `}
      >
        {category.icon}
      </span>

      {/* Category name */}
      <span
        className={`
          text-[11px] font-mono uppercase truncate flex-1
          ${enabled ? 'text-forge-text-primary' : 'text-forge-text-dim'}
        `}
      >
        {category.name}
      </span>

      {/* Simple toggle indicator */}
      <span
        className={`
          w-3 h-3 border shrink-0
          ${enabled
            ? 'bg-forge-accent border-forge-accent'
            : 'bg-transparent border-forge-border'
          }
        `}
      />
    </button>
  );
});
