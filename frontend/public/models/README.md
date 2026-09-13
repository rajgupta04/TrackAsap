# TrackAsap 3D Rabbit Avatar Model Specifications

Place your exported 3D model at:
`frontend/public/models/rabbit.glb`

The TrackAsap `<RabbitAvatar />` Three.js renderer automatically detects and loads `rabbit.glb`.

### Recommended 3D Model Specs (from Astra / Meshy / Rodin / Blender):
- **Format:** Binary glTF (`.glb`)
- **Polygon Count:** 15,000 – 40,000 triangles (optimized for real-time web 60fps)
- **Textures:** Embedded 2K PBR (BaseColor, Normal, Roughness)
- **Rigging:** Humanoid or custom head/ears/arms skeleton
- **Facial Blendshapes (Morph Targets):**
  - `mouthOpen` or `viseme_aa` (for speech lip-sync)
  - `viseme_O` / `viseme_E` (vowels)
  - `eyeBlinkLeft`, `eyeBlinkRight` (automatic eye blinks)
  - `mouthSmile` (positive feedback / encouragement)
- **Animations (Optional):**
  - `idle` (gentle breathing)
  - `speaking` (head nodding, hand gestures)
  - `listening` (head tilt, ear perk)
