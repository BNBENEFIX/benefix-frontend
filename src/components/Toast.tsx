import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, visible }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border glass-effect"
          style={{
            borderColor: type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6',
          }}
        >
          {type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          <span className="text-sm font-medium pr-2 max-w-xs">{message}</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
