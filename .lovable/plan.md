
## Make Strategic Tiles Match & Align Evenly

The two tiles below the map (`FleetSummaryOverlay`, `OttoQIntelligenceCard`) currently have hardcoded `w-[320px] max-w-[90vw]` widths and custom compact card styling left over from when they were map overlays. They don't fill their grid cells, so they appear left-aligned and visually unbalanced — and they don't match the standard `Card + CardHeader + CardTitle + CardContent` pattern used elsewhere in Orchestra (Quick Glance, Analytics).

### Changes

**1. `src/components/overview/fleet-summary-overlay.tsx`**
- Remove `w-[320px] max-w-[90vw]` and `backdrop-blur-md bg-card/85` overrides. Card becomes `w-full h-full` so it fills the grid cell.
- Restructure to use `CardHeader` + `CardTitle` + `CardContent` (matching MetricsCard / other tiles).
- Title: "Fleet Status" with subtitle "{vehicles} vehicles · {depots} depots".
- Keep the same internal sections (state chips, SOC bar, stall/alerts/OTTOW metrics, per-depot breakdown) but with slightly more breathing room (`p-4`, `gap-2` instead of `gap-1.5`).
- Update the loading skeleton to also be `w-full h-full`.

**2. `src/components/overview/otto-q-intelligence-card.tsx`**
- Same treatment: remove `w-[320px] max-w-[90vw]` and translucent overrides. `w-full h-full`.
- Use `CardHeader` + `CardTitle` + `CardContent`.
- Title: "OTTO-Q Intelligence" with the accuracy metric moved into `CardHeader` action slot (right side).
- Keep risk strip, autonomous actions grid, recent decisions, and "Open Field Ops" footer.
- Match padding/spacing to the FleetSummary tile so the two read as a matched pair.

**3. `src/pages/Index.tsx` (line 630)**
- Wrap the grid with `items-stretch` so both cards stretch to equal heights regardless of content length.
- Keep `grid-cols-1 md:grid-cols-2 gap-4` — already correct for desktop/mobile.

### Result
- Both tiles fill 100% of their grid cell on desktop (50/50 split) and stack full-width on mobile.
- Matching `Card` styling, header pattern, and internal padding — visually a pair.
- Equal heights via `items-stretch`, no more left-aligned floating cards.
