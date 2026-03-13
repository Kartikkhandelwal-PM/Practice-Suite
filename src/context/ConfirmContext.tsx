import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Modal } from '../components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<(value: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver(() => (value: boolean) => resolve(value));
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {isOpen && options && (
        <Modal
          title={
            <div className="flex items-center gap-2 text-gray-900">
              {options.danger && <AlertTriangle size={18} className="text-red-600" />}
              {options.title}
            </div>
          }
          onClose={handleCancel}
          size="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button 
                className="px-4 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors" 
                onClick={handleCancel}
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button 
                className={`px-4 py-2 rounded-lg font-bold text-[13px] text-white transition-colors shadow-sm ${options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`} 
                onClick={handleConfirm}
              >
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          }
        >
          <p className="text-[14px] text-gray-600">{options.message}</p>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};
