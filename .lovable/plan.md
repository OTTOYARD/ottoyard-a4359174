

## Plan: Boost Vehicle Lighting

Increase existing light intensities and add a front fill light in `CinematicLightRig` to better illuminate the car and show off reflections/angles.

### Changes in `VehicleShowroom3D.tsx`

1. **Increase key light** base intensity from 2.2 to 3.0
2. **Increase rim light** base intensity from 1.5 to 2.2
3. **Increase fill light** base intensity from 0.7 to 1.2
4. **Increase overhead light** from 1.5 to 2.5
5. **Bump ambient light** from 0.06 to 0.12
6. **Add front-quarter fill spotlight** at `[3, 3, 4]` — white, intensity ~1.5 — to catch the front fascia and hood reflections

