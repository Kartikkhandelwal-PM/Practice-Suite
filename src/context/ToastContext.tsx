import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

type ToastType = 'default' | 'success' | 'error' | 'warning';

interface ToastMessage {
  id: string;
  msg: string;
  type: ToastType;
}

interface ToastContextType {
  show: (msg: string, type?: ToastType) => void;
}

const ToastCtx = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const show = useCallback((msg: string, type: ToastType = 'default') => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`bg-gray-900 text-white px-4 py-3 rounded-xl text-sm max-w-xs shadow-lg flex items-center gap-2.5 pointer-events-auto animate-slide-left ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-red-600' : t.type === 'warning' ? 'bg-amber-600' : ''}`}>
            {t.type === 'success' && <CheckCircle size={16} />}
            {t.type === 'error' && <AlertCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.show;
};
