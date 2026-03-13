

## Better Map Interface for Fleet Overview

### Current State
The Index page overview tab uses a standard Mapbox `satellite-streets-v12` style with 2D markers for vehicles and depots. It's functional but flat.

### Proposed Approach: Enhanced 3D Mapbox

Rather than building a custom Three.js globe (which would lose real mapping features like street data, geocoding, and interactivity), we upgrade the existing Mapbox map with its built-in 3D capabilities:

1. **3D Terrain + Sky** — Enable Mapbox's `terrain` source with exaggerated elevation and atmospheric sky layer for depth
2. **3D Building Extrusions** — Add a `fill-extrusion` layer that renders buildings in 3D with the dark theme
3. **Tilted Camera (Pitch)** — Set default pitch to ~45-55 degrees for a dramatic 3D perspective
4. **Dark Navigation Style** — Switch to `dark-v11` or `satellite-streets-v12` with a fog/atmosphere effect for a premium look
5. **Animated Vehicle Markers** — Add a subtle pulsing animation on active vehicle markers to make the map feel alive
6. **Smooth Fly-To Transitions** — When switching cities, use `flyTo` with pitch/bearing animation instead of `setCenter`

### Technical Changes

**File: `src/components/MapboxMap.tsx`**

- On map `load` event:
  - Add `mapbox-dem` raster-dem source and set `map.setTerrain({ source, exaggeration })`
  - Add `sky` layer for atmospheric rendering
  - Add `3d-buildings` fill-extrusion layer from the `composite` source, `building` source-layer
- Change initial map config: `pitch: 50`, `bearing: -15`
- Replace `map.setCenter()` with `map.flyTo({ center, pitch, bearing, zoom, duration })` for city changes
- Add CSS `@keyframes pulse-marker` animation to vehicle marker elements
- Add fog/atmosphere for depth: `map.setFog({ color, 'high-color', 'horizon-blend', range })`

### Visual Result
A cinematic, tilted 3D cityscape with extruded buildings, terrain elevation, and atmospheric lighting — vehicles and depots rendered as glowing markers over the 3D landscape.

