import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Volume2 } from 'lucide-react';

/**
 * RabbitAvatar
 *
 * Clean, high-performance avatar card rendering the official TrackAsap Mascot Rabbit (/assets/avatar/rabbit.png)
 * with dynamic multi-panel interviewer themes (Alex, Dr. Bella, Marcus, Sophia) and audio-reactive animations.
 */
export default function RabbitAvatar({
  isAISpeaking = false,
  isCandidateSpeaking = false,
  panelist = null,
}) {
  const activeColor = panelist?.color || '#39ff14';
  const glowColor = panelist?.glowColor || 'rgba(57, 255, 20, 0.45)';
  const activeName = panelist?.name || 'TrackAsap AI';
  const activeBadge = panelist?.badge || 'INTERVIEWER';
  const activeEmoji = panelist?.avatarEmoji || '🐰';

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-sm mx-auto select-none">
      {/* Background Cyberpunk Ambient Glow Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Speaking Panelist Glow Aura */}
        <motion.div
          className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: activeColor }}
          animate={
            isAISpeaking
              ? { scale: [1, 1.45, 1], opacity: [0.35, 0.8, 0.35] }
              : isCandidateSpeaking
              ? { scale: 0.9, opacity: 0.08 }
              : { scale: 1, opacity: 0.16 }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Listening Electric-Blue Aura */}
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-blue-500/30 blur-3xl pointer-events-none"
          animate={
            isCandidateSpeaking
              ? { scale: [1, 1.4, 1], opacity: [0.45, 0.9, 0.45] }
              : { scale: 0.8, opacity: 0 }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Concentric Soundwave Ripple Rings */}
        <AnimatePresence>
          {isAISpeaking && (
            <>
              {[0, 1, 2].map((ring) => (
                <motion.div
                  key={`speak-ring-${ring}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{ borderColor: activeColor, borderWidth: 1 }}
                  initial={{ width: 160, height: 160, opacity: 0.9 }}
                  animate={{
                    width: [160, 300 + ring * 45],
                    height: [160, 300 + ring * 45],
                    opacity: [0.75, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: ring * 0.65,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}

          {isCandidateSpeaking && (
            <>
              {[0, 1].map((ring) => (
                <motion.div
                  key={`listen-ring-${ring}`}
                  className="absolute rounded-full border border-blue-400/50 pointer-events-none"
                  initial={{ width: 160, height: 160, opacity: 0.8 }}
                  animate={{
                    width: [160, 280 + ring * 40],
                    height: [160, 280 + ring * 40],
                    opacity: [0.65, 0],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    delay: ring * 0.5,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main Avatar Stage Card */}
      <div
        className="relative z-10 w-64 h-72 sm:w-72 sm:h-80 rounded-3xl p-3 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-2xl border"
        style={{
          borderColor: isAISpeaking
            ? activeColor
            : isCandidateSpeaking
            ? '#60a5fa'
            : 'rgba(255, 255, 255, 0.1)',
          backgroundColor: isAISpeaking || isCandidateSpeaking ? 'rgba(24, 24, 27, 0.9)' : 'rgba(24, 24, 27, 0.6)',
          boxShadow: isAISpeaking
            ? `0 0 50px ${glowColor}`
            : isCandidateSpeaking
            ? '0 0 50px rgba(96, 165, 250, 0.3)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transform: isAISpeaking ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {/* Top Header Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-950/85 border border-white/10 text-xs text-dark-200 font-medium backdrop-blur-md">
            <span className="text-sm">{activeEmoji}</span>
            <span className="font-semibold text-white tracking-tight">{activeName}</span>
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: isAISpeaking ? activeColor : isCandidateSpeaking ? '#60a5fa' : '#71717a' }}
            />
          </div>

          <span
            className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border transition-colors duration-300"
            style={{
              color: activeColor,
              borderColor: `${activeColor}40`,
              backgroundColor: `${activeColor}15`,
            }}
          >
            {activeBadge}
          </span>
        </div>

        {/* Mascot Character Image Container */}
        <motion.div
          className="relative w-48 h-56 sm:w-56 sm:h-64 flex items-center justify-center mt-3"
          animate={
            isAISpeaking
              ? {
                  y: [0, -6, 0],
                  scale: [1, 1.03, 1],
                }
              : isCandidateSpeaking
              ? {
                  y: [0, -3, 0],
                }
              : {
                  y: [0, -4, 0],
                }
          }
          transition={{
            duration: isAISpeaking ? 1.0 : isCandidateSpeaking ? 1.8 : 3.0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <img
            src="/assets/avatar/rabbit.png"
            alt="TrackAsap Mascot Rabbit"
            className="w-full h-full object-contain transition-all duration-300 select-none"
            style={{
              filter: isAISpeaking
                ? `drop-shadow(0 0 30px ${glowColor})`
                : isCandidateSpeaking
                ? 'drop-shadow(0 0 25px rgba(96, 165, 250, 0.5))'
                : 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.7))',
            }}
          />
        </motion.div>

        {/* Bottom Speaking / Listening Pill */}
        <div className="absolute bottom-3 flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-dark-950/90 border border-white/10 text-xs backdrop-blur-md shadow-lg z-20">
          {isAISpeaking ? (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-pulse" style={{ color: activeColor }} />
              <span className="font-semibold tracking-wide" style={{ color: activeColor }}>
                {panelist?.shortName || 'AI'} is speaking...
              </span>
            </>
          ) : isCandidateSpeaking ? (
            <>
              <Mic className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
              <span className="text-blue-400 font-semibold tracking-wide">Listening to you...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-dark-400" />
              <span className="text-dark-300 font-medium">Ready</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
