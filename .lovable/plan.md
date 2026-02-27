

## Plan: High-Fidelity Procedural 2024 Tesla Model 3 Long Range

The current `ProceduralSedan` is built from flat boxes — it looks like a Minecraft car. The fix: rebuild it with **Tesla Model 3-specific geometry** using smooth shapes, proper proportions, and signature details.

### What Changes

**1. Rewrite `ProceduralSedan` → `TeslaModel3` in `VehicleShowroom3D.tsx`**

Replace all boxy primitives with a detailed procedural Model 3:

- **Body**: Use `THREE.Shape` + `ExtrudeGeometry` for a proper side-profile silhouette — the Model 3's distinctive low hood, steeply raked windshield, fastback-style roofline, and short rear deck. Extrude it to the correct body width (~1.85m scaled).
- **Hood/frunk**: Smooth, low-profile front end with no grille (Tesla signature). Use a scaled `SphereGeometry` segment for the rounded nose.
- **Greenhouse/cabin**: Build with a separate extruded shape matching the Model 3's panoramic glass roof line — continuous curve from windshield base to rear window trailing edge.
- **Windshield + rear window**: Use `PlaneGeometry` with proper raked angles (Model 3's windshield is ~28° from vertical, rear glass ~45°), glass `MeshPhysicalMaterial` with high `transmission`.
- **Full-width taillight bar**: The Model 3's distinctive LED strip across the entire rear — thin emissive red bar mesh.
- **Headlights**: Sleek, narrow LED headlights wrapping around the front corners.
- **Aero wheels**: Model 3 LR aero wheel covers — flat disc `CylinderGeometry` with turbine-style spoke cutouts using `THREE.Shape` with holes, plus proper `TorusGeometry` tires with correct aspect ratio.
- **Flush door handles**: Thin rectangular meshes inset into the body sides.
- **Side mirrors**: Small angled pods on stalks.
- **Charging port**: Small detail on the left rear quarter panel.
- **Underbody**: Flat panel (Model 3's aero belly pan) in dark material.

**Materials**:
- Body paint: `MeshPhysicalMaterial` — `clearcoat: 1.0`, `clearcoatRoughness: 0.05`, `metalness: 0.9`, `roughness: 0.15`, `envMapIntensity: 1.5` for that deep Tesla paint look.
- Glass: `MeshPhysicalMaterial` — `transmission: 0.7`, `ior: 1.52`, `thickness: 0.3`, `color: #1a1a2e` for tinted panoramic roof.
- Chrome/trim: High metalness stainless-look material.
- Wheels: Matte dark grey aero covers + glossy rim edges.

**2. Update `EVVehicleHero.tsx`**

- Hardcode vehicle label to "2024 Tesla Model 3 Long Range" for the display name.
- Ensure `vehicleColor` mapping stays correct — the Model 3 LR comes in specific Tesla colors.

**3. Tune the showroom scene**

- Adjust camera position and FOV to frame the more detailed model properly.
- Increase `Environment` `environmentIntensity` to 0.5 for stronger reflections on the curved surfaces.
- Slightly increase canvas height to `h-72 md:h-96` for a more cinematic frame.

### Technical Approach

Using `THREE.Shape` + `ExtrudeGeometry` is the key technique. You define the car's side-profile as a 2D path (curves matching the Model 3 silhouette), then extrude it to width. This gives smooth, organic body panels instead of boxes. Combined with proper PBR materials and the existing cinematic lighting rig, the result will look like a real-time game engine car display.

No external assets, no API calls, no GLB files — pure procedural geometry that renders instantly.

