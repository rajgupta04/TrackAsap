import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sparkles, Box, Info, CheckCircle2, Mic, Volume2 } from 'lucide-react';

/**
 * RabbitAvatar
 *
 * Dual-engine interactive avatar for TrackAsap AI Interviewer:
 * 1. Mode 3D (WebGL via Three.js): Loads /models/rabbit.glb when present,
 *    providing real-time 3D rendering with studio lighting, neon-green rim light,
 *    viseme mouth morph-target lip sync, and interactive idle gestures.
 * 2. Mode 2.5D (Interactive Mascot): Renders the official TrackAsap Rabbit Mascot
 *    with responsive state switching (idle, listening, speaking), audio-reactive
 *    soundwave rings, neon breathing glow, and parallax hover.
 */
export default function RabbitAvatar({ isAISpeaking = false, isCandidateSpeaking = false }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [has3D, setHas3D] = useState(false);
  const [isLoading3D, setIsLoading3D] = useState(true);
  const [show3DInfo, setShow3DInfo] = useState(false);

  // References for Three.js animation loop to avoid stale closures
  const isAISpeakingRef = useRef(isAISpeaking);
  const isCandidateSpeakingRef = useRef(isCandidateSpeaking);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
  }, [isAISpeaking]);

  useEffect(() => {
    isCandidateSpeakingRef.current = isCandidateSpeaking;
  }, [isCandidateSpeaking]);

  // Attempt to probe and load /models/rabbit.glb
  useEffect(() => {
    let isMounted = true;
    let scene, camera, renderer, animationFrameId, mixer;
    let morphTargetMeshes = [];
    let modelRoot = null;
    let initialModelY = 0;

    const probeAndLoadModel = async () => {
      try {
        // Quick HEAD/GET check to see if the file exists
        const probeRes = await fetch('/models/rabbit.glb', { method: 'HEAD' });
        if (!probeRes.ok) {
          if (isMounted) {
            setHas3D(false);
            setIsLoading3D(false);
          }
          return;
        }

        const loader = new GLTFLoader();
        loader.load(
          '/models/rabbit.glb',
          (gltf) => {
            if (!isMounted || !canvasRef.current || !containerRef.current) return;

            const container = containerRef.current;
            const width = container.clientWidth || 320;
            const height = container.clientHeight || 320;

            // Scene & Camera
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
            camera.position.set(0, 0.2, 2.6);

            // WebGL Renderer
            renderer = new THREE.WebGLRenderer({
              canvas: canvasRef.current,
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance',
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.3;

            // Studio Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
            scene.add(ambientLight);

            // Key Light (warm white)
            const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
            keyLight.position.set(2, 4, 3);
            scene.add(keyLight);

            // TrackAsap Neon Green Signature Rim Light
            const rimLightGreen = new THREE.DirectionalLight(0x39ff14, 3.8);
            rimLightGreen.position.set(-3, 2, -2.5);
            scene.add(rimLightGreen);

            // Fill Light (electric blue)
            const fillLightBlue = new THREE.DirectionalLight(0x60a5fa, 1.5);
            fillLightBlue.position.set(3, -1, 1.5);
            scene.add(fillLightBlue);

            // Auto-center & Frame Model
            modelRoot = gltf.scene;
            const box = new THREE.Box3().setFromObject(modelRoot);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Normalize scale so height fits comfortably
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.4 / (maxDim || 1);
            modelRoot.scale.setScalar(scale);

            // Center horizontally and vertically focus on upper torso/head
            modelRoot.position.x = -center.x * scale;
            modelRoot.position.y = -center.y * scale - 0.2;
            modelRoot.position.z = -center.z * scale;
            initialModelY = modelRoot.position.y;

            scene.add(modelRoot);

            // Discover Morph Targets (Blendshapes for lip sync)
            modelRoot.traverse((node) => {
              if (node.isMesh && node.morphTargetDictionary && node.morphTargetInfluences) {
                morphTargetMeshes.push(node);
              }
            });

            // Embedded Animations
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(modelRoot);
              const action = mixer.clipAction(gltf.animations[0]);
              action.play();
            }

            // Mouse Interaction Tracker
            const handleMouseMove = (e) => {
              const rect = container.getBoundingClientRect();
              const relX = (e.clientX - rect.left) / rect.width - 0.5;
              const relY = (e.clientY - rect.top) / rect.height - 0.5;
              mouseRef.current.targetX = relX * 0.3;
              mouseRef.current.targetY = -relY * 0.2;
            };
            window.addEventListener('mousemove', handleMouseMove);

            // Resize Observer
            const resizeObserver = new ResizeObserver(() => {
              if (!container || !renderer || !camera) return;
              const w = container.clientWidth || 320;
              const h = container.clientHeight || 320;
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              renderer.setSize(w, h);
            });
            resizeObserver.observe(container);

            // Animation Loop
            const clock = new THREE.Clock();

            const animate = () => {
              animationFrameId = requestAnimationFrame(animate);
              const delta = clock.getDelta();
              const elapsedTime = clock.getElapsedTime();

              if (mixer) {
                mixer.update(delta);
              }

              // Smooth mouse parallax look-at
              mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
              mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

              if (modelRoot) {
                // Subtle idle breathing
                modelRoot.position.y = initialModelY + Math.sin(elapsedTime * 2.2) * 0.025;

                // Subtle head tilt / tracking
                modelRoot.rotation.y = mouseRef.current.x;
                modelRoot.rotation.x = mouseRef.current.y;

                if (isAISpeakingRef.current) {
                  // Active talking nod
                  modelRoot.rotation.x += Math.sin(elapsedTime * 9) * 0.035;
                } else if (isCandidateSpeakingRef.current) {
                  // Attentive listening tilt
                  modelRoot.rotation.z = Math.sin(elapsedTime * 1.5) * 0.025 - 0.04;
                } else {
                  modelRoot.rotation.z = 0;
                }
              }

              // Real-Time Lip Sync via Morph Targets
              if (morphTargetMeshes.length > 0) {
                const isSpeaking = isAISpeakingRef.current;
                const speechViseme = isSpeaking
                  ? Math.max(0, Math.sin(elapsedTime * 14) * 0.45 + Math.sin(elapsedTime * 24) * 0.35 + 0.25)
                  : 0;

                morphTargetMeshes.forEach((mesh) => {
                  const dict = mesh.morphTargetDictionary;
                  const infl = mesh.morphTargetInfluences;
                  if (!dict || !infl) return;

                  const mouthKeys = ['mouthOpen', 'viseme_aa', 'viseme_O', 'jawOpen', 'mouth_open', 'talk'];
                  mouthKeys.forEach((key) => {
                    if (dict[key] !== undefined) {
                      const targetVal = isSpeaking ? speechViseme : 0;
                      infl[dict[key]] = THREE.MathUtils.lerp(infl[dict[key]], targetVal, 0.35);
                    }
                  });
                });
              }

              renderer.render(scene, camera);
            };

            animate();
            if (isMounted) {
              setHas3D(true);
              setIsLoading3D(false);
            }
          },
          undefined,
          (err) => {
            console.info('Rabbit 3D GLB not found or failed to parse. Falling back to 2.5D Mascot.', err);
            if (isMounted) {
              setHas3D(false);
              setIsLoading3D(false);
            }
          }
        );
      } catch (err) {
        if (isMounted) {
          setHas3D(false);
          setIsLoading3D(false);
        }
      }
    };

    probeAndLoadModel();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer) renderer.dispose();
      if (scene) {
        scene.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full max-w-sm mx-auto select-none"
    >
      {/* Background Cyberpunk Ambient Glow Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Speaking Neon-Green Aura */}
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-neon-green/20 blur-3xl pointer-events-none"
          animate={
            isAISpeaking
              ? { scale: [1, 1.45, 1], opacity: [0.35, 0.8, 0.35] }
              : isCandidateSpeaking
              ? { scale: 0.9, opacity: 0.08 }
              : { scale: 1, opacity: 0.15 }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Listening Electric-Blue Aura */}
        <motion.div
          className="absolute w-64 h-64 rounded-full bg-blue-500/25 blur-3xl pointer-events-none"
          animate={
            isCandidateSpeaking
              ? { scale: [1, 1.4, 1], opacity: [0.4, 0.85, 0.4] }
              : { scale: 0.8, opacity: 0 }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Dynamic Concentric Soundwave Rings */}
        <AnimatePresence>
          {isAISpeaking && (
            <>
              {[0, 1, 2].map((ring) => (
                <motion.div
                  key={`speak-ring-${ring}`}
                  className="absolute rounded-full border border-neon-green/40 pointer-events-none"
                  initial={{ width: 140, height: 140, opacity: 0.9 }}
                  animate={{
                    width: [140, 260 + ring * 40],
                    height: [140, 260 + ring * 40],
                    opacity: [0.7, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: ring * 0.6,
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
                  className="absolute rounded-full border border-blue-400/40 pointer-events-none"
                  initial={{ width: 140, height: 140, opacity: 0.8 }}
                  animate={{
                    width: [140, 250 + ring * 35],
                    height: [140, 250 + ring * 35],
                    opacity: [0.6, 0],
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
        className={`relative z-10 w-52 h-56 sm:w-60 sm:h-64 rounded-3xl p-3 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-xl border ${
          isAISpeaking
            ? 'border-neon-green/70 bg-dark-900/80 shadow-[0_0_40px_rgba(57,255,20,0.25)] scale-[1.02]'
            : isCandidateSpeaking
            ? 'border-blue-400/70 bg-dark-900/80 shadow-[0_0_40px_rgba(96,165,250,0.25)]'
            : 'border-white/10 bg-dark-900/50 shadow-2xl'
        }`}
      >
        {/* Real 3D WebGL Canvas Mode */}
        {has3D ? (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
          />
        ) : (
          /* Interactive 2.5D Animated Mascot (Official TrackAsap Mascot) */
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <motion.div
              className="relative w-40 h-44 sm:w-44 sm:h-48 flex items-center justify-center"
              animate={
                isAISpeaking
                  ? {
                      y: [0, -6, 0],
                      scale: [1, 1.04, 1],
                    }
                  : isCandidateSpeaking
                  ? {
                      rotate: [-2, 2, -2],
                      y: [0, -3, 0],
                    }
                  : {
                      y: [0, -4, 0],
                    }
              }
              transition={{
                duration: isAISpeaking ? 0.9 : isCandidateSpeaking ? 1.8 : 3.0,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Mascot Character Image */}
              <img
                src={
                  isAISpeaking
                    ? '/assets/avatar/rabbit_speaking.png'
                    : isCandidateSpeaking
                    ? '/assets/avatar/rabbit_listening.png'
                    : '/assets/avatar/hero_rabbit.png'
                }
                alt="TrackAsap Mascot Rabbit"
                className={`w-full h-full object-contain transition-all duration-200 select-none ${
                  isAISpeaking
                    ? 'drop-shadow-[0_0_20px_rgba(57,255,20,0.55)] scale-105'
                    : isCandidateSpeaking
                    ? 'drop-shadow-[0_0_18px_rgba(96,165,250,0.45)]'
                    : 'drop-shadow-[0_0_15px_rgba(0,0,0,0.6)] brightness-95'
                }`}
                onError={(e) => {
                  e.target.src = '/assets/avatar/hero_rabbit.png';
                }}
              />

              {/* Glowing Glasses Rim Accent */}
              <motion.div
                className={`absolute top-[28%] w-16 h-7 rounded-full pointer-events-none ${
                  isAISpeaking
                    ? 'bg-neon-green/20 blur-sm'
                    : isCandidateSpeaking
                    ? 'bg-blue-400/20 blur-sm'
                    : 'bg-white/5'
                }`}
                animate={isAISpeaking ? { opacity: [0.3, 0.8, 0.3] } : { opacity: 0.3 }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </motion.div>

            {/* Speaking / Listening Mic Indicator Pulse */}
            <div className="absolute bottom-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-dark-950/80 border border-white/10 text-[10px] backdrop-blur-md">
              {isAISpeaking ? (
                <>
                  <Volume2 className="w-3 h-3 text-neon-green animate-pulse" />
                  <span className="text-neon-green font-semibold tracking-wide">Speaking</span>
                </>
              ) : isCandidateSpeaking ? (
                <>
                  <Mic className="w-3 h-3 text-blue-400 animate-bounce" />
                  <span className="text-blue-400 font-semibold tracking-wide">Listening</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-dark-400" />
                  <span className="text-dark-300 font-medium">Ready</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Top Header Badge / 3D Pipeline Info Toggle */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-dark-950/75 border border-white/10 text-[10px] text-dark-300 font-medium">
            <span className="text-xs">🐰</span>
            <span>TrackAsap AI</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShow3DInfo(!show3DInfo)}
              title="3D Avatar Engine Status"
              className={`p-1 rounded-full border transition-all ${
                has3D
                  ? 'border-neon-green/40 text-neon-green bg-neon-green/10'
                  : 'border-white/10 text-dark-400 hover:text-white bg-dark-950/60'
              }`}
            >
              <Box className="w-3 h-3" />
            </button>

            {/* 3D Pipeline Info Popover */}
            <AnimatePresence>
              {show3DInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 mt-2 w-64 p-3 rounded-xl bg-dark-900 border border-white/15 shadow-2xl text-left z-30 backdrop-blur-2xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-white/10">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-neon-green" />
                      Avatar Engine
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        has3D
                          ? 'bg-neon-green/20 text-neon-green'
                          : 'bg-dark-800 text-dark-300'
                      }`}
                    >
                      {has3D ? 'Three.js 3D' : '2.5D Mascot'}
                    </span>
                  </div>

                  <p className="text-dark-300 text-[11px] leading-relaxed">
                    {has3D ? (
                      <span className="text-neon-green flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        `rabbit.glb` loaded! Real-time 3D lighting, animations, and lip-sync active.
                      </span>
                    ) : (
                      <span>
                        Currently rendering the official TrackAsap Mascot. To activate real-time 3D, export your rigged Astra/Meshy model to{' '}
                        <code className="text-neon-green font-mono text-[10px] bg-dark-950 px-1 py-0.5 rounded">
                          frontend/public/models/rabbit.glb
                        </code>
                        .
                      </span>
                    )}
                  </p>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => setShow3DInfo(false)}
                      className="text-[10px] text-dark-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
