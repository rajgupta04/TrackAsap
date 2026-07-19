import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Minus, Maximize2, X, Flame, Trophy, RefreshCw, Info, Sparkles } from 'lucide-react';

const StreakModal = ({ isOpen, onClose, streak, onRefresh, isRefreshing }) => {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const constraintsRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 15, mass: 0.5 });
  const scale = useSpring(1, { stiffness: 400, damping: 20 });

  const handleMinimize = useCallback(() => {
    setMinimized(prev => !prev);
    if (maximized) setMaximized(false);
    scale.set(0.97);
    setTimeout(() => scale.set(1), 150);
  }, [maximized, scale]);

  const handleMaximize = useCallback(() => {
    setMaximized(prev => !prev);
    if (minimized) setMinimized(false);
    x.set(0);
    y.set(0);
    scale.set(1.02);
    setTimeout(() => scale.set(1), 200);
  }, [minimized, x, y, scale]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    scale.set(1.01);
  }, [scale]);

  const handleDrag = useCallback((event, info) => {
    const tiltX = -info.velocity.y * 0.01;
    const tiltY = info.velocity.x * 0.01;
    rotateX.set(Math.max(-3, Math.min(3, tiltX)));
    rotateY.set(Math.max(-3, Math.min(3, tiltY)));
  }, [rotateX, rotateY]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }, [scale, rotateX, rotateY]);

  const quotes = [
    "Consistency is key, boss! Roz 2 task or 1 solid problem solve karo!",
    "Streak todna paap hai! Keep grinding!",
    "Aag laga denge! Maintain the streak!",
    "Rukna nahi hai! Keep rocking!",
    "Roz thoda thoda! Drop by drop makes an ocean!",
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={constraintsRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[110] flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
        style={{ perspective: 1200 }}
      >
        <style>{`
          .traffic-group:hover .dot-close,
          .traffic-group:hover .dot-minimize,
          .traffic-group:hover .dot-maximize {
            animation: wobble 0.5s ease-in-out;
          }
          .traffic-group:hover .dot-close { animation-delay: 0s; }
          .traffic-group:hover .dot-minimize { animation-delay: 0.05s; }
          .traffic-group:hover .dot-maximize { animation-delay: 0.1s; }
          .traffic-group:hover .dot-icon { opacity: 1; }
          .dot-icon { opacity: 0; transition: opacity 0.15s; }
          @keyframes wobble {
            0% { transform: scale(1) rotate(0deg); }
            20% { transform: scale(1.15) rotate(-8deg); }
            40% { transform: scale(1.05) rotate(6deg); }
            60% { transform: scale(1.1) rotate(-4deg); }
            80% { transform: scale(1.02) rotate(2deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
          .code-window { transition: width 0.3s ease, max-height 0.3s ease; }
          .code-window.maximized {
            width: 100vw !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            height: 100vh !important;
            border-radius: 0 !important;
          }
          .titlebar-drag { cursor: grab; user-select: none; }
          .titlebar-drag:active { cursor: grabbing; }
        `}</style>

        <motion.div
          drag={!maximized}
          dragConstraints={constraintsRef}
          dragElastic={0.08}
          dragMomentum={true}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.88, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className={`code-window flex flex-col overflow-hidden ${maximized ? 'maximized' : 'rounded-2xl'}`}
          style={{
            x,
            y,
            scale,
            rotateX,
            rotateY,
            width: maximized ? '100vw' : '450px',
            maxWidth: '100%',
            height: maximized ? '100vh' : 'auto',
            maxHeight: maximized ? '100vh' : '85vh',
            boxShadow: isDragging
              ? '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)'
              : '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex-1 flex flex-col min-h-0"
            style={{ background: '#1a1b26' }}
          >
            {/* Title Bar */}
            <div
              className="titlebar-drag flex items-center justify-between px-4 py-3 border-b shrink-0 relative"
              style={{
                background: 'linear-gradient(180deg, #2a2b3d 0%, #1e1f31 100%)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
              onDoubleClick={handleMaximize}
            >
              {/* Traffic lights */}
              <div className="traffic-group flex items-center gap-2 relative z-10 w-1/3" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  onClick={onClose}
                  className="dot-close w-3.5 h-3.5 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all flex items-center justify-center relative"
                >
                  <X size={8} className="dot-icon text-black/50" />
                </button>
                <button
                  onClick={handleMinimize}
                  className="dot-minimize w-3.5 h-3.5 rounded-full bg-[#FFBD2E] hover:brightness-90 transition-all flex items-center justify-center relative"
                >
                  <Minus size={8} className="dot-icon text-black/50" />
                </button>
                <button
                  onClick={handleMaximize}
                  className="dot-maximize w-3.5 h-3.5 rounded-full bg-[#28C940] hover:brightness-90 transition-all flex items-center justify-center relative"
                >
                  <Maximize2 size={8} className="dot-icon text-black/50" />
                </button>
              </div>

              {/* Title */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[13px] font-semibold text-[#a9b1d6] flex items-center gap-1.5">
                  <Flame size={12} className="text-orange-500" />
                  streak_engine.sh
                </span>
              </div>
              <div className="w-1/3"></div>
            </div>

            {/* Content Body */}
            <div 
                className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 min-h-0 custom-scrollbar relative"
                style={{ display: minimized ? 'none' : 'block' }}
            >
              {/* Glow effects in background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

              {/* Stats Section */}
              <div className="flex justify-around items-center relative z-10">
                {/* Subtle connecting line */}
                <div className="absolute top-1/2 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-dark-700 to-transparent"></div>
                
                <div className="flex flex-col items-center gap-1 bg-[#1e1f31] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] w-[120px] shadow-lg">
                  <div className="p-2 rounded-full bg-orange-500/10 mb-1">
                    <Flame size={20} className="text-orange-500" />
                  </div>
                  <p className="text-4xl font-black text-white">{streak?.currentStreak || 0}</p>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Current</p>
                </div>
                
                <div className="flex flex-col items-center gap-1 bg-[#1e1f31] p-4 rounded-2xl border border-[rgba(255,255,255,0.06)] w-[120px] shadow-lg">
                  <div className="p-2 rounded-full bg-yellow-500/10 mb-1">
                    <Trophy size={20} className="text-yellow-500" />
                  </div>
                  <p className="text-4xl font-black text-white">{streak?.longestStreak || 0}</p>
                  <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Best</p>
                </div>
              </div>

              {/* Rules Section */}
              <div className="bg-[#1e1f31]/80 border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 shadow-lg relative z-10">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Info size={16} className="text-emerald-400" />
                  How to maintain it:
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-[#2a2b3d] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.06)]">
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                    <p className="text-sm text-[#a9b1d6] leading-relaxed">
                      Complete <strong className="text-white">at least 2 tasks</strong> from your daily task list on the same day.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-px bg-[rgba(255,255,255,0.06)] flex-1"></div>
                    <span className="text-[10px] font-black text-[#a9b1d6]/50 tracking-widest">OR</span>
                    <div className="h-px bg-[rgba(255,255,255,0.06)] flex-1"></div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="mt-1 w-6 h-6 rounded-full bg-[#2a2b3d] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.06)]">
                      <span className="text-xs font-bold text-white">2</span>
                    </div>
                    <p className="text-sm text-[#a9b1d6] leading-relaxed">
                      Solve a problem and attach <strong className="text-white">both your code and notes</strong> to it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote Section */}
              <div className="relative group cursor-pointer z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-50"></div>
                <div className="relative bg-[#1e1f31]/90 backdrop-blur-md p-5 rounded-2xl border border-emerald-500/20 text-center overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-5 rotate-[-15deg]">
                    <Sparkles size={80} />
                  </div>
                  <p className="text-emerald-400 font-medium italic relative z-10 text-[15px] leading-relaxed">
                    "{randomQuote}"
                  </p>
                </div>
              </div>
              
              <div className="pt-2 relative z-10">
                <button
                  onClick={onRefresh}
                  className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakModal;
