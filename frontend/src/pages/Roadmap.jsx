import { useState, useEffect } from 'react';
import { useRoadmapStore } from '../store/roadmapStore';
import { WORLDS } from '../data/roadmapData';
import ProgressHUD from '../components/roadmap/ProgressHUD';
import WorldMap from '../components/roadmap/WorldMap';
import WorldModal from '../components/roadmap/WorldModal';
import WorldClearedOverlay from '../components/roadmap/WorldClearedOverlay';
import FloatingParticles from '../components/roadmap/FloatingParticles';
import AnimatedBackground from '../components/roadmap/AnimatedBackground';
import AmbientAudio from '../components/roadmap/AmbientAudio';
import { AnimatePresence } from 'framer-motion';

const Roadmap = () => {
  const { 
    activeWorldId, 
    setActiveWorldId, 
    unlockedWorlds = ['arrays'],
    isAudioMuted = false,
    selectedAudioTrack,
    unlockedAudioTracks = []
  } = useRoadmapStore();

  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [clearedWorld, setClearedWorld] = useState(null);
  
  const AVAILABLE_AUDIO_KEYS = ['arrays', 'two-pointers', 'sliding-window', 'stacks', 'linked-lists', 'trees', 'graphs'];

  // Track currently scrolled/visible world zone
  const safeUnlocked = unlockedWorlds || ['arrays'];
  const highestUnlocked = safeUnlocked.length > 0 ? safeUnlocked[safeUnlocked.length - 1] : 'arrays';
  const [visibleWorldId, setVisibleWorldId] = useState(highestUnlocked);

  // Find the highest unlocked world that actually has an audio file
  const getFallbackAudioId = () => {
    for (let i = WORLDS.length - 1; i >= 0; i--) {
      const wId = WORLDS[i].id;
      const isUnlocked = safeUnlocked.includes(wId) || unlockedAudioTracks.includes(wId);
      if (isUnlocked && AVAILABLE_AUDIO_KEYS.includes(wId)) {
        return wId;
      }
    }
    return 'arrays'; // absolute fallback
  };
  const fallbackAudioId = getFallbackAudioId();

  // Synchronize initial visible world state with highest unlocked
  useEffect(() => {
    if (highestUnlocked && !visibleWorldId) {
      setVisibleWorldId(highestUnlocked);
    }
  }, [highestUnlocked]);

  // Determine current active theme based on scrolled world, selected world, or highest unlocked world
  const getActiveWorldTheme = () => {
    const currentId = selectedWorldId || activeWorldId || visibleWorldId || highestUnlocked;
    const world = WORLDS.find((w) => w.id === currentId);
    return world ? world.theme : WORLDS[0].theme;
  };

  const activeTheme = getActiveWorldTheme();

  // Scroll to the highest unlocked world on first mount
  useEffect(() => {
    const safeUnlocked = unlockedWorlds || ['arrays'];
    const highestUnlocked = safeUnlocked.length > 0 ? safeUnlocked[safeUnlocked.length - 1] : 'arrays';
    if (highestUnlocked) {
      setTimeout(() => {
        const activeNode = document.getElementById(`node-world-${highestUnlocked}`);
        if (activeNode) {
          activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [unlockedWorlds]);

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

    // Immediately switch theme to the next world after completion
    const currentIdx = WORLDS.findIndex((w) => w.id === world.id);
    const nextWorld = WORLDS[currentIdx + 1];
    if (nextWorld) {
      setVisibleWorldId(nextWorld.id);
    }
  };

  return (
    <div 
      className="relative flex-1 overflow-hidden flex flex-col transition-all duration-1000 -mx-2.5 -mt-2.5 -mb-24 sm:-mx-4 sm:-mt-4 sm:-mb-24 md:-mx-6 md:-mt-6 md:-mb-6 lg:-mx-8 lg:-mt-8 lg:-mb-8"
      style={{
        background: `linear-gradient(180deg, ${activeTheme.bgColor || '#0f172a'} 0%, #020617 100%)`
      }}
    >
      {/* Dynamic Animated Background Overlays (Lightning, Fog, Aurora, Nebula) */}
      <AnimatedBackground activeWorldId={visibleWorldId || 'arrays'} />

      {/* Crossfaded Lazy Ambient Audio Soundtrack Manager */}
      <AmbientAudio activeWorldId={selectedAudioTrack || ((unlockedWorlds.includes(visibleWorldId) || unlockedAudioTracks.includes(visibleWorldId)) && AVAILABLE_AUDIO_KEYS.includes(visibleWorldId) ? visibleWorldId : fallbackAudioId)} isMuted={isAudioMuted} />

      {/* Dynamic Colored Ambient Radial Light Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-30 transition-all duration-1000"
        style={{ background: activeTheme.bgOverlay }}
      />

      {/* Floating Canvas-Based Particle Layer with adaptive shapes and colors */}
      <FloatingParticles 
        colors={activeTheme.particleColors} 
        count={35} 
        activeWorldId={visibleWorldId || 'arrays'} 
      />

      {/* Sticky Progress HUD Banner */}
      <ProgressHUD />

      {/* Main Winding Road Scrollable Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 py-6">
        <WorldMap 
          onSelectWorld={handleSelectWorld} 
          onActiveWorldChange={setVisibleWorldId}
        />
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
