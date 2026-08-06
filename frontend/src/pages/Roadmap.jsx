import { useState, useEffect } from 'react';
import { useRoadmapStore } from '../store/roadmapStore';
import { WORLDS } from '../data/roadmapData';
import ProgressHUD from '../components/roadmap/ProgressHUD';
import WorldMap from '../components/roadmap/WorldMap';
import WorldModal from '../components/roadmap/WorldModal';
import WorldClearedOverlay from '../components/roadmap/WorldClearedOverlay';
import FloatingParticles from '../components/roadmap/FloatingParticles';
import { AnimatePresence } from 'framer-motion';

const Roadmap = () => {
  const { 
    activeWorldId, 
    setActiveWorldId, 
    unlockedWorlds 
  } = useRoadmapStore();

  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [clearedWorld, setClearedWorld] = useState(null);

  // Determine current active theme based on selected world, or highest unlocked world
  const getActiveWorldTheme = () => {
    const currentId = selectedWorldId || activeWorldId || unlockedWorlds[unlockedWorlds.length - 1] || 'arrays';
    const world = WORLDS.find((w) => w.id === currentId);
    return world ? world.theme : WORLDS[0].theme;
  };

  const activeTheme = getActiveWorldTheme();

  // Scroll to the highest unlocked world on first mount
  useEffect(() => {
    const highestUnlocked = unlockedWorlds[unlockedWorlds.length - 1];
    if (highestUnlocked) {
      setTimeout(() => {
        const activeNode = document.getElementById(`node-world-${highestUnlocked}`);
        if (activeNode) {
          activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, []);

  const handleSelectWorld = (worldId) => {
    setSelectedWorldId(worldId);
    setActiveWorldId(worldId);
  };

  const handleCloseModal = () => {
    setSelectedWorldId(null);
    setActiveWorldId(null);
  };

  const handleCompleteWorld = (world) => {
    setSelectedWorldId(null);
    setActiveWorldId(null);
    setClearedWorld(world);
  };

  return (
    <div 
      className="relative min-h-[calc(100vh-88px)] w-full overflow-hidden flex flex-col transition-all duration-1000"
      style={{
        background: `linear-gradient(180deg, ${activeTheme.gradient.split(' ')[1] || '#020617'} 0%, #020617 100%)`
      }}
    >
      {/* Dynamic Colored Ambient Radial Light Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30 transition-all duration-1000"
        style={{ background: activeTheme.bgOverlay }}
      />

      {/* Floating Canvas-Based Particle Layer */}
      <FloatingParticles colors={activeTheme.particleColors} count={50} />

      {/* Sticky Progress HUD Banner */}
      <ProgressHUD />

      {/* Main Winding Road Scrollable Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 py-6">
        <WorldMap onSelectWorld={handleSelectWorld} />
      </div>

      {/* ── Interactive World Node Modal Overlay ── */}
      <AnimatePresence>
        {selectedWorldId && (
          <WorldModal
            worldId={selectedWorldId}
            onClose={handleCloseModal}
            onCompleteWorld={handleCompleteWorld}
          />
        )}
      </AnimatePresence>

      {/* ── World Cleared Victory Celebration Overlay ── */}
      <AnimatePresence>
        {clearedWorld && (
          <WorldClearedOverlay
            world={clearedWorld}
            onClose={() => setClearedWorld(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Roadmap;
