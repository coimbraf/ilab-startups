import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  message: string;
  resolve: (value: boolean) => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface UIContextType {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string, options?: { title?: string, confirmText?: string, cancelText?: string, danger?: boolean }) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastOptions[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const confirm = useCallback((message: string, options?: { title?: string, confirmText?: string, cancelText?: string, danger?: boolean }) => {
    return new Promise<boolean>((resolve) => {
      setConfirmModal({
        message,
        resolve,
        title: options?.title,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        danger: options?.danger
      });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    if (confirmModal) {
      confirmModal.resolve(value);
      setConfirmModal(null);
    }
  };

  return (
    <UIContext.Provider value={{ toast, confirm }}>
      {children}
      
      {/* Toast Portal */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto",
                t.type === 'success' ? "bg-green-50 border-green-200 text-green-800" :
                t.type === 'error' ? "bg-red-50 border-red-200 text-red-800" :
                "bg-blue-50 border-blue-200 text-blue-800"
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              <span className="font-medium text-sm">{t.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-2 text-current opacity-50 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Modal Portal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
              onClick={() => handleConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-gray-100"
            >
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-4", confirmModal.danger ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500")}>
                {confirmModal.danger ? <ShieldAlert className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold font-playfair text-navy mb-2">
                {confirmModal.title || 'Confirmação'}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {confirmModal.cancelText || 'Cancelar'}
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors", confirmModal.danger ? "bg-red-500 hover:bg-red-600" : "bg-navy hover:bg-navy/90")}
                >
                  {confirmModal.confirmText || 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
