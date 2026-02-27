

## Plan: Real 3D Vehicle Model Showroom

The current code loads a flat 2D image onto a `planeGeometry` — no matter how good the image is, it's still a spinning picture. The fix: load an actual 3D GLTF/GLB car model with proper geometry, PBR materials, and dynamic paint color.

### Approach

Use a free, open-source low-poly sedan GLB model (hosted in the existing `vehicle-renders` Supabase storage bucket), loaded via `useGLTF` from `@react-three/drei`. Apply dynamic `MeshPhysicalMaterial` with clearcoat for realistic automotive paint based on the vehicle's color property. Keep the existing cinematic lighting, particles, and floor — they're solid. Remove all AI image generation from the hero flow.

### Changes

**1. Upload a free GLB car model to Supabase storage**
- Use a CC0/MIT-licensed low-poly sedan model (e.g., from the Kenney asset pack or similar free source)
- Upload to `vehicle-renders/models/sedan.glb` in the existing bucket
- Alternatively, reference a publicly hosted CDN model as fallback

**2. Rewrite `VehicleShowroom3D.tsx`**
- Replace `VehicleCard3D` (flat plane + texture) with `Vehicle3D` component:
  - `useGLTF` to load the GLB model
  - Traverse all mesh children, apply `MeshPhysicalMaterial` with:
    - `color` from vehicle color prop (mapped from color names to hex)
    - `clearcoat: 1.0`, `clearcoatRoughness: 0.1` for automotive paint look
    - `metalness: 0.9`, `roughness: 0.2` for reflective body panels
    - `envMapIntensity: 1.0` for proper environment reflections
  - Gentle floating animation on Y axis (existing)
- Keep: `CinematicLightRig`, `ShowroomFloor`, `VolumetricFog`, `AmbientParticles`
- Upgrade `Environment` preset to `"studio"` for better reflections on the 3D model
- Increase canvas height slightly for better framing

**3. Update `EVVehicleHero.tsx`**
- Remove `useVehicleRender` hook import and usage
- Remove `Sparkles`, `Loader2` imports
- Remove "AI Rendered" badge (lines 98-105)
- Remove "Generating HD render..." badge (lines 90-97)
- Pass `vehicleColor` (hex) to `VehicleShowroom3D` instead of `imageUrl`
- Add color name → hex mapping (already partially exists as `colorMap`)

**4. Update `VehicleShowroom3D` props**
- Replace `imageUrl?: string` with `vehicleColor: string` (hex color for paint)
- Remove dependency on `useVehicleRender` entirely from the hero flow

**5. No changes to the edge function** — it stays for other potential uses but is decoupled from the hero

### 3D Model Source Strategy

Since we can't bundle arbitrary large assets, the plan uses a lightweight approach:
- Primary: Load a GLB from a public CDN URL (e.g., a free car model from a Three.js community resource)
- Fallback: If the model fails to load, show a stylized procedural car shape built from basic Three.js primitives (box body + cylinder wheels) — still 3D, still colored, still better than a flat image
- The procedural fallback ensures the showroom never breaks even without network access to a GLB

### Technical Notes
- `useGLTF` from drei handles GLTF/GLB loading with caching built in
- `MeshPhysicalMaterial` with clearcoat is the standard approach for automotive paint in Three.js
- The model will be ~200-500KB (low-poly), loaded once and cached by the browser
- Environment map from drei's `Environment` component provides realistic reflections on the 3D geometry

