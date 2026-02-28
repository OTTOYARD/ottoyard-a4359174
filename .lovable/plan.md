

## Plan: Rotate Starfield

Add a slow continuous rotation to the `Starfield` component using `useFrame` and a group ref.

### Change in `VehicleShowroom3D.tsx`

In the `Starfield` component, wrap the `Points` in a `<group>` with a ref, and use `useFrame` to increment `rotation.y` by `delta * 0.02` each frame for a slow, subtle spin.

