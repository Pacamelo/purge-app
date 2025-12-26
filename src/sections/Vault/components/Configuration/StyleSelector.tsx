/**
 * StyleSelector Component
 * Select redaction style (blackout, replacement, pseudonym)
 */

import { memo } from 'react';
import type { RedactionStyle } from '@/core/types';

interface StyleSelectorProps {
  value: RedactionStyle;
  onChange: (style: RedactionStyle) => void;
  replacementText: string;
  onReplacementTextChange: (text: string) => void;
}

const styles: { id: RedactionStyle; name: string; shortName: string; description: string; preview: string }[] = [
  {
    id: 'blackout',
    name: 'Blackout',
    shortName: 'Black',
    description: 'Replace with black bars',
    preview: '████',
  },
  {
    id: 'replacement',
    name: 'Replacement',
    shortName: 'Replace',
    description: 'Replace with custom text',
    preview: '[RED]',
  },
  {
    id: 'pseudonym',
    name: 'Pseudonym',
    shortName: 'Fake',
    description: 'Replace with fake data',
    preview: 'J.Doe',
  },
  {
    id: 'partial',
    name: 'Partial',
    shortName: 'Mask',
    description: 'Preserve format, mask parts',
    preview: '**1234',
  },
];

export const StyleSelector = memo(function StyleSelector({
  value,
  onChange,
  replacementText,
  onReplacementTextChange,
}: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-wider text-forge-text-dim">
        Redaction Style
      </label>

      <div className="grid grid-cols-4 gap-1 sm:gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            title={style.description}
            className={`
              p-2 sm:p-3 text-center min-w-0
              border transition-colors
              ${
                value === style.id
                  ? 'bg-forge-accent/20 border-forge-accent text-forge-accent'
                  : 'bg-forge-bg-secondary border-forge-border text-forge-text-secondary hover:border-forge-accent'
              }
            `}
          >
            <div className="text-base sm:text-lg font-mono mb-1 truncate">{style.preview}</div>
            <div className="text-[10px] sm:text-xs uppercase tracking-wider truncate">
              <span className="hidden sm:inline">{style.name}</span>
              <span className="sm:hidden">{style.shortName}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Partial style category examples */}
      {value === 'partial' && (
        <div className="mt-3 p-3 bg-forge-bg-tertiary border border-forge-border">
          <label className="block text-xs uppercase tracking-wider text-forge-text-dim mb-2">
            Category Examples
          </label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-forge-text-secondary">
            <div>SSN: ***-**-1234</div>
            <div>Card: ****-****-****-5678</div>
            <div>Email: j***@domain.com</div>
            <div>Phone: (***) ***-4567</div>
            <div>Name: J*** S****</div>
            <div>IP: ***.***.***.100</div>
          </div>
        </div>
      )}

      {/* Custom replacement text input */}
      {value === 'replacement' && (
        <div className="mt-3">
          <label className="block text-xs uppercase tracking-wider text-forge-text-dim mb-1">
            Replacement Text
          </label>
          <input
            type="text"
            value={replacementText}
            onChange={(e) => onReplacementTextChange(e.target.value)}
            placeholder="[REDACTED]"
            maxLength={50}
            className="
              w-full px-3 py-2
              bg-forge-bg-tertiary border border-forge-border
              text-forge-text-primary font-mono text-sm
              focus:outline-none focus:border-forge-accent
            "
          />
        </div>
      )}
    </div>
  );
});
