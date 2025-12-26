/**
 * Animated PURGE Logo Reveal
 * Bars slide in and stay - matching the redaction bar logo style
 */

import { useEffect, useState } from 'react';

interface LogoRevealProps {
  className?: string;
  onComplete?: () => void;
}

export function LogoReveal({ className = '', onComplete }: LogoRevealProps) {
  const [phase, setPhase] = useState<'initial' | 'animating' | 'complete'>('initial');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('animating'), 100);
    const timer2 = setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className={`relative ${className}`}>
      {/* Use the actual PNG logo with bar slide-in effect via clip-path */}
      <div className="relative h-16 md:h-20 lg:h-24 w-auto mx-auto overflow-hidden">
        <img
          src="/logo-purge-original.png"
          alt="PURGE"
          className="h-full w-auto invert"
          style={{
            clipPath: phase === 'initial'
              ? 'inset(0 100% 0 0)'
              : 'inset(0 0% 0 0)',
            transition: 'clip-path 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default LogoReveal;
