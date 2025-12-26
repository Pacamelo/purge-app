/**
 * Button Component
 * Standardized button styles for the PURGE app
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-forge-accent text-forge-bg-primary
    border border-forge-accent
    hover:bg-forge-text-primary hover:border-forge-text-primary
    disabled:bg-forge-bg-tertiary disabled:border-forge-border disabled:text-forge-text-dim
  `,
  secondary: `
    bg-transparent text-forge-accent
    border border-forge-accent
    hover:bg-forge-accent/10
    disabled:border-forge-border disabled:text-forge-text-dim
  `,
  ghost: `
    bg-transparent text-forge-text-secondary
    border border-transparent
    hover:text-forge-text-primary hover:bg-forge-bg-tertiary
    disabled:text-forge-text-dim
  `,
  danger: `
    bg-forge-error/20 text-forge-error
    border border-forge-error/50
    hover:bg-forge-error/30 hover:border-forge-error
    disabled:bg-forge-bg-tertiary disabled:border-forge-border disabled:text-forge-text-dim
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    fullWidth = false,
    className = '',
    children,
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`
        font-mono uppercase tracking-wider
        transition-all duration-200
        disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});
