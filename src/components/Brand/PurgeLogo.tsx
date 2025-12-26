/**
 * PURGE Logo Component
 * Redaction bar aesthetic with geometric cuts forming letters
 */

interface PurgeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  variant?: 'default' | 'white';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
  hero: 'h-16 md:h-20 lg:h-24',
};

export function PurgeLogo({ size = 'md', variant = 'white', className = '' }: PurgeLogoProps) {
  // Use original PNG logo (black on transparent)
  // For dark backgrounds (variant='white'), we invert with CSS filter
  const src = '/logo-purge-original.png';
  const filterClass = variant === 'white' ? 'invert' : '';

  return (
    <img
      src={src}
      alt="PURGE"
      className={`${sizeClasses[size]} w-auto ${filterClass} ${className}`}
      draggable={false}
    />
  );
}

export default PurgeLogo;
