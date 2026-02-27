

## Plan: Upgraded 3D Vehicle Hero with React Three Fiber

Replace the current CSS-only "showroom" hero with an interactive 3D scene using `@react-three/fiber` and `@react-three/drei`. The vehicle image becomes a textured plane floating in a real 3D environment with dynamic lighting, animated camera orbit, a reflective ground plane, and particle effects.

### Architecture

```text
EVVehicleHero.tsx
├── VehicleShowroom3D (new component — the 3D canvas)
│   ├── <Canvas> from @react-three/fiber
│   │   ├── VehicleCard3D — textured plane with the car image
│   │   ├── ReflectiveFloor — semi-transparent mirror ground
│   │   ├── AmbientParticles — floating energy particles (SOC-reactive)
│   │   ├── SpotlightRig — animated spotlights (color shifts with status)
│   │   └── OrbitControls — subtle auto-rotate, user can drag
│   └── Fallback — loading skeleton
├── Status badge overlay (HTML, positioned absolute over canvas)
├── Vehicle name + color dot
├── Battery bar (existing)
├── Quick stats grid (existing)
└── Collapsible details (existing, unchanged)
```

### Implementation Steps

**1. Install dependencies**
- `@react-three/fiber@^8.18` and `three@^0.170` and `@react-three/drei@^9.122.0`

**2. Create `src/components/orchestra-ev/VehicleShowroom3D.tsx`**
- A `<Canvas>` with transparent background that fills the hero area
- **VehicleCard3D**: Load `/tesla-model-3.png` as a texture on a `<planeGeometry>`, positioned at slight angle, with drop shadow
- **ReflectiveFloor**: A `<mesh>` with `MeshReflectorMaterial` from drei (or a simple semi-transparent plane with blur) beneath the car
- **SpotlightRig**: 2-3 `<spotLight>` sources — primary color mapped to vehicle status (green=ready, blue=charging, amber=in_service), slow animated intensity
- **AmbientParticles**: `<Points>` from drei — tiny glowing dots that float upward around the car; count/speed tied to SOC percentage (more particles = higher charge)
- **Camera**: `<OrbitControls>` with `autoRotate`, `autoRotateSpeed={0.3}`, `enableZoom={false}`, locked vertical angle
- Wrap in `<Suspense>` with a shimmer skeleton fallback

**3. Update `EVVehicleHero.tsx`**
- Replace the current hero stage div (lines 65-126) — the 6-layer CSS approach — with `<VehicleShowroom3D>`
- Keep the HTML status badge as an absolute-positioned overlay on top of the canvas
- All content below the hero (name, battery bar, stats, collapsible) stays identical
- Pass `vehicle` props to `VehicleShowroom3D` for reactive lighting/particles

**4. No changes to EVOverview, types, or mock data**

### Visual Result
- The car floats in a real 3D space with subtle auto-rotation
- Reflective floor creates depth without CSS hacks
- Status-colored spotlights shift between green/blue/amber
- Floating particles pulse with charge level
- User can touch/drag to rotate the view slightly
- Falls back gracefully to a static image if WebGL unavailable

### Technical Notes
- React Three Fiber v8 is required for React 18 compatibility
- `@react-three/drei` v9 provides `OrbitControls`, `useTexture`, `Points`, and reflector helpers
- The canvas uses `style={{ background: 'transparent' }}` so the existing `surface-elevated-luxury` card background shows through
- Performance: particle count capped at ~50, no post-processing, lightweight geometry only

