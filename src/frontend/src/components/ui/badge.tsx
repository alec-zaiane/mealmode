import { type HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className = '', variant = 'secondary', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-palette-terracotta text-white',
    secondary: 'bg-palette-cream/80 text-palette-taupe border border-palette-cream',
    outline: 'border border-palette-mist bg-transparent text-palette-taupe hover:border-palette-terracotta/50',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-DEFAULT ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
