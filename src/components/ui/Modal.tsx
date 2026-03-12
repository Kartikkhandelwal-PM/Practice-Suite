import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string | ReactNode;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  headerBg?: string;
  headerColor?: string;
}

export function Modal({ title, children, onClose, footer, size = 'md', headerBg, headerColor }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-[460px]',
    md: 'max-w-[640px]',
    lg: 'max-w-[820px]',
    xl: 'max-w-[1000px]',
    '2xl': 'max-w-[1200px]',
    '3xl': 'max-w-[1400px]',
    '4xl': 'max-w-[1600px]',
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 z-[1000] flex items-start justify-center p-4 sm:p-10 overflow-y-auto backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-white rounded-2xl w-full shadow-2xl animate-scale-in relative flex flex-col ${sizeClasses[size]}`}>
        <div 
          className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 shrink-0 rounded-t-2xl"
          style={{ background: headerBg, color: headerColor }}
        >
          <div className="flex-1 font-serif text-lg font-semibold flex items-center gap-2">
            {title}
          </div>
          <button 
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-gray-200 flex gap-2.5 justify-end bg-gray-50 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, onConfirm, onCancel, danger = true }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, danger?: boolean }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button className="px-3.5 py-2 rounded-lg font-medium text-[13px] bg-white border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={onCancel}>Cancel</button>
          <button className={`px-3.5 py-2 rounded-lg font-medium text-[13px] text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={onConfirm}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </>
      }
    >
      <p className="text-gray-700 text-[13.5px]">{message}</p>
    </Modal>
  );
}
