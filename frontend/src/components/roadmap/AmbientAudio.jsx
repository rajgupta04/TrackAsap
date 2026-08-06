import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';

// Audio track config per world ID — lazy loaded on first enter or interaction
const WORLD_AUDIO = {
  arrays:         { src: '/assets/audio/arrays_kingdom.mp3',   volume: 0.35 },
  'two-pointers': { src: '/assets/audio/two_pointer_bridge.mp3', volume: 0.3 },
  'sliding-window': { src: '/assets/audio/sliding_window_forest.mp3', volume: 0.35 },
  stacks:         { src: '/assets/audio/stack_queue_cave.mp3', volume: 0.3 },
  'binary-search': { src: '/assets/audio/binary_search_mountain.mp3', volume: 0.35 },
  'linked-lists': { src: '/assets/audio/linked_list_river.mp3', volume: 0.3 },
  trees:          { src: '/assets/audio/tree_kingdom.mp3',     volume: 0.35 },
  heaps:          { src: '/assets/audio/heap_castle.mp3',      volume: 0.3 },
  graphs:         { src: '/assets/audio/graph_island.mp3',     volume: 0.35 },
  dp:             { src: '/assets/audio/dp_temple.mp3',        volume: 0.35 },
  advanced:       { src: '/assets/audio/crystal_citadel.mp3', volume: 0.4 },
};

const FADE_DURATION = 1500; // ms cross‑fade

const AmbientAudio = ({ activeWorldId, isMuted }) => {
  const currentHowlRef = useRef(null);
  const currentWorldIdRef = useRef(null);
  const howlCacheRef = useRef({}); // lazy cache — only load what's needed
  const [hasStarted, setHasStarted] = useState(false);

  const getOrCreateHowl = (worldId) => {
    if (howlCacheRef.current[worldId]) return howlCacheRef.current[worldId];
    const cfg = WORLD_AUDIO[worldId];
    if (!cfg) return null;
    const h = new Howl({
      src: [cfg.src],
      loop: true,
      volume: 0,
      html5: false,
      preload: true,
    });
    howlCacheRef.current[worldId] = h;
    return h;
  };

  // Listen for first user interaction (click/touch) to unlock audio playback
  useEffect(() => {
    if (hasStarted) return;
    const enableAudio = () => {
      setHasStarted(true);
    };
    window.addEventListener('click', enableAudio, { once: true });
    window.addEventListener('touchstart', enableAudio, { once: true });
    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
    };
  }, [hasStarted]);

  // Cross‑fade to a new world track when activeWorldId changes
  useEffect(() => {
    if (!hasStarted) return; // wait for user interaction
    if (!activeWorldId || activeWorldId === currentWorldIdRef.current) return;
    const newCfg = WORLD_AUDIO[activeWorldId];
    if (!newCfg) return;
    const newHowl = getOrCreateHowl(activeWorldId);
    if (!newHowl) return;
    const targetVol = isMuted ? 0 : newCfg.volume;

    // Fade out previous track
    if (currentHowlRef.current && currentHowlRef.current !== newHowl) {
      const old = currentHowlRef.current;
      old.fade(old.volume(), 0, FADE_DURATION);
      setTimeout(() => {
        if (old !== currentHowlRef.current) old.pause();
      }, FADE_DURATION + 100);
    }

    // Update refs immediately so async callbacks check correctly
    currentHowlRef.current = newHowl;
    currentWorldIdRef.current = activeWorldId;

    const startPlay = () => {
      if (!newHowl.playing()) newHowl.play();
      newHowl.fade(newHowl.volume(), targetVol, FADE_DURATION);
    };

    if (newHowl.state() === 'loaded') {
      startPlay();
    } else {
      newHowl.once('load', () => {
        // Confirm this track is still the current active track before playing
        if (currentWorldIdRef.current === activeWorldId) {
          startPlay();
        }
      });
    }
  }, [activeWorldId, hasStarted, isMuted]);

  // Mute/unmute handling without stopping playback
  useEffect(() => {
    if (!currentHowlRef.current) return;
    const cfg = WORLD_AUDIO[currentWorldIdRef.current];
    if (!cfg) return;
    const targetVol = isMuted ? 0 : cfg.volume;
    currentHowlRef.current.fade(currentHowlRef.current.volume(), targetVol, 600);
  }, [isMuted]);

  // Cleanup all Howls on component unmount
  useEffect(() => {
    return () => {
      Object.values(howlCacheRef.current).forEach((h) => {
        h.stop();
        h.unload();
      });
    };
  }, []);

  return null; // Purely functional component
};

export default AmbientAudio;
