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
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Roadmap = () => {
  const { isAuthenticated } = useAuthStore();
  const { 
    activeWorldId, 
    setActiveWorldId, 
    unlockedWorlds = ['arrays'],
    isAudioMuted = false,
    toggleAudioMute,
    selectedAudioTrack,
    setSelectedAudioTrack,
    unlockedAudioTracks = [],
    loadFromServer,
    worlds = WORLDS,
  } = useRoadmapStore();

  // Sync progress from server on mount
  useEffect(() => {
    loadFromServer();
  }, []);

  const [selectedWorldId, setSelectedWorldId] = useState(null);
  const [clearedWorld, setClearedWorld] = useState(null);
  
  const AVAILABLE_AUDIO_KEYS = ['arrays', 'two-pointers', 'sliding-window', 'stacks', 'linked-lists', 'trees', 'graphs'];

  // Build list of unlocked audio tracks for keyboard navigation
  const safeUnlocked = unlockedWorlds || ['arrays'];
  const unlockedAudioList = AVAILABLE_AUDIO_KEYS.filter(
    key => safeUnlocked.includes(key) || unlockedAudioTracks.includes(key)
  );

  // Keyboard shortcuts for music control
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input/textarea or a modal is open
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (selectedWorldId) return; // modal open, skip shortcuts

      const key = e.key.toLowerCase();

      if (key === 'm') {
        e.preventDefault();
        toggleAudioMute();
      } else if (key === 'arrowright' || key === 'n') {
        e.preventDefault();
        if (unlockedAudioList.length === 0) return;
        const currentTrack = selectedAudioTrack || unlockedAudioList[0];
        const currentIdx = unlockedAudioList.indexOf(currentTrack);
        const nextIdx = (currentIdx + 1) % unlockedAudioList.length;
        setSelectedAudioTrack(unlockedAudioList[nextIdx]);
      } else if (key === 'arrowleft' || key === 'p') {
        e.preventDefault();
        if (unlockedAudioList.length === 0) return;
        const currentTrack = selectedAudioTrack || unlockedAudioList[0];
        const currentIdx = unlockedAudioList.indexOf(currentTrack);
        const prevIdx = (currentIdx - 1 + unlockedAudioList.length) % unlockedAudioList.length;
        setSelectedAudioTrack(unlockedAudioList[prevIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAudioMute, selectedAudioTrack, setSelectedAudioTrack, unlockedAudioList, selectedWorldId]);
  const highestUnlocked = safeUnlocked.length > 0 ? safeUnlocked[safeUnlocked.length - 1] : 'arrays';
  const [visibleWorldId, setVisibleWorldId] = useState(highestUnlocked);

  // Find the highest unlocked world that actually has an audio file
  const getFallbackAudioId = () => {
    const activeWorlds = worlds || WORLDS;
    for (let i = activeWorlds.length - 1; i >= 0; i--) {
      const wId = activeWorlds[i].id;
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
    const activeWorlds = worlds || WORLDS;
    const currentId = selectedWorldId || activeWorldId || visibleWorldId || highestUnlocked;
    const world = activeWorlds.find((w) => w.id === currentId);
    return world ? world.theme : activeWorlds[0]?.theme || WORLDS[0].theme;
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
      className="relative h-full flex-1 overflow-hidden flex flex-col transition-all duration-1000 -mx-2.5 -mt-2.5 -mb-24 sm:-mx-4 sm:-mt-4 sm:-mb-24 md:-mx-6 md:-mt-6 md:-mb-6 lg:-mx-8 lg:-mt-8 lg:-mb-8"
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

      {/* Main Scrollable Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        {/* Guest Preview Notice */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-cyan-500/15 via-neon-green/15 to-purple-500/15 border-b border-cyan-500/30 px-4 py-2.5 flex items-center justify-between gap-3 text-xs sticky top-0 z-30 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
              <span className="text-gray-300 truncate">
                <strong className="text-white font-semibold">World Map Preview:</strong> Explore worlds, problems & music tracks.
              </span>
            </div>
            <Link
              to="/register"
              className="shrink-0 px-3 py-1 bg-neon-green text-dark-950 font-bold rounded-lg hover:bg-neon-green/90 transition-all text-[11px] shadow-sm"
            >
              Sign Up to Save Progress
            </Link>
          </div>
        )}

        {/* Sticky Progress HUD Banner */}
        <ProgressHUD />

        {/* Winding Road World Map */}
        <div className="py-6">
          <WorldMap 
            onSelectWorld={handleSelectWorld} 
            onActiveWorldChange={setVisibleWorldId}
          />
        </div>
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
