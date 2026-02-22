import { type ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-DEFAULT focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-terracotta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variants = {
      default: 'bg-palette-terracotta text-white hover:bg-palette-terracotta/90 active:bg-palette-terracotta/80 shadow-card',
      outline: 'border border-palette-mist bg-white text-palette-taupe hover:border-palette-terracotta/50 hover:bg-palette-cream/10',
      ghost: 'text-palette-taupe hover:bg-palette-mist/40',
    };
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
    };
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
