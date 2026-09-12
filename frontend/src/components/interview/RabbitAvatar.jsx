import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildProceduralRabbit } from './ProceduralRabbit3D';
import { Sparkles, Box, CheckCircle2, Mic, Volume2, RotateCcw } from 'lucide-react';

/**
 * RabbitAvatar
 *
 * CAD-Level 3D WebGL Avatar for TrackAsap AI Interviewer.
 * - Procedural CAD-level 3D Rabbit modeled in Three.js matching the official mascot
 * - Real-time speech lip-sync (articulated lower jaw synchronized with speech)
 * - Expressive ear perking, inquisitive head tilts, and natural eye blinks
 * - 3D cursor tracking (rabbit tracks the candidate's mouse)
 * - Cyberpunk lighting with signature #39ff14 TrackAsap neon-green rim lighting
 * - Supports hot-swapping with /models/rabbit.glb if a custom mesh is placed
 */
export default function RabbitAvatar({ isAISpeaking = false, isCandidateSpeaking = false }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [activeMode, setActiveMode] = useState('procedural-3d'); // 'procedural-3d' | 'custom-glb'
  const [hasCustomGLB, setHasCustomGLB] = useState(false);
  const [showEngineInfo, setShowEngineInfo] = useState(false);

  // References for render loop
  const isAISpeakingRef = useRef(isAISpeaking);
  const isCandidateSpeakingRef = useRef(isCandidateSpeaking);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false, prevX: 0, dragRotY: 0 });

  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
  }, [isAISpeaking]);

  useEffect(() => {
    isCandidateSpeakingRef.current = isCandidateSpeaking;
  }, [isCandidateSpeaking]);

  useEffect(() => {
    let isMounted = true;
    let scene, camera, renderer, animationFrameId;
    let proceduralRabbit = null;
    let glbMixer = null;
    let glbRoot = null;
    let morphTargetMeshes = [];

    const initScene = async () => {
      if (!canvasRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth || 340;
      const height = container.clientHeight || 360;

      // 1. Scene & Perspective Camera
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
      camera.position.set(0, 0.35, 4.0);

      // 2. WebGL Renderer
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
      renderer.toneMappingExposure = 1.35;

      // 3. Studio Lighting Setup
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambientLight);

      // Key light (soft warm white)
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
      keyLight.position.set(3, 4, 3.5);
      scene.add(keyLight);

      // TrackAsap Signature Neon-Green Rim Light
      const rimLightGreen = new THREE.DirectionalLight(0x39ff14, 4.2);
      rimLightGreen.position.set(-3.5, 2.5, -2.5);
      scene.add(rimLightGreen);

      // Electric Blue Fill Light
      const fillLightBlue = new THREE.DirectionalLight(0x60a5fa, 1.6);
      fillLightBlue.position.set(3.5, -1, 1.5);
      scene.add(fillLightBlue);

      // Top Soft Skylight
      const topLight = new THREE.DirectionalLight(0xa5f3fc, 1.0);
      topLight.position.set(0, 5, 0);
      scene.add(topLight);

      // 4. Try loading custom /models/rabbit.glb if user provided one
      let loadedGLB = false;
      try {
        const probe = await fetch('/models/rabbit.glb', { method: 'HEAD' });
        if (probe.ok) {
          const loader = new GLTFLoader();
          const gltf = await new Promise((resolve, reject) => loader.load('/models/rabbit.glb', resolve, undefined, reject));
          if (isMounted) {
            glbRoot = gltf.scene;
            const box = new THREE.Box3().setFromObject(glbRoot);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.0 / (maxDim || 1);
            glbRoot.scale.setScalar(scale);
            glbRoot.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

            glbRoot.traverse((node) => {
              if (node.isMesh && node.morphTargetDictionary && node.morphTargetInfluences) {
                morphTargetMeshes.push(node);
              }
            });

            if (gltf.animations && gltf.animations.length > 0) {
              glbMixer = new THREE.AnimationMixer(glbRoot);
              glbMixer.clipAction(gltf.animations[0]).play();
            }

            scene.add(glbRoot);
            loadedGLB = true;
            setHasCustomGLB(true);
            setActiveMode('custom-glb');
          }
        }
      } catch (err) {
        // Fallback gracefully to procedural 3D model
      }

      // If no custom GLB, construct the CAD-level procedural 3D TrackAsap Mascot!
      if (!loadedGLB && isMounted) {
        proceduralRabbit = buildProceduralRabbit();
        scene.add(proceduralRabbit.group);
        setActiveMode('procedural-3d');
      }

      // 5. Mouse Parallax & Orbit Interactions
      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        mouseRef.current.targetX = relX * 1.0;
        mouseRef.current.targetY = relY * 1.0;

        if (mouseRef.current.isDragging) {
          const deltaX = e.clientX - mouseRef.current.prevX;
          mouseRef.current.dragRotY += deltaX * 0.012;
          mouseRef.current.prevX = e.clientX;
        }
      };

      const handleMouseDown = (e) => {
        mouseRef.current.isDragging = true;
        mouseRef.current.prevX = e.clientX;
      };

      const handleMouseUp = () => {
        mouseRef.current.isDragging = false;
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mousedown', handleMouseDown);

      // 6. Resize Observer
      const resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || 340;
        const h = container.clientHeight || 360;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);

      // 7. Animation Frame Loop
      const clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // Smooth mouse look interpolation
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

        // Animate Procedural CAD Model
        if (proceduralRabbit) {
          proceduralRabbit.update(
            delta,
            time,
            isAISpeakingRef.current,
            isCandidateSpeakingRef.current,
            {
              x: mouseRef.current.x + mouseRef.current.dragRotY,
              y: mouseRef.current.y,
            }
          );
        }

        // Animate Custom GLB if active
        if (glbRoot) {
          glbRoot.rotation.y = mouseRef.current.x + mouseRef.current.dragRotY;
          if (glbMixer) glbMixer.update(delta);

          // Morph targets viseme
          if (morphTargetMeshes.length > 0) {
            const isSpeaking = isAISpeakingRef.current;
            const viseme = isSpeaking
              ? Math.max(0, Math.sin(time * 15) * 0.45 + Math.sin(time * 26) * 0.35 + 0.25)
              : 0;

            morphTargetMeshes.forEach((mesh) => {
              const dict = mesh.morphTargetDictionary;
              const infl = mesh.morphTargetInfluences;
              if (!dict || !infl) return;
              ['mouthOpen', 'viseme_aa', 'jawOpen', 'talk'].forEach((key) => {
                if (dict[key] !== undefined) {
                  infl[dict[key]] = THREE.MathUtils.lerp(infl[dict[key]], viseme, 0.35);
                }
              });
            });
          }
        }

        renderer.render(scene, camera);
      };

      animate();
    };

    initScene();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (proceduralRabbit) proceduralRabbit.dispose();
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
      className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto select-none"
    >
      {/* Background Cyberpunk Ambient Glow Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Speaking Neon-Green Aura */}
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-neon-green/20 blur-3xl pointer-events-none"
          animate={
            isAISpeaking
              ? { scale: [1, 1.4, 1], opacity: [0.35, 0.8, 0.35] }
              : isCandidateSpeaking
              ? { scale: 0.9, opacity: 0.08 }
              : { scale: 1, opacity: 0.15 }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Listening Electric-Blue Aura */}
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-blue-500/25 blur-3xl pointer-events-none"
          animate={
            isCandidateSpeaking
              ? { scale: [1, 1.35, 1], opacity: [0.4, 0.85, 0.4] }
              : { scale: 0.8, opacity: 0 }
          }
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Soundwave Concentric Ripple Rings */}
        <AnimatePresence>
          {isAISpeaking && (
            <>
              {[0, 1, 2].map((ring) => (
                <motion.div
                  key={`speak-ring-${ring}`}
                  className="absolute rounded-full border border-neon-green/40 pointer-events-none"
                  initial={{ width: 160, height: 160, opacity: 0.9 }}
                  animate={{
                    width: [160, 290 + ring * 40],
                    height: [160, 290 + ring * 40],
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
                  initial={{ width: 160, height: 160, opacity: 0.8 }}
                  animate={{
                    width: [160, 280 + ring * 35],
                    height: [160, 280 + ring * 35],
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

      {/* Main 3D Stage Card */}
      <div
        className={`relative z-10 w-64 h-72 sm:w-72 sm:h-80 rounded-3xl p-2 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-xl border ${
          isAISpeaking
            ? 'border-neon-green/70 bg-dark-900/80 shadow-[0_0_40px_rgba(57,255,20,0.25)] scale-[1.02]'
            : isCandidateSpeaking
            ? 'border-blue-400/70 bg-dark-900/80 shadow-[0_0_40px_rgba(96,165,250,0.25)]'
            : 'border-white/10 bg-dark-900/50 shadow-2xl'
        }`}
      >
        {/* Real-time CAD-level 3D Three.js WebGL Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
          title="Drag to rotate TrackAsap 3D Rabbit"
        />

        {/* Top Header Badge / Engine Status */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-950/80 border border-white/10 text-[11px] text-dark-200 font-medium backdrop-blur-md">
            <span className="text-xs">🐰</span>
            <span className="font-semibold text-white">TrackAsap 3D</span>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
          </div>

          <div className="flex items-center gap-1.5">
            {mouseRef.current.dragRotY !== 0 && (
              <button
                onClick={() => {
                  mouseRef.current.dragRotY = 0;
                }}
                title="Reset Camera Rotation"
                className="p-1 rounded-full border border-white/10 text-dark-400 hover:text-white bg-dark-950/70 backdrop-blur-md transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => setShowEngineInfo(!showEngineInfo)}
              title="3D Engine Specifications"
              className="p-1 rounded-full border border-neon-green/30 text-neon-green hover:bg-neon-green/10 bg-dark-950/70 backdrop-blur-md transition-colors"
            >
              <Box className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3D Engine Specification Popover */}
        <AnimatePresence>
          {showEngineInfo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute top-11 right-2 w-72 p-3.5 rounded-2xl bg-dark-950/95 border border-neon-green/30 shadow-2xl text-left z-30 backdrop-blur-2xl text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Box className="w-3.5 h-3.5 text-neon-green" />
                  Three.js 3D Mascot Engine
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neon-green/15 text-neon-green border border-neon-green/30">
                  {activeMode === 'custom-glb' ? 'Custom GLB' : 'Procedural CAD 3D'}
                </span>
              </div>

              <p className="text-dark-300 text-[11px] leading-relaxed">
                Full real-time 3D model generated directly in Three.js with PBR materials, glasses lenses with transmission, articulated lower jaw for speech lip-sync, ear kinematics, natural eye blinks, and interactive 3D mouse look-at tracking.
              </p>

              <div className="p-2 rounded-xl bg-dark-900 border border-white/10 text-[10px] space-y-1 text-dark-300">
                <div className="flex justify-between">
                  <span>Lip-Sync:</span>
                  <span className="text-neon-green font-semibold">Articulated Lower Jaw</span>
                </div>
                <div className="flex justify-between">
                  <span>Lighting:</span>
                  <span className="text-white">Studio PBR + #39ff14 Rim Light</span>
                </div>
                <div className="flex justify-between">
                  <span>Interaction:</span>
                  <span className="text-blue-400 font-semibold">3D Gaze + Orbit Drag</span>
                </div>
              </div>

              <div className="pt-0.5 flex justify-end">
                <button
                  onClick={() => setShowEngineInfo(false)}
                  className="text-[11px] text-dark-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Speaking / Listening Pill */}
        <div className="absolute bottom-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-950/85 border border-white/10 text-[11px] backdrop-blur-md shadow-lg pointer-events-auto">
          {isAISpeaking ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-neon-green animate-pulse" />
              <span className="text-neon-green font-semibold tracking-wide">AI is Speaking</span>
            </>
          ) : isCandidateSpeaking ? (
            <>
              <Mic className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
              <span className="text-blue-400 font-semibold tracking-wide">Listening to You</span>
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
