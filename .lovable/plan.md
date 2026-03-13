

## Plan: Remove Duplicate "Upcoming Services" Section

The EVOverview page renders upcoming services twice:
1. **Line 96** — `<UpcomingServicePreview>` component (the rich card with icons, accept buttons)
2. **Lines 155–200** — A manually built "Upcoming Services" card with inline markup

### Change

In `src/components/orchestra-ev/EVOverview.tsx`, remove the "Upcoming Services" card (lines 158–200) from the two-column grid at line 156. Keep only the "Maintenance Insights" card in that grid section, which will expand to full width (change `grid-cols-1 md:grid-cols-2` to a single column, or pair it with another widget).

The simplest approach: convert that grid row to only contain the Maintenance Insights card at full width, since the first `UpcomingServicePreview` component already covers upcoming services.

