import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Sparkles, X } from 'lucide-react';
import { useThemeStore, THEMES } from '../../store/themeStore';
import toast from 'react-hot-toast';

const ThemeModal = () => {
  const { currentTheme, setTheme, isThemeModalOpen, closeThemeModal } = useThemeStore();

  const handleSelectTheme = (themeId, themeName) => {
    setTheme(themeId);
    toast.success(`Theme switched to ${themeName}! ✨`, {
      id: 'theme-switch-toast',
      duration: 2000,
    });
  };

  return (
    <AnimatePresence>
      {isThemeModalOpen && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={closeThemeModal}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-dark-950/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center text-neon-green">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Theme Customizer
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green font-semibold border border-neon-green/30">
                    Live Preview
                  </span>
                </h2>
                <p className="text-xs text-dark-300">
                  Select your aesthetic. Changes take effect across all pages instantly.
                </p>
              </div>
            </div>
            <button
              onClick={closeThemeModal}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body: Theme Cards Grid */}
          <div className="p-6 overflow-y-auto space-y-3.5 min-h-0">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id, theme.name)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isSelected
                      ? 'bg-dark-800 border-neon-green shadow-lg shadow-neon-green/10 ring-1 ring-neon-green/30'
                      : 'bg-dark-950/60 border-white/5 hover:border-white/20 hover:bg-dark-800/40'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-white group-hover:text-neon-green transition-colors">
                        {theme.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                          isSelected
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                            : 'bg-white/5 text-dark-400 border border-white/10'
                        }`}
                      >
                        {theme.tag}
                      </span>
                    </div>
                    <p className="text-xs text-dark-300 line-clamp-2">{theme.description}</p>
                  </div>

                  {/* Palette Preview Swatches & Checkmark */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-dark-950 border border-white/10">
                      <span
                        title="Background"
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.colors.bg }}
                      />
                      <span
                        title="Surface"
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.colors.surface }}
                      />
                      <span
                        title="Card"
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: theme.colors.card }}
                      />
                      <span
                        title="Accent"
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-neon-green text-dark-950 border-neon-green'
                          : 'border-white/10 text-transparent group-hover:border-white/30'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 border-t border-white/10 bg-dark-950/60 flex items-center justify-between shrink-0">
            <span className="text-xs text-dark-400">
              Active: <strong className="text-white">{THEMES.find(t => t.id === currentTheme || t.legacyIds?.includes(currentTheme))?.name || currentTheme}</strong>
            </span>
            <button
              onClick={closeThemeModal}
              className="px-4 py-1.5 rounded-lg bg-neon-green hover:brightness-110 text-dark-950 text-xs font-bold transition shadow-sm shadow-neon-green/20"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ThemeModal;
