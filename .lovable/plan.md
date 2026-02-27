

## Plan: Load Real Tesla Model 3 GLB into the 3D Showroom

### What's happening now
The current `VehicleShowroom3D.tsx` uses ~400 lines of hand-coded procedural geometry (boxes, torus, extruded shapes) that looks nothing like a real car.

### What changes

**Rewrite `VehicleShowroom3D.tsx`** — replace the procedural `TeslaModel3` component with a `TeslaModel3GLB` component that loads the real 3D model:

1. **Load the GLB** using `useGLTF` from `@react-three/drei` pointing at:
   `https://ycsisvozzgmisboumfqc.supabase.co/storage/v1/object/public/vehicle-renders/Tesla/2023_tesla_model_3_performance.glb`

2. **Apply dynamic paint color** — traverse the loaded scene's mesh hierarchy, identify body/paint meshes, and replace their materials with `MeshPhysicalMaterial` using the `vehicleColor` prop (clearcoat 1.0, metalness 0.9, roughness 0.15 for automotive paint look).

3. **Apply glass material** — find window/glass meshes and apply `MeshPhysicalMaterial` with transmission for realistic tinted glass.

4. **Auto-center and scale** — compute the model's bounding box, center it, and scale it to fit the showroom camera framing. Different GLB models have wildly different scales, so this must be dynamic.

5. **Keep all existing scene elements** — `CinematicLightRig`, `ShowroomFloor`, `VolumetricFog`, `AmbientParticles`, `OrbitControls`, `Environment` all stay exactly as they are.

6. **Add loading state** — show `ShowroomFallback` skeleton while the 22.5MB model downloads. Use `useGLTF.preload()` to warm the cache.

7. **Add error handling** — wrap in an error boundary. If the GLB fails to load (network error, CORS), fall back to a simple placeholder message instead of crashing.

8. **Gentle floating animation** — apply the same subtle `sin()` Y-axis hover to the loaded model group.

### Technical details

- `useGLTF` from drei handles GLB loading, Draco decompression, and caching automatically
- The model is 22.5MB — first load may take a few seconds on slower connections, but the browser caches it after that
- Material detection uses mesh name matching or material type inspection (common patterns: names containing "body", "paint", "glass", "wheel", "tire")
- The bucket is already public, so no auth headers needed for the storage URL
- No changes needed to `EVVehicleHero.tsx` — the interface (`vehicleColor`, `vehicleStatus`, `soc`) stays the same

### Files modified
- `src/components/orchestra-ev/VehicleShowroom3D.tsx` — major rewrite of the vehicle component, all scene/lighting code preserved

