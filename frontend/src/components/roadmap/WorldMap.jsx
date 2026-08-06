import { useState, useEffect, useRef } from 'react';
import { useRoadmapStore } from '../../store/roadmapStore';
import { WORLDS } from '../../data/roadmapData';
import WorldNode from './WorldNode';
import { Sparkles } from 'lucide-react';

const WorldMap = ({ onSelectWorld, onActiveWorldChange }) => {
  const { 
    completedWorlds = [], 
    unlockedWorlds = ['arrays'], 
    getWorldProgress, 
    justCompletedWorldId,
    clearJustCompletedWorld
  } = useRoadmapStore();

  const containerRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});
  const [activeSparkleSegment, setActiveSparkleSegment] = useState(null);

  // Measure node positions in parent coordinate space
  const measureNodes = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const positions = {};

    WORLDS.forEach((world) => {
      const nodeEl = document.getElementById(`node-world-${world.id}`);
      if (nodeEl) {
        const nodeRect = nodeEl.getBoundingClientRect();
        // Calculate center of node relative to container
        positions[world.id] = {
          x: nodeRect.left - containerRect.left + nodeRect.width / 2,
          y: nodeRect.top - containerRect.top + nodeRect.height / 2
        };
      }
    });

    setNodePositions(positions);
  };

  useEffect(() => {
    // Measure on mount, window resize, and a short delay to account for loading/rendering
    measureNodes();
    window.addEventListener('resize', measureNodes);

    const timer = setTimeout(measureNodes, 300);
    return () => {
      window.removeEventListener('resize', measureNodes);
      clearTimeout(timer);
    };
  }, []);

  // IntersectionObserver to detect which world is currently in the middle of the viewport
  useEffect(() => {
    if (!onActiveWorldChange) return;

    const observerOptions = {
      root: null,
      rootMargin: '-35% 0px -35% 0px', // focused around the center of the scroll container
      threshold: 0.1
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const worldId = entry.target.getAttribute('data-world-id');
          if (worldId) {
            onActiveWorldChange(worldId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    WORLDS.forEach((world) => {
      const el = document.getElementById(`world-zone-${world.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [onActiveWorldChange]);

  // Handle justCompletedWorldId animation trigger
  useEffect(() => {
    if (justCompletedWorldId) {
      const worldIdx = WORLDS.findIndex((w) => w.id === justCompletedWorldId);
      const nextWorld = WORLDS[worldIdx + 1];
      if (nextWorld) {
        // Trigger path sparkle animation to next world
        setActiveSparkleSegment(justCompletedWorldId);
        
        // Auto-scroll to show the next unlocked world
        setTimeout(() => {
          const nextNode = document.getElementById(`node-world-${nextWorld.id}`);
          if (nextNode) {
            nextNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 1500);

        // Clear the just completed trigger after animation finishes
        const timer = setTimeout(() => {
          setActiveSparkleSegment(null);
          clearJustCompletedWorld();
        }, 4000);

        return () => clearTimeout(timer);
      } else {
        clearJustCompletedWorld();
      }
    }
  }, [justCompletedWorldId, clearJustCompletedWorld]);

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col items-center w-full max-w-3xl mx-auto py-12 px-6 min-h-screen pb-24 z-10 select-none"
    >
      {/* ── Background SVG Winding Path Overlay ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          {/* Neon Green Active Gradient */}
          <linearGradient id="activePathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          
          {/* Glow filter for lit paths */}
          <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Draw Path Segments between consecutive nodes */}
        {WORLDS.map((world, idx) => {
          if (idx === WORLDS.length - 1) return null;
          const nextWorld = WORLDS[idx + 1];

          const start = nodePositions[world.id];
          const end = nodePositions[nextWorld.id];

          if (!start || !end) return null;

          const dy = end.y - start.y;
          // Cubic Bezier curve control points creating smooth winding S-curves
          const pathD = `M ${start.x} ${start.y} C ${start.x} ${start.y + dy / 2}, ${end.x} ${start.y + dy / 2}, ${end.x} ${end.y}`;

          const isSourceWorldCompleted = completedWorlds.includes(world.id);
          const isSparkling = activeSparkleSegment === world.id;

          return (
            <g key={`path-segment-${world.id}`}>
              {/* Backing Track (glow or dashed locked road) */}
              <path
                d={pathD}
                fill="none"
                stroke={isSourceWorldCompleted ? 'rgba(57, 255, 20, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                strokeWidth={isSourceWorldCompleted ? 8 : 4}
                className="transition-all duration-1000"
              />

              {/* Foreground Road Path */}
              <path
                d={pathD}
                fill="none"
                stroke={isSourceWorldCompleted ? '#10b981' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={4}
                strokeDasharray={isSourceWorldCompleted ? '0' : '8, 8'}
                className="transition-all duration-1000"
                style={{
                  filter: isSourceWorldCompleted ? 'url(#pathGlow)' : 'none'
                }}
              />

              {/* Sparkle Traveling Pulse Animation */}
              {(isSourceWorldCompleted || isSparkling) && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSparkling ? '#fbbf24' : '#39FF14'}
                  strokeWidth={5}
                  strokeDasharray="30, 150"
                  className="path-pulse-animation"
                  style={{
                    filter: 'url(#pathGlow)',
                    animation: isSparkling 
                      ? 'path-glow-pulse 1.5s linear infinite' 
                      : 'path-glow-pulse 4s linear infinite'
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* CSS Styles for SVG Animations */}
      <style>{`
        @keyframes path-glow-pulse {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        .path-pulse-animation {
          animation: path-glow-pulse 4s linear infinite;
        }
      `}</style>

      {/* ── Rendering World Nodes ── */}
      <div className="flex flex-col w-full relative z-10 gap-1">
        {WORLDS.map((world, idx) => {
          const isUnlocked = unlockedWorlds.includes(world.id);
          const isCompleted = completedWorlds.includes(world.id);
          const progress = getWorldProgress(world.id);

          return (
            <div 
              key={world.id} 
              id={`world-zone-${world.id}`} 
              data-world-id={world.id}
              className="flex flex-col w-full py-16 sm:py-28"
            >
              <WorldNode
                world={world}
                index={idx}
                isUnlocked={isUnlocked}
                isCompleted={isCompleted}
                progress={progress}
                onClick={() => onSelectWorld(world.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorldMap;
