import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Check, X as XIcon } from 'lucide-react';

type ToastType = 'success' | 'error';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  leaving: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    }, 1800);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2150);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${t.leaving ? 'toast-out' : 'toast-in'}`}
            style={{ background: t.type === 'success' ? 'var(--hero)' : 'var(--expense)' }}
          >
            {t.type === 'success' ? <Check size={15} color="var(--income)" /> : <XIcon size={15} color="#fff" />}
            {t.message}
          </div>
        ))}
      </div>
      <style>{`
        .toast-in { animation: toast-in 0.25s ease-out; }
        .toast-out { animation: toast-out 0.3s ease-in forwards; }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(8px) scale(0.95); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
