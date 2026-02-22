import { type InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`flex h-10 w-full rounded-lg border border-palette-mist/80 bg-white px-3 py-2 text-sm transition-colors duration-DEFAULT placeholder:text-palette-slate/70 focus-visible:outline-none focus-visible:border-palette-terracotta focus-visible:ring-2 focus-visible:ring-palette-terracotta/20 focus-visible:ring-offset-0 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';
