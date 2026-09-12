import * as THREE from 'three';

/**
 * Procedural CAD-level 3D TrackAsap Mascot Rabbit
 *
 * Constructs a fully procedural 3D model in Three.js matching the official
 * TrackAsap character specification:
 * - White fur head with pear silhouette and chubby cheeks
 * - Expressive articulated bunny ears (with signature right-ear tilt) and pink inner ear cavity
 * - Iconic round black wireframe glasses with reflective PBR glass lenses
 * - Snout with cute pink nose, buck teeth, and articulated lower jaw for real-time lip-sync
 * - Expressive eyes with pupils, specular catchlights, and blinking eyelids
 * - Matte dark hoodie with rounded shoulders, collar ring, drawstrings with neon aglets, and glowing rocket logo
 * - Floating sci-fi pedestal with pulsating TrackAsap neon-green energy ring
 * - Real-time procedural animation: speech lip-sync, ear twitches, head tilts, eye blinks, and cursor tracking
 */
export function buildProceduralRabbit() {
  const root = new THREE.Group();
  root.name = 'TrackAsapRabbitRoot';

  // --- 1. Materials Palette ---
  const materials = {
    fur: new THREE.MeshStandardMaterial({
      color: 0xf6f7fb,
      roughness: 0.65,
      metalness: 0.04,
    }),
    innerEar: new THREE.MeshStandardMaterial({
      color: 0xffa4b5,
      roughness: 0.7,
      metalness: 0.0,
    }),
    nose: new THREE.MeshStandardMaterial({
      color: 0xff6584,
      roughness: 0.4,
      metalness: 0.08,
    }),
    mouthInterior: new THREE.MeshStandardMaterial({
      color: 0x661828,
      roughness: 0.6,
    }),
    tongue: new THREE.MeshStandardMaterial({
      color: 0xff708c,
      roughness: 0.45,
    }),
    teeth: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
    }),
    eyeWhite: new THREE.MeshStandardMaterial({
      color: 0xfcfcfd,
      roughness: 0.15,
      metalness: 0.0,
    }),
    eyePupil: new THREE.MeshStandardMaterial({
      color: 0x0a0c14,
      roughness: 0.05,
      metalness: 0.3,
    }),
    catchlight: new THREE.MeshBasicMaterial({
      color: 0xffffff,
    }),
    glassesFrame: new THREE.MeshStandardMaterial({
      color: 0x111218,
      roughness: 0.2,
      metalness: 0.85,
    }),
    glassesLens: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.08,
      ior: 1.48,
      thickness: 0.06,
    }),
    hoodie: new THREE.MeshStandardMaterial({
      color: 0x14141b,
      roughness: 0.85,
      metalness: 0.06,
    }),
    hoodieTrim: new THREE.MeshStandardMaterial({
      color: 0x22222d,
      roughness: 0.7,
      metalness: 0.12,
    }),
    drawstring: new THREE.MeshStandardMaterial({
      color: 0xd6d9e0,
      roughness: 0.75,
    }),
    aglet: new THREE.MeshStandardMaterial({
      color: 0x39ff14,
      emissive: 0x39ff14,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    }),
    logoGlow: new THREE.MeshStandardMaterial({
      color: 0x39ff14,
      emissive: 0x39ff14,
      emissiveIntensity: 1.6,
      roughness: 0.25,
    }),
    pedestalMetal: new THREE.MeshStandardMaterial({
      color: 0x11121a,
      roughness: 0.35,
      metalness: 0.85,
    }),
    pedestalGlow: new THREE.MeshStandardMaterial({
      color: 0x39ff14,
      emissive: 0x39ff14,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    }),
  };

  // --- 2. Sci-Fi Floating Pedestal ---
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.set(0, -1.05, 0);

  // Beveled upper plate
  const baseTopGeo = new THREE.CylinderGeometry(1.35, 1.45, 0.09, 36);
  const baseTopMesh = new THREE.Mesh(baseTopGeo, materials.pedestalMetal);
  pedestalGroup.add(baseTopMesh);

  // Neon Energy Ring
  const energyRingGeo = new THREE.TorusGeometry(1.38, 0.024, 16, 64);
  energyRingGeo.rotateX(Math.PI / 2);
  const energyRingMesh = new THREE.Mesh(energyRingGeo, materials.pedestalGlow);
  energyRingMesh.position.y = 0.03;
  pedestalGroup.add(energyRingMesh);

  // Lower support ring
  const baseBottomGeo = new THREE.CylinderGeometry(1.15, 1.35, 0.14, 36);
  const baseBottomMesh = new THREE.Mesh(baseBottomGeo, materials.pedestalMetal);
  baseBottomMesh.position.y = -0.1;
  pedestalGroup.add(baseBottomMesh);

  root.add(pedestalGroup);

  // --- 3. Body & Hoodie ---
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, -0.4, 0);

  // Torso
  const torsoGeo = new THREE.CylinderGeometry(0.68, 0.94, 1.25, 32);
  const torsoMesh = new THREE.Mesh(torsoGeo, materials.hoodie);
  torsoMesh.position.y = 0.35;
  bodyGroup.add(torsoMesh);

  // Shoulders (rounded capsule drape)
  const shouldersGeo = new THREE.CapsuleGeometry(0.32, 1.05, 10, 20);
  shouldersGeo.rotateZ(Math.PI / 2);
  const shouldersMesh = new THREE.Mesh(shouldersGeo, materials.hoodie);
  shouldersMesh.position.set(0, 0.82, -0.02);
  bodyGroup.add(shouldersMesh);

  // Puffed Hoodie Collar / Cowl
  const collarGeo = new THREE.TorusGeometry(0.55, 0.19, 16, 32);
  collarGeo.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, materials.hoodie);
  collarMesh.position.set(0, 0.94, 0.02);
  bodyGroup.add(collarMesh);

  // Folded Hood behind neck
  const hoodBackGeo = new THREE.SphereGeometry(0.42, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
  hoodBackGeo.rotateX(Math.PI * 0.75);
  const hoodBackMesh = new THREE.Mesh(hoodBackGeo, materials.hoodie);
  hoodBackMesh.position.set(0, 0.78, -0.42);
  bodyGroup.add(hoodBackMesh);

  // Drawstrings
  const createDrawstring = (xOffset) => {
    const stringGroup = new THREE.Group();
    stringGroup.position.set(xOffset, 0.85, 0.44);

    const cordGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.38, 12);
    const cordMesh = new THREE.Mesh(cordGeo, materials.drawstring);
    cordMesh.position.y = -0.19;
    stringGroup.add(cordMesh);

    // Neon green aglet
    const agletGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.07, 12);
    const agletMesh = new THREE.Mesh(agletGeo, materials.aglet);
    agletMesh.position.y = -0.38;
    stringGroup.add(agletMesh);

    return stringGroup;
  };

  const leftString = createDrawstring(-0.16);
  const rightString = createDrawstring(0.16);
  bodyGroup.add(leftString);
  bodyGroup.add(rightString);

  // TrackAsap Chest Logo (Glowing Rocket Emblem)
  const logoGroup = new THREE.Group();
  logoGroup.position.set(0, 0.46, 0.72);
  logoGroup.scale.set(0.18, 0.18, 0.18);

  // Rocket Body
  const rocketConeGeo = new THREE.ConeGeometry(0.45, 1.1, 16);
  const rocketConeMesh = new THREE.Mesh(rocketConeGeo, materials.logoGlow);
  logoGroup.add(rocketConeMesh);

  // Rocket Fins
  const finGeo = new THREE.BoxGeometry(0.15, 0.45, 0.08);
  const finLeft = new THREE.Mesh(finGeo, materials.logoGlow);
  finLeft.position.set(-0.35, -0.35, 0);
  finLeft.rotation.z = Math.PI / 6;
  const finRight = new THREE.Mesh(finGeo, materials.logoGlow);
  finRight.position.set(0.35, -0.35, 0);
  finRight.rotation.z = -Math.PI / 6;
  logoGroup.add(finLeft);
  logoGroup.add(finRight);

  bodyGroup.add(logoGroup);

  // Paws / Hands resting in front
  const createPaw = (xOffset) => {
    const pawGeo = new THREE.CapsuleGeometry(0.13, 0.22, 8, 16);
    pawGeo.rotateX(Math.PI / 3);
    const pawMesh = new THREE.Mesh(pawGeo, materials.fur);
    pawMesh.position.set(xOffset, 0.18, 0.62);
    return pawMesh;
  };
  bodyGroup.add(createPaw(-0.32));
  bodyGroup.add(createPaw(0.32));

  root.add(bodyGroup);

  // --- 4. Head Group (Rotatable & Articulated) ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.74, 0.04);

  // Cranium (soft pear rabbit head)
  const headGeo = new THREE.SphereGeometry(0.82, 36, 32);
  headGeo.scale(1.06, 0.98, 0.96);
  const headMesh = new THREE.Mesh(headGeo, materials.fur);
  headGroup.add(headMesh);

  // Chubby Cheeks
  const cheekGeo = new THREE.SphereGeometry(0.34, 24, 20);
  cheekGeo.scale(1.0, 0.85, 0.75);
  const leftCheek = new THREE.Mesh(cheekGeo, materials.fur);
  leftCheek.position.set(-0.46, -0.22, 0.36);
  const rightCheek = new THREE.Mesh(cheekGeo, materials.fur);
  rightCheek.position.set(0.46, -0.22, 0.36);
  headGroup.add(leftCheek);
  headGroup.add(rightCheek);

  // Upper Snout / Muzzle
  const muzzleGeo = new THREE.SphereGeometry(0.23, 22, 18);
  muzzleGeo.scale(1.0, 0.88, 0.8);
  const leftMuzzle = new THREE.Mesh(muzzleGeo, materials.fur);
  leftMuzzle.position.set(-0.15, -0.19, 0.72);
  const rightMuzzle = new THREE.Mesh(muzzleGeo, materials.fur);
  rightMuzzle.position.set(0.15, -0.19, 0.72);
  headGroup.add(leftMuzzle);
  headGroup.add(rightMuzzle);

  // Nose (cute pink heart/cone)
  const noseGeo = new THREE.CylinderGeometry(0.02, 0.1, 0.11, 16);
  noseGeo.rotateX(Math.PI / 2);
  const noseMesh = new THREE.Mesh(noseGeo, materials.nose);
  noseMesh.position.set(0, -0.09, 0.82);
  headGroup.add(noseMesh);

  // Front Buck Teeth
  const teethGroup = new THREE.Group();
  teethGroup.position.set(0, -0.27, 0.71);
  const toothGeo = new THREE.BoxGeometry(0.075, 0.09, 0.03);
  const leftTooth = new THREE.Mesh(toothGeo, materials.teeth);
  leftTooth.position.set(-0.042, 0, 0);
  const rightTooth = new THREE.Mesh(toothGeo, materials.teeth);
  rightTooth.position.set(0.042, 0, 0);
  teethGroup.add(leftTooth);
  teethGroup.add(rightTooth);
  headGroup.add(teethGroup);

  // --- 5. Articulated Lower Jaw (Lip-Sync Engine) ---
  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.28, 0.42);

  const chinGeo = new THREE.SphereGeometry(0.2, 20, 16);
  chinGeo.scale(0.9, 0.6, 0.8);
  const chinMesh = new THREE.Mesh(chinGeo, materials.fur);
  chinMesh.position.set(0, -0.05, 0.26);
  jawPivot.add(chinMesh);

  // Inner Mouth Cavity & Tongue
  const mouthCavityGeo = new THREE.SphereGeometry(0.14, 16, 12);
  mouthCavityGeo.scale(1.0, 0.5, 0.7);
  const mouthCavityMesh = new THREE.Mesh(mouthCavityGeo, materials.mouthInterior);
  mouthCavityMesh.position.set(0, 0.02, 0.22);
  jawPivot.add(mouthCavityMesh);

  const tongueGeo = new THREE.SphereGeometry(0.08, 12, 10);
  tongueGeo.scale(1.1, 0.4, 1.2);
  const tongueMesh = new THREE.Mesh(tongueGeo, materials.tongue);
  tongueMesh.position.set(0, 0.01, 0.24);
  jawPivot.add(tongueMesh);

  headGroup.add(jawPivot);

  // --- 6. Eyes & Blinking Eyelids ---
  const eyelids = [];

  const createEye = (isRight) => {
    const eyeGroup = new THREE.Group();
    const x = isRight ? 0.33 : -0.33;
    eyeGroup.position.set(x, 0.12, 0.66);
    eyeGroup.rotation.y = isRight ? 0.18 : -0.18;

    // Sclera
    const eyeballGeo = new THREE.SphereGeometry(0.21, 24, 20);
    const eyeballMesh = new THREE.Mesh(eyeballGeo, materials.eyeWhite);
    eyeGroup.add(eyeballMesh);

    // Large Glossy Pupil / Iris
    const pupilGeo = new THREE.SphereGeometry(0.145, 22, 18);
    pupilGeo.scale(1.0, 1.0, 0.35);
    const pupilMesh = new THREE.Mesh(pupilGeo, materials.eyePupil);
    pupilMesh.position.set(0, 0, 0.12);
    eyeGroup.add(pupilMesh);

    // Catchlights
    const catchlight1 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), materials.catchlight);
    catchlight1.position.set(0.045, 0.05, 0.19);
    eyeGroup.add(catchlight1);

    const catchlight2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), materials.catchlight);
    catchlight2.position.set(-0.035, -0.04, 0.19);
    eyeGroup.add(catchlight2);

    // Upper Eyelid for Blinking
    const eyelidPivot = new THREE.Group();
    eyelidPivot.position.set(0, 0, 0);

    const eyelidGeo = new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    eyelidGeo.rotateX(Math.PI);
    const eyelidMesh = new THREE.Mesh(eyelidGeo, materials.fur);
    eyelidPivot.add(eyelidMesh);

    // Initial state: retracted above eye
    eyelidPivot.rotation.x = -Math.PI * 0.48;
    eyeGroup.add(eyelidPivot);
    eyelids.push(eyelidPivot);

    return eyeGroup;
  };

  headGroup.add(createEye(false));
  headGroup.add(createEye(true));

  // --- 7. Iconic Round Glasses ---
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.12, 0.72);

  const createLensAssembly = (xOffset) => {
    const assembly = new THREE.Group();
    assembly.position.set(xOffset, 0, 0);

    // Round Wireframe Rim
    const rimGeo = new THREE.TorusGeometry(0.27, 0.022, 16, 48);
    const rimMesh = new THREE.Mesh(rimGeo, materials.glassesFrame);
    assembly.add(rimMesh);

    // Translucent Glass Lens
    const lensGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.012, 32);
    lensGeo.rotateX(Math.PI / 2);
    const lensMesh = new THREE.Mesh(lensGeo, materials.glassesLens);
    assembly.add(lensMesh);

    return assembly;
  };

  glassesGroup.add(createLensAssembly(-0.33));
  glassesGroup.add(createLensAssembly(0.33));

  // Center Bridge Bar
  const bridgeGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.16, 12);
  bridgeGeo.rotateZ(Math.PI / 2);
  const bridgeMesh = new THREE.Mesh(bridgeGeo, materials.glassesFrame);
  bridgeMesh.position.set(0, 0.03, 0.04);
  glassesGroup.add(bridgeMesh);

  // Left & Right Temple Arms
  const templeGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.65, 12);
  templeGeo.rotateX(Math.PI / 2);

  const leftTemple = new THREE.Mesh(templeGeo, materials.glassesFrame);
  leftTemple.position.set(-0.58, 0, -0.3);
  leftTemple.rotation.y = 0.22;
  glassesGroup.add(leftTemple);

  const rightTemple = new THREE.Mesh(templeGeo, materials.glassesFrame);
  rightTemple.position.set(0.58, 0, -0.3);
  rightTemple.rotation.y = -0.22;
  glassesGroup.add(rightTemple);

  headGroup.add(glassesGroup);

  // --- 8. Bunny Ears with Expressive Tilt ---
  // Left Ear (tall & upright)
  const leftEarPivot = new THREE.Group();
  leftEarPivot.position.set(-0.36, 0.74, -0.05);

  const leftEarOuterGeo = new THREE.CapsuleGeometry(0.19, 1.25, 8, 24);
  leftEarOuterGeo.scale(0.85, 1.0, 0.35);
  const leftEarOuter = new THREE.Mesh(leftEarOuterGeo, materials.fur);
  leftEarOuter.position.set(0, 0.65, 0);
  leftEarPivot.add(leftEarOuter);

  // Left Inner Pink Ear
  const leftEarInnerGeo = new THREE.CapsuleGeometry(0.13, 0.95, 8, 20);
  leftEarInnerGeo.scale(0.75, 0.95, 0.25);
  const leftEarInner = new THREE.Mesh(leftEarInnerGeo, materials.innerEar);
  leftEarInner.position.set(0, 0.63, 0.03);
  leftEarPivot.add(leftEarInner);

  leftEarPivot.rotation.z = -0.09;
  leftEarPivot.rotation.x = -0.05;
  headGroup.add(leftEarPivot);

  // Right Ear (Mascot signature playful bend!)
  const rightEarPivot = new THREE.Group();
  rightEarPivot.position.set(0.36, 0.74, -0.05);

  // Lower section
  const rightEarLowerGeo = new THREE.CapsuleGeometry(0.19, 0.65, 8, 20);
  rightEarLowerGeo.scale(0.85, 1.0, 0.35);
  const rightEarLower = new THREE.Mesh(rightEarLowerGeo, materials.fur);
  rightEarLower.position.set(0, 0.35, 0);
  rightEarPivot.add(rightEarLower);

  const rightEarLowerInnerGeo = new THREE.CapsuleGeometry(0.13, 0.52, 8, 16);
  rightEarLowerInnerGeo.scale(0.75, 0.95, 0.25);
  const rightEarLowerInner = new THREE.Mesh(rightEarLowerInnerGeo, materials.innerEar);
  rightEarLowerInner.position.set(0, 0.35, 0.03);
  rightEarPivot.add(rightEarLowerInner);

  // Upper bent section
  const rightEarBentPivot = new THREE.Group();
  rightEarBentPivot.position.set(0.04, 0.68, 0);
  rightEarBentPivot.rotation.z = -0.36; // Playful bend inward

  const rightEarUpperGeo = new THREE.CapsuleGeometry(0.17, 0.6, 8, 20);
  rightEarUpperGeo.scale(0.85, 1.0, 0.35);
  const rightEarUpper = new THREE.Mesh(rightEarUpperGeo, materials.fur);
  rightEarUpper.position.set(0, 0.3, 0);
  rightEarBentPivot.add(rightEarUpper);

  const rightEarUpperInnerGeo = new THREE.CapsuleGeometry(0.11, 0.46, 8, 16);
  rightEarUpperInnerGeo.scale(0.75, 0.95, 0.25);
  const rightEarUpperInner = new THREE.Mesh(rightEarUpperInnerGeo, materials.innerEar);
  rightEarUpperInner.position.set(0, 0.3, 0.03);
  rightEarBentPivot.add(rightEarUpperInner);

  rightEarPivot.add(rightEarBentPivot);
  rightEarPivot.rotation.z = 0.12;
  rightEarPivot.rotation.x = -0.05;
  headGroup.add(rightEarPivot);

  root.add(headGroup);

  // --- 9. Runtime State & Animation Engine ---
  let nextBlinkTime = 2.0;
  let isBlinking = false;
  let blinkProgress = 0;

  return {
    group: root,
    materials,
    update: (delta, time, isAISpeaking, isCandidateSpeaking, mouse) => {
      // 1. Idle Floating on Pedestal
      root.position.y = Math.sin(time * 2.2) * 0.038;

      // 2. Pedestal Energy Ring Pulse
      energyRingMesh.rotation.z = time * 0.5;
      if (materials.pedestalGlow) {
        materials.pedestalGlow.emissiveIntensity = isAISpeaking
          ? 2.2 + Math.sin(time * 8) * 0.6
          : isCandidateSpeaking
          ? 1.5 + Math.sin(time * 5) * 0.4
          : 1.2 + Math.sin(time * 2) * 0.25;
      }

      // 3. Head Nod & Look-At Mouse Interpolation
      const targetLookX = (mouse.x || 0) * 0.42;
      const targetLookY = (mouse.y || 0) * -0.28;

      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetLookX, 0.08);

      // Head X-axis tilt (looking up/down + speech nodding)
      let baseHeadRotX = targetLookY;
      if (isAISpeaking) {
        // Speech nod cadence
        baseHeadRotX += Math.sin(time * 9.5) * 0.042;
      }
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, baseHeadRotX, 0.1);

      // Inquisitive head tilt when candidate speaks
      let targetTiltZ = 0;
      if (isCandidateSpeaking) {
        targetTiltZ = Math.sin(time * 1.8) * 0.04 - 0.07;
      }
      headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, targetTiltZ, 0.08);

      // 4. Procedural Lip-Sync Engine (Lower Jaw)
      if (isAISpeaking) {
        // Multi-frequency vowel viseme waveform
        const viseme =
          Math.sin(time * 15) * 0.22 +
          Math.sin(time * 26) * 0.14 +
          Math.sin(time * 39) * 0.08 +
          0.18;
        const targetJawOpen = Math.max(0, viseme * 0.45);
        jawPivot.rotation.x = THREE.MathUtils.lerp(jawPivot.rotation.x, targetJawOpen, 0.45);
      } else {
        // Smoothly close mouth when silent
        jawPivot.rotation.x = THREE.MathUtils.lerp(jawPivot.rotation.x, 0, 0.25);
      }

      // 5. Ear Articulation & Twitches
      if (isCandidateSpeaking) {
        // Perk up ears alertly to listen
        leftEarPivot.rotation.x = THREE.MathUtils.lerp(leftEarPivot.rotation.x, 0.18, 0.1);
        rightEarPivot.rotation.x = THREE.MathUtils.lerp(rightEarPivot.rotation.x, 0.24, 0.1);
      } else if (isAISpeaking) {
        // Gentle ear bounce while explaining
        const earBounce = Math.sin(time * 9.5) * 0.03;
        leftEarPivot.rotation.x = -0.05 - earBounce;
        rightEarPivot.rotation.x = -0.05 - earBounce;
      } else {
        // Idle breathing sway
        leftEarPivot.rotation.x = -0.05 + Math.sin(time * 1.6) * 0.02;
        rightEarPivot.rotation.x = -0.05 + Math.sin(time * 1.6 + 0.5) * 0.025;
      }

      // 6. Drawstrings physics sway
      const swing = Math.sin(time * 4) * 0.04 * (isAISpeaking ? 2 : 1);
      leftString.rotation.z = swing;
      rightString.rotation.z = -swing;

      // 7. Natural Eye Blinking
      if (!isBlinking && time >= nextBlinkTime) {
        isBlinking = true;
        blinkProgress = 0;
      }

      if (isBlinking) {
        blinkProgress += delta * 9; // ~110ms blink speed
        if (blinkProgress < 1) {
          // Closing
          const closeAngle = -Math.PI * 0.48 + blinkProgress * Math.PI * 0.48;
          eyelids.forEach((el) => (el.rotation.x = closeAngle));
        } else if (blinkProgress < 2) {
          // Opening
          const openAngle = -Math.PI * 0.48 + (2 - blinkProgress) * Math.PI * 0.48;
          eyelids.forEach((el) => (el.rotation.x = openAngle));
        } else {
          isBlinking = false;
          eyelids.forEach((el) => (el.rotation.x = -Math.PI * 0.48));
          nextBlinkTime = time + 2.5 + Math.random() * 3.5;
        }
      }
    },
    dispose: () => {
      // Clean disposal of geometries and materials
      root.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
      });
      Object.values(materials).forEach((mat) => {
        if (mat.dispose) mat.dispose();
      });
    },
  };
}
