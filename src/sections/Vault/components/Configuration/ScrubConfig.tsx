/**
 * ScrubConfig Component
 * Configuration panel for PII detection settings
 */

import { memo, useState } from 'react';
import type { PIICategory, ScrubConfig as ScrubConfigType } from '@/core/types';
import { categories } from '@/core/constants/categories';
import { CategorySwitch } from './CategorySwitch';
import { StyleSelector } from './StyleSelector';
import { ValidationRulesHelp } from './ValidationRulesHelp';

interface ScrubConfigProps {
  config: ScrubConfigType;
  onToggleCategory: (category: PIICategory) => void;
  onStyleChange: (style: ScrubConfigType['redactionStyle']) => void;
  onReplacementTextChange: (text: string) => void;
  onSensitivityChange: (sensitivity: ScrubConfigType['sensitivity']) => void;
}

export const ScrubConfig = memo(function ScrubConfig({
  config,
  onToggleCategory,
  onStyleChange,
  onReplacementTextChange,
  onSensitivityChange,
}: ScrubConfigProps) {
  const enabledCount = Object.values(config.categories).filter(Boolean).length;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono uppercase tracking-wider text-forge-text-primary">
            Detection Settings
          </h3>
          <p className="text-xs text-forge-text-dim mt-1">
            {enabledCount} of {categories.length} categories enabled
          </p>
        </div>

        {/* Sensitivity selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-forge-text-dim uppercase">Sensitivity:</span>
          <select
            value={config.sensitivity}
            onChange={(e) =>
              onSensitivityChange(e.target.value as ScrubConfigType['sensitivity'])
            }
            className="
              px-2 py-1 text-xs font-mono uppercase
              bg-forge-bg-tertiary border border-forge-border
              text-forge-text-secondary
              focus:outline-none focus:border-forge-accent
            "
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Category toggles */}
      <div className="space-y-1">
        <label className="block text-xs uppercase tracking-wider text-forge-text-dim mb-2">
          PII Categories
        </label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <CategorySwitch
              key={category.id}
              category={category}
              enabled={config.categories[category.id]}
              onToggle={onToggleCategory}
            />
          ))}
        </div>
      </div>

      {/* Redaction style */}
      <StyleSelector
        value={config.redactionStyle}
        onChange={onStyleChange}
        replacementText={config.replacementText}
        onReplacementTextChange={onReplacementTextChange}
      />

      {/* Help section */}
      <div className="pt-2 border-t border-forge-border">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full flex items-center justify-between py-2 text-xs text-forge-text-dim hover:text-forge-accent transition-colors"
        >
          <span className="uppercase tracking-wider">
            {showHelp ? '▼' : '▶'} Why wasn't something detected?
          </span>
        </button>
        {showHelp && <ValidationRulesHelp />}
      </div>
    </div>
  );
});
