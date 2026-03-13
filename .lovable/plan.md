

## Fix: Tab Navigation Spacing/Clipping

The active tab's red border is being clipped by the outer container's blue `surface-luxury` border because the inner padding (`p-0.5 md:p-1`) is too tight.

### Change

**`src/pages/OrchestraEV.tsx` (line 61)**

Increase the outer container padding from `p-0.5 md:p-1` to `p-1 md:p-1.5` so the active tab indicator has breathing room and doesn't overlap the container border.

