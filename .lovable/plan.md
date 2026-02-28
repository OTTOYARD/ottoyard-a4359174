

## Plan: Add Overhead Fill Light

Add one downward-facing spotlight directly above the vehicle in the `CinematicLightRig` component to brighten the car without changing anything else.

### Change
In `VehicleShowroom3D.tsx`, add a white spotlight at position `[0, 8, 0]` pointing straight down with wide angle and moderate intensity (~1.5) inside the `CinematicLightRig` return block.

### File modified
- `src/components/orchestra-ev/VehicleShowroom3D.tsx` — one line addition in `CinematicLightRig`

