

# Move Weather Closer to Logo

## Goal
Eliminate the gap between the weather row and the logo/title row to shrink the overall header height.

## Changes

**`src/components/shared/AppHeader.tsx`**
- Remove `space-y-1` from the container div (line 31) -- this adds vertical gap between Row 1 and the Weather row
- Remove the separate Row 2 wrapper div entirely and instead place the `WeatherButton` directly below the logo/title inside the left side of Row 1
- Specifically, nest the weather button under the OTTOYARD + appName text column so it sits tight beneath the app name with no extra spacing

The left side will become:
```
[Logo image]  OTTOYARD
              OrchestraAV1
              [Weather button]
```

This removes the inter-row gap and tucks the weather info right under the branding text, shrinking the header footprint.

