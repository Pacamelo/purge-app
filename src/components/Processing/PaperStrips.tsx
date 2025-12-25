/**
 * PaperStrips Component
 * Animated paper strips falling from shredder
 */

import { memo, useEffect, useState } from 'react';

interface PaperStrip {
  id: string;
  left: number;
  delay: number;
  duration: number;
  height: number;
  rotation: number;
}

interface PaperStripsProps {
  isActive: boolean;
  intensity?: 'low' | 'medium' | 'high';
}

/**
 * Generate random strips
 */
function generateStrips(count: number): PaperStrip[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `strip-${i}-${Date.now()}`,
    left: 5 + Math.random() * 90, // 5-95% from left
    delay: Math.random() * 2, // 0-2s delay
    duration: 1.5 + Math.random() * 1.5, // 1.5-3s duration
    height: 30 + Math.random() * 50, // 30-80px height
    rotation: -15 + Math.random() * 30, // -15 to 15 degrees
  }));
}

export const PaperStrips = memo(function PaperStrips({
  isActive,
  intensity = 'medium',
}: PaperStripsProps) {
  const [strips, setStrips] = useState<PaperStrip[]>([]);

  const stripCounts = {
    low: 8,
    medium: 15,
    high: 25,
  };

  // Generate new strips when active
  useEffect(() => {
    if (!isActive) {
      setStrips([]);
      return;
    }

    // Initial strips
    setStrips(generateStrips(stripCounts[intensity]));

    // Regenerate strips periodically
    const interval = setInterval(() => {
      setStrips(generateStrips(stripCounts[intensity]));
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, intensity]);

  if (!isActive || strips.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {strips.map((strip) => (
        <div
          key={strip.id}
          className="paper-strip absolute strip-falling"
          style={{
            left: `${strip.left}%`,
            height: `${strip.height}px`,
            animationDelay: `${strip.delay}s`,
            animationDuration: `${strip.duration}s`,
            transform: `rotate(${strip.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
});
