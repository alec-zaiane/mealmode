import {
  type ButtonHTMLAttributes,
  type ReactElement,
  cloneElement,
  forwardRef,
  isValidElement,
} from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palette-primary/20 disabled:pointer-events-none disabled:opacity-50 tracking-tight';
    const variants = {
      default: 'bg-palette-primary text-white shadow-soft transition-all hover:shadow-md hover:bg-palette-primaryDark',
      outline: 'border-2 border-palette-border bg-white text-palette-text hover:bg-[#F5F4F1] hover:border-palette-primary/50 transition-all font-semibold',
      ghost: 'text-[#8A8A86] hover:text-palette-text hover:bg-[#F5F4F1] transition-all font-semibold',
    };
    const sizes = {
      default: 'h-11 rounded-2xl px-6',
      sm: 'h-9 rounded-xl px-4 text-sm',
    };

    const mergedClassName = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, {
        className: `${mergedClassName} ${child.props.className ?? ''}`.trim(),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={mergedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
