import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

type ToastMessage = { id: number; text: string };

const ToastContext = createContext<((text: string) => void) | null>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error('useToast must be used within ToastProvider');
  return show;
}

const TOAST_DURATION_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextIdRef = useRef(0);

  const showToast = useCallback((text: string) => {
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto rounded-lg border border-palette-mist bg-white px-4 py-3 shadow-lg text-sm font-medium text-palette-taupe"
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
