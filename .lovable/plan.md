
Move the two overlay cards (`FleetSummaryOverlay` and `OttoQIntelligenceCard`) out of the map's absolute-positioned overlay layer and render them as standalone tiles in a grid below the Mapbox map.

### Change

**`src/pages/Index.tsx`** (Overview tab):
- Remove the `absolute top-4 left-4` and `absolute top-4 right-4` (or bottom-left on mobile) wrappers around the two overlay components.
- Render them in a 2-column responsive grid (`grid-cols-1 md:grid-cols-2 gap-4`) directly below the `MapboxMap` container.
- Keep map height as-is; tiles flow naturally beneath.

### Result
- Map renders cleanly without overlay clutter
- Fleet Status and OTTO-Q Intelligence become full-width readable tiles
- Stacks vertically on mobile, side-by-side on desktop
