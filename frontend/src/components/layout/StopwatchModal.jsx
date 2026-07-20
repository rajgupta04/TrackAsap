import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Minus, Maximize2, X, Play, Pause, RotateCcw, Clock, Timer, Settings2 } from 'lucide-react';
import { useTimerStore } from '../../store/timerStore';

const AnalogClock = ({ timeMs, mode }) => {
  const safeTimeMs = Number.isNaN(timeMs) || timeMs === undefined ? 0 : timeMs;
  const totalSeconds = Math.floor(safeTimeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  // Calculate angles
  const secondAngle = (seconds / 60) * 360;
  const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6;

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-full border-4 border-dark-700/50 bg-dark-800/50 shadow-2xl flex items-center justify-center">
      {/* Clock Face Markers */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-3 sm:h-4 bg-gray-500/30 rounded-full"
          style={{
            transform: `rotate(${i * 30}deg) translateY(-21px) sm:translateY(-28px)`,
            transformOrigin: '50% 100px sm:130px'
          }}
        />
      ))}
      
      {/* Center Dot */}
      <div className="absolute w-3 h-3 bg-neon-green rounded-full z-20 shadow-[0_0_10px_rgba(57,255,20,0.5)]" />

      {/* Minute Hand */}
      <motion.div
        className="absolute w-1.5 h-16 sm:h-24 bg-gray-300 rounded-full z-10 origin-bottom"
        style={{ rotate: minuteAngle, bottom: '50%' }}
        animate={{ rotate: minuteAngle }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />

      {/* Second Hand */}
      <motion.div
        className="absolute w-1 h-20 sm:h-28 bg-neon-green rounded-full z-10 origin-bottom"
        style={{ rotate: secondAngle, bottom: '50%' }}
        animate={{ rotate: secondAngle }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      />
    </div>
  );
};

const StopwatchModal = ({ isOpen, onClose }) => {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('25');
  const [showSettings, setShowSettings] = useState(false);

  const {
    mode, display, isRunning, duration,
    setMode, setDisplay, setDuration, start, pause, reset, getCurrentTimeMs
  } = useTimerStore();

  const [currentTimeMs, setCurrentTimeMs] = useState(getCurrentTimeMs());

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        const t = getCurrentTimeMs();
        setCurrentTimeMs(t);
        if (mode === 'timer' && t <= 0) {
          pause();
          // Could play sound here
        }
      }, 50);
    } else {
      setCurrentTimeMs(getCurrentTimeMs());
    }
    return () => clearInterval(intervalId);
  }, [isRunning, mode, getCurrentTimeMs, pause]);

  // Sync when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentTimeMs(getCurrentTimeMs());
      x.set(0);
      y.set(0);
    }
  }, [isOpen, getCurrentTimeMs, x, y]);

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

  const formatDigitalTime = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const centi = Math.floor((ms % 1000) / 10);
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${centi.toString().padStart(2, '0')}`;
  };

  const handleSetTimer = (minutes) => {
    const ms = parseInt(minutes) * 60 * 1000;
    if (ms > 0) {
      setDuration(ms);
      setInputMinutes(minutes.toString());
      setShowSettings(false);
      setCurrentTimeMs(ms);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="stopwatch-modal-container"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6" 
          style={{ perspective: 1200 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
            onClick={onClose}
          />
          <div ref={constraintsRef} className="absolute inset-0 pointer-events-none" />
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
            
            @font-face {
              font-family: 'Digital';
              src: url('https://fonts.cdnfonts.com/s/17459/DS-DIGI.woff') format('woff');
            }
            .font-digital {
              font-family: 'Digital', monospace;
            }
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
              className="flex-1 flex flex-col min-h-0 relative"
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
                <div className="flex items-center gap-2 traffic-group relative z-10 w-20">
                  <button
                    onClick={onClose}
                    className="dot-close w-3 h-3 rounded-full bg-red-500 border border-red-600 flex items-center justify-center transition-colors hover:bg-red-600"
                  >
                    <X size={8} className="text-black dot-icon" />
                  </button>
                  <button
                    onClick={handleMinimize}
                    className="dot-minimize w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600 flex items-center justify-center transition-colors hover:bg-yellow-600"
                  >
                    <Minus size={8} className="text-black dot-icon" />
                  </button>
                  <button
                    onClick={handleMaximize}
                    className="dot-maximize w-3 h-3 rounded-full bg-green-500 border border-green-600 flex items-center justify-center transition-colors hover:bg-green-600"
                  >
                    <Maximize2 size={8} className="text-black dot-icon" />
                  </button>
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-semibold text-gray-400 tracking-wide">
                    {mode === 'stopwatch' ? 'Stopwatch' : 'Timer'}
                  </span>
                </div>

                <div className="relative z-10 w-20 flex justify-end gap-2">
                  {mode === 'timer' && (
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <Settings2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
                
                {/* Mode Toggles */}
                <div className="flex justify-center gap-2 mb-8">
                  <div className="bg-dark-800/80 p-1 rounded-lg border border-white/5 flex">
                    <button
                      onClick={() => setMode('stopwatch')}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${mode === 'stopwatch' ? 'bg-neon-green/20 text-neon-green' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Clock size={14} /> Stopwatch
                    </button>
                    <button
                      onClick={() => setMode('timer')}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all ${mode === 'timer' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
                    >
                      <Timer size={14} /> Timer
                    </button>
                  </div>
                </div>

                {/* Settings Panel for Timer */}
                <AnimatePresence>
                  {showSettings && mode === 'timer' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-6 bg-dark-800/50 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-400 mb-2 block">Presets</label>
                          <div className="flex gap-2">
                            {[5, 10, 25, 50].map(m => (
                              <button
                                key={m}
                                onClick={() => handleSetTimer(m)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 font-semibold transition-colors border border-white/10"
                              >
                                {m}m
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-400 mb-2 block">Custom (Minutes)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={inputMinutes}
                              onChange={(e) => setInputMinutes(e.target.value)}
                              className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-white outline-none focus:border-neon-green text-sm"
                            />
                            <button
                              onClick={() => handleSetTimer(inputMinutes)}
                              className="px-4 py-1.5 bg-neon-green/20 text-neon-green hover:bg-neon-green/30 rounded-lg text-sm font-semibold transition-colors"
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Clock Display */}
                <div className="flex flex-col items-center justify-center min-h-[250px] mb-8 relative">
                  {/* View Toggles (overlay) */}
                  <div className="absolute top-0 right-0 flex bg-dark-800/80 rounded-lg p-0.5 border border-white/5 z-20">
                    <button
                      onClick={() => setDisplay('digital')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${display === 'digital' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                    >
                      DIG
                    </button>
                    <button
                      onClick={() => setDisplay('analog')}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${display === 'analog' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                    >
                      ANA
                    </button>
                  </div>

                  {display === 'analog' ? (
                    <AnalogClock timeMs={currentTimeMs} mode={mode} />
                  ) : (
                    <div className="font-digital text-6xl sm:text-7xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tabular-nums">
                      {formatDigitalTime(currentTimeMs)}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={isRunning ? pause : start}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isRunning 
                        ? 'bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'bg-neon-green/20 text-neon-green border border-neon-green/30 hover:bg-neon-green/30 shadow-[0_0_20px_rgba(57,255,20,0.2)]'
                    }`}
                  >
                    {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>

                  <button
                    onClick={reset}
                    className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20 transition-all hover:text-white"
                  >
                    <RotateCcw size={20} />
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

export default StopwatchModal;
