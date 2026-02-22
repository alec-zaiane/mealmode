import { createContext, useContext, cloneElement, isValidElement, type ReactNode } from 'react';

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  const ctx = useContext(DialogContext);
  if (!ctx) return null;
  const open = () => ctx.setOpen(true);
  const child = Array.isArray(children) ? children[0] : children;
  if (asChild && isValidElement(child)) {
    return cloneElement(child as React.ReactElement<{ onClick?: () => void }>, { onClick: open });
  }
  return (
    <button type="button" onClick={open}>
      {children}
    </button>
  );
}

export function DialogContent({
  className = '',
  children,
  onClose,
}: {
  className?: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  const ctx = useContext(DialogContext);
  if (!ctx || !ctx.open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-all"
        onClick={() => { ctx.setOpen(false); onClose?.(); }}
        aria-hidden
      />
      <div
        role="dialog"
        className={`fixed left-1/2 top-1/2 z-[100] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-palette-border/60 bg-white p-8 shadow-glass transition-all ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

export function DialogHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-6 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-2xl font-brand font-bold text-palette-text tracking-tight ${className}`}>{children}</h2>;
}
