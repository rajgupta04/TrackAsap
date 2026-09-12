import React from 'react';
import { motion } from 'framer-motion';

export const AudioWaveform = ({ isActive = false, color = '#39ff14', barCount = 18 }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-16 px-4">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full"
          style={{ backgroundColor: color }}
          animate={
            isActive
              ? {
                  height: [
                    '8px',
                    `${Math.max(12, Math.sin(i + Date.now() / 200) * 45 + 15)}px`,
                    `${Math.max(10, Math.cos(i + Date.now() / 150) * 35 + 10)}px`,
                    '8px',
                  ],
                  opacity: [0.6, 1, 0.8, 0.6],
                }
              : {
                  height: '6px',
                  opacity: 0.3,
                }
          }
          transition={{
            duration: 0.6 + (i % 4) * 0.15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: (i % 5) * 0.08,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
