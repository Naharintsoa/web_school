/**
 * Contexte de notifications Toast
 * Fournit un système de messages visuels pour informer l'utilisateur
 * des succès, erreurs et informations diverses.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

// Types de notifications disponibles
export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Affiche un nouveau message - disparaît automatiquement après 4 secondes
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Conteneur des notifications — positionné en bas à droite */}
      <div className="fixed bottom-4 right-4 z-[300] space-y-2 max-w-sm w-full px-4 sm:px-0">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
              toast.type === 'success' ? 'bg-green-600' :
              toast.type === 'error'   ? 'bg-red-600'   : 'bg-indigo-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} className="flex-shrink-0" /> :
             toast.type === 'error'   ? <AlertCircle size={18} className="flex-shrink-0" /> :
                                        <Info size={18} className="flex-shrink-0" />}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white flex-shrink-0"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
