/**
 * WorkflowSteps Component
 * Shows the current step in the workflow: Drop -> Scan -> Review -> Shred -> Download
 */

import { memo } from 'react';
import type { PurgeState } from '@/core/types';

interface WorkflowStepsProps {
  currentState: PurgeState;
  compact?: boolean;
}

type Step = {
  id: string;
  label: string;
  states: PurgeState[];
};

const STEPS: Step[] = [
  { id: 'drop', label: 'Drop', states: ['idle', 'loaded'] },
  { id: 'scan', label: 'Scan', states: ['scanning', 'configuring'] },
  { id: 'review', label: 'Review', states: ['preview'] },
  { id: 'shred', label: 'Shred', states: ['shredding'] },
  { id: 'done', label: 'Done', states: ['complete'] },
];

function getStepStatus(step: Step, currentState: PurgeState): 'completed' | 'current' | 'upcoming' {
  const currentIndex = STEPS.findIndex(s => s.states.includes(currentState));
  const stepIndex = STEPS.indexOf(step);

  if (stepIndex < currentIndex) return 'completed';
  if (step.states.includes(currentState)) return 'current';
  return 'upcoming';
}

export const WorkflowSteps = memo(function WorkflowSteps({
  currentState,
  compact = false,
}: WorkflowStepsProps) {
  // Don't show for jammed state
  if (currentState === 'jammed') return null;

  return (
    <div className={`flex items-center justify-center gap-1 ${compact ? 'gap-0.5' : 'gap-2'}`}>
      {STEPS.map((step, index) => {
        const status = getStepStatus(step, currentState);
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  ${compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'}
                  rounded-full flex items-center justify-center font-mono
                  transition-all duration-300
                  ${status === 'completed'
                    ? 'bg-forge-success/20 border-2 border-forge-success text-forge-success'
                    : status === 'current'
                      ? 'bg-forge-accent/20 border-2 border-forge-accent text-forge-accent animate-pulse'
                      : 'bg-forge-bg-tertiary border-2 border-forge-border border-dashed text-forge-text-dim'
                  }
                `}
              >
                {status === 'completed' ? (
                  <CheckIcon size={compact ? 10 : 12} />
                ) : (
                  index + 1
                )}
              </div>
              {!compact && (
                <span
                  className={`
                    mt-1 text-[10px] font-mono uppercase tracking-wider
                    ${status === 'current' ? 'text-forge-accent' : 'text-forge-text-dim'}
                  `}
                >
                  {step.label}
                </span>
              )}
            </div>

            {/* Connector */}
            {!isLast && (
              <div
                className={`
                  ${compact ? 'w-4 mx-0.5' : 'w-6 mx-1'} h-0.5
                  transition-colors duration-300
                  ${status === 'completed' ? 'bg-forge-success/50' : 'bg-forge-border'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
