import { useEffect, useState } from 'react';
import { useRoadmapStore } from '../../store/roadmapStore';
import { WORLDS } from '../../data/roadmapData';

const AnimatedBackground = ({ activeWorldId }) => {
  const [lightningActive, setLightningActive] = useState(false);
  const [leafParticles] = useState(() => {
    return Array.from({ length: 22 }).map((_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = 10 + Math.random() * 10;
      const size = 6 + Math.random() * 22; // 6px to 28px (some big ones!)
      const opacity = 0.1 + Math.random() * 0.25;
      const driftSweep = -80 + Math.random() * 180; // -80px to 100px sweep
      const rotateDeg = Math.random() > 0.5 ? 360 + Math.random() * 360 : -(360 + Math.random() * 360);
      const blur = size > 20 ? '1px' : '0px';

      return {
        id: i,
        style: {
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          width: `${size}px`,
          height: `${size}px`,
          filter: blur !== '0px' ? `blur(${blur})` : 'none',
          '--leaf-op': opacity,
          '--leaf-drift': `${driftSweep}px`,
          '--leaf-rot': `${rotateDeg}deg`
        }
      };
    });
  });
  const isAudioMuted = useRoadmapStore((state) => state.isAudioMuted);

  const world = WORLDS.find((w) => w.id === activeWorldId) || WORLDS[0];
  const themeColor = world?.theme?.nodeColor || '#3b82f6';

  // Lightning effect for Heap Castle
  useEffect(() => {
    if (activeWorldId !== 'heaps') {
      setLightningActive(false);
      return;
    }

    const triggerLightning = () => {
      setLightningActive(true);
      const flashDuration = Math.random() * 200 + 100; // 100-300ms
      setTimeout(() => {
        setLightningActive(false);
      }, flashDuration);
    };

    // Random interval between lightning flashes (4s - 12s)
    const intervalId = setInterval(() => {
      if (Math.random() > 0.4) {
        triggerLightning();
        // Double flash chance!
        if (Math.random() > 0.6) {
          setTimeout(triggerLightning, 300);
        }
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [activeWorldId]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* ── Music Playing Bars (Equalizers) ── */}
      <div 
        className="fixed bottom-6 left-6 flex items-end gap-0.5 h-16 transition-all duration-1000 z-10 select-none opacity-20 hidden md:flex"
        style={{ opacity: isAudioMuted ? 0.02 : 0.22 }}
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const animIndex = (i % 5) + 1;
          const delay = (i * 0.15).toFixed(2);
          const duration = (0.8 + (i % 3) * 0.35).toFixed(2);
          return (
            <div 
              key={`eq-l-${i}`}
              className="w-1 rounded-full"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 0 8px ${themeColor}`,
                animation: isAudioMuted ? 'none' : `eqBar${animIndex} ${duration}s ease-in-out infinite alternate`,
                animationDelay: `${delay}s`,
                height: isAudioMuted ? '4px' : '100%',
                transition: 'height 0.8s ease-in-out'
              }}
            />
          );
        })}
      </div>

      <div 
        className="fixed bottom-6 right-6 flex items-end gap-0.5 h-16 transition-all duration-1000 z-10 select-none opacity-20 hidden md:flex"
        style={{ opacity: isAudioMuted ? 0.02 : 0.22 }}
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const animIndex = ((i + 2) % 5) + 1;
          const delay = (i * 0.12).toFixed(2);
          const duration = (0.7 + (i % 4) * 0.25).toFixed(2);
          return (
            <div 
              key={`eq-r-${i}`}
              className="w-1 rounded-full"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 0 8px ${themeColor}`,
                animation: isAudioMuted ? 'none' : `eqBar${animIndex} ${duration}s ease-in-out infinite alternate`,
                animationDelay: `${delay}s`,
                height: isAudioMuted ? '4px' : '100%',
                transition: 'height 0.8s ease-in-out'
              }}
            />
          );
        })}
      </div>

      {/* ── Lightning Overlay for Heap Castle ── */}
      <div 
        className={`absolute inset-0 bg-white transition-opacity duration-75 z-10 ${
          lightningActive ? 'opacity-[0.22]' : 'opacity-0'
        }`}
      />

      {/* ── Parallax Fog Sheets & Falling Leaves for Sliding Window Forest ── */}
      {activeWorldId === 'sliding-window' && (
        <div className="absolute inset-0 opacity-[0.25]">
          <div className="fog-layer fog-layer-1" />
          <div className="fog-layer fog-layer-2" />
          
          {/* Drifting Leaves */}
          <div className="absolute inset-0 overflow-hidden">
            {leafParticles.map((leaf) => (
              <div 
                key={`leaf-${leaf.id}`}
                className="leaf-particle"
                style={leaf.style}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Aurora Borealis & Frost for Binary Search Mountain ── */}
      {activeWorldId === 'binary-search' && (
        <div className="absolute inset-0 opacity-[0.4]">
          <div className="aurora-glow" style={{ background: 'linear-gradient(120deg, rgba(56,189,248,0) 20%, rgba(56,189,248,0.15) 40%, rgba(14,165,233,0.15) 60%, rgba(56,189,248,0) 80%)' }} />
          <div className="frost-overlay" />
        </div>
      )}

      {/* ── Lava Flow for Linked List River ── */}
      {activeWorldId === 'linked-lists' && (
        <div className="absolute inset-0 opacity-[0.25]">
          <div className="lava-flow" />
        </div>
      )}

      {/* ── Nebula Space Loop for Graph Island ── */}
      {activeWorldId === 'graphs' && (
        <div className="absolute inset-0 opacity-[0.4]">
          <div className="nebula-cloud nebula-magenta" />
          <div className="nebula-cloud nebula-cyan" />
        </div>
      )}

      {/* ── Prismatic Shimmer for Advanced Citadel ── */}
      {activeWorldId === 'advanced' && (
        <div className="absolute inset-0 prismatic-overlay opacity-[0.15]" />
      )}

      {/* ── Dynamic Ambient Keyframe Animations ── */}
      <style>{`
        /* Fog Layers Parallax */
        .fog-layer {
          position: absolute;
          width: 200%;
          height: 100%;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='600' viewBox='0 0 1000 600'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='1 0 0 0 0.08 0 1 0 0 0.31 0 0 1 0 0.29 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='1000' height='600' filter='url(%23a)' opacity='0.3'/%3E%3C/svg%3E") repeat;
          top: 0;
          left: 0;
          mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%);
          -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 100%);
        }
        .fog-layer-1 {
          animation: fogMove 80s linear infinite;
        }
        .fog-layer-2 {
          animation: fogMove 50s linear reverse infinite;
          opacity: 0.7;
        }
        @keyframes fogMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* Aurora Borealis Glow */
        .aurora-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, rgba(16,185,129,0) 20%, rgba(16,185,129,0.15) 40%, rgba(59,130,246,0.15) 60%, rgba(59,130,246,0) 80%);
          filter: blur(80px);
          animation: auroraWave 12s ease-in-out infinite alternate;
        }
        @keyframes auroraWave {
          0% { transform: scale(1) translateY(-5%); opacity: 0.5; }
          100% { transform: scale(1.15) translateY(5%); opacity: 1; }
        }

        /* Space Nebula Clouds */
        .nebula-cloud {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          filter: blur(120px);
          mix-blend-mode: screen;
          opacity: 0.5;
        }
        .nebula-magenta {
          background: radial-gradient(circle, rgba(219,39,119,0.3) 0%, transparent 70%);
          top: 10%;
          left: 20%;
          animation: floatNebula 25s ease-in-out infinite alternate;
        }
        .nebula-cyan {
          background: radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%);
          bottom: 20%;
          right: 20%;
          animation: floatNebula 30s ease-in-out infinite alternate-reverse;
        }
        @keyframes floatNebula {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(80px, 40px) scale(1.2); }
        }

        /* Prismatic Shimmer Overlay */
        .prismatic-overlay {
          inset: 0;
          background: linear-gradient(45deg, #ec4899, #8b5cf6, #3b82f6, #10b981);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Chilling Frost/Glacier Overlay */
        .frost-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 30%, rgba(186, 230, 253, 0.18) 0%, transparent 60%);
          animation: frostPulse 8s ease-in-out infinite alternate;
        }
        @keyframes frostPulse {
          0% { opacity: 0.4; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.08); }
        }

        /* Molten Lava Flow Animation */
        .lava-flow {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.12) 50%, rgba(220, 38, 38, 0.2) 100%);
          background-size: 100% 200%;
          animation: lavaFlowAnimation 8s ease-in-out infinite alternate;
          filter: blur(35px);
        }
        @keyframes lavaFlowAnimation {
          0% { background-position: 50% 0%; }
          100% { background-position: 50% 100%; }
        }

        /* Music Equalizer Bouncing Keyframes */
        @keyframes eqBar1 {
          0% { height: 10%; }
          100% { height: 75%; }
        }
        @keyframes eqBar2 {
          0% { height: 25%; }
          100% { height: 60%; }
        }
        @keyframes eqBar3 {
          0% { height: 15%; }
          100% { height: 95%; }
        }
        @keyframes eqBar4 {
          0% { height: 35%; }
          100% { height: 80%; }
        }
        @keyframes eqBar5 {
          0% { height: 8%; }
          100% { height: 50%; }
        }

        /* Falling Leaf Particles for Sliding Window Forest */
        .leaf-particle {
          position: absolute;
          top: -30px;
          background: #4ade80;
          border-radius: 0 100%;
          transform-origin: center;
          animation: leafDrift 14s linear infinite;
          box-shadow: 0 0 5px rgba(74, 222, 128, 0.4);
        }
        @keyframes leafDrift {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: var(--leaf-op, 0.25);
          }
          90% {
            opacity: var(--leaf-op, 0.25);
          }
          100% {
            transform: translateY(105vh) rotate(var(--leaf-rot, 360deg)) translateX(var(--leaf-drift, 80px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;
