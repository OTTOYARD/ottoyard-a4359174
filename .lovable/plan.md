

## Plan: Brighten Vehicle Roof and Interior

The existing overhead light at `[0, 8, 0]` is too high and wide to properly illuminate the roof and cabin. Need to add a focused top-down light closer to the vehicle and boost ambient/environment intensity.

### Changes in `VehicleShowroom3D.tsx` — `CinematicLightRig`

1. **Add a close overhead spotlight** at `[0, 4, 0]` — white, intensity 3.0, narrow angle 0.3 — aimed straight down to brightly light the roof and glass, showing the interior
2. **Add a front-high spotlight** at `[1, 5, 4]` — white, intensity 2.0, angle 0.4 — to catch the hood-to-windshield transition with visible reflections
3. **Increase ambient light** from 0.12 to 0.25 to lift overall shadow darkness
4. **Increase environment intensity** in Canvas from 0.65 to 1.0 for stronger reflections on glass and paint
5. **Make glass material less opaque** — increase `transmission` from 0.65 to 0.8 so the interior is more visible under the brighter light

