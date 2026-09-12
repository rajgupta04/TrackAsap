import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export const ConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  icon: Icon = AlertTriangle,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-500/10 border-red-500/30 text-red-400',
      btnBg: 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20',
      glow: 'bg-red-500/10',
    },
    warning: {
      iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      btnBg: 'bg-amber-500 hover:bg-amber-600 text-dark-950 font-bold shadow-amber-500/20',
      glow: 'bg-amber-500/10',
    },
    primary: {
      iconBg: 'bg-neon-green/10 border-neon-green/30 text-neon-green',
      btnBg: 'bg-neon-green hover:bg-neon-green/90 text-dark-950 font-bold shadow-neon-green/20',
      glow: 'bg-neon-green/10',
    },
  };

  const currentStyle = variantStyles[variant] || variantStyles.danger;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-md bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
        >
          <div className={`absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 ${currentStyle.glow} rounded-full blur-2xl pointer-events-none`} />

          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${currentStyle.iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
                  <p className="text-xs text-dark-400 mt-0.5">{description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-dark-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-dark-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 ${currentStyle.btnBg}`}
              >
                {isLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
