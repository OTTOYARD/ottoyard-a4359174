

## Fix: Blue Border Overlapping Active Tab Highlight

The issue is that the `TabsList` base component applies `border-2 border-blue-500/50` with only `p-px md:p-0.5` internal padding. The active tab's red border/background sits flush against the blue border, causing visual overlap.

### Root Cause
In `src/components/ui/tabs.tsx` (line 15), the default `TabsList` has tight padding (`p-px md:p-0.5`) combined with a `border-2` blue border. The OrchestraEV page overrides `p-0` on the TabsList (line 62), making it even tighter.

### Fix
In `src/pages/OrchestraEV.tsx` line 62, change the TabsList override to include `p-1 md:p-1.5` instead of `p-0`. This adds internal spacing between the blue border and the tab triggers, preventing the red active-state highlight from touching the blue border.

**Single change in `src/pages/OrchestraEV.tsx` line 62:**
- Change `h-auto p-0` → `h-auto p-1 md:p-1.5`

This gives the active tab's red border breathing room inside the blue-bordered container.

