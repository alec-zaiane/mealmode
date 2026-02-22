import { type HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className = '', variant = 'secondary', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-palette-primary text-white',
    secondary: 'bg-palette-background text-palette-text',
    outline: 'border border-palette-text bg-transparent',
  };
  return (
    <span
      className={`inline-flex items-center rounded-xl px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
