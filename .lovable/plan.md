

## Plan: Space-Themed Showroom Backdrop

**Goal**: Replace the flat gray void behind the vehicle with an immersive space environment — starfield, subtle nebula glow, and refined lighting — while keeping the vehicle, floor, and animation completely untouched.

### Changes (all in `VehicleShowroom3D.tsx`)

**1. Add a `Starfield` component** — a large sphere of ~2000 scattered point particles surrounding the scene (radius ~15-20), using tiny white/blue-white dots with slight size variation. Static, no animation. Renders behind everything via `depthWrite={false}`.

**2. Add a `NebulaDome` component** — 2-3 large, semi-transparent spheres with `BackSide` rendering positioned behind/above the scene, using soft accent-colored gradients (deep purples, blues) with very low opacity (0.03-0.06). Slow, subtle opacity pulsing to simulate nebula shimmer.

**3. Replace the `VolumetricFog` sphere** with a larger, darker nebula cloud that blends into the space backdrop instead of looking like a photoshoot fog machine.

**4. Update Canvas background** — change from `transparent` to a deep space black (`#030308`) so the starfield reads properly against a dark base.

**5. Swap Environment preset** — change from `"studio"` to `"night"` for more dramatic, space-appropriate reflections on the car body. Slightly increase `environmentIntensity` to compensate.

**6. Reduce ambient light** — drop from `0.12` to `0.06` so the spotlights feel more dramatic against the dark space backdrop, like the car is floating in a void lit by focused beams.

**7. Enhance existing `AmbientParticles`** — no logic changes, but the existing particles will naturally read as space dust against the dark starfield backdrop.

### What stays exactly the same
- `TeslaModel3GLB` component (vehicle model, materials, animation)
- `ShowroomFloor` (reflective floor + accent ring)
- `OrbitControls` settings
- All props interface and parent component

### File modified
- `src/components/orchestra-ev/VehicleShowroom3D.tsx`

