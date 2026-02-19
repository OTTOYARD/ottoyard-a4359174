

# Tab Styling Updates

## Changes

### 1. Rename "Depot & Q" tab to "Depot" in `src/pages/OrchestraEV.tsx`
- Line 54: Change `Depot & Q` to `Depot`

### 2. Update `TabsTrigger` text color in `src/components/ui/tabs.tsx`
- Change inactive tab text from `text-muted-foreground` to `text-white` so all tab labels are bright white
- Keep the active state styling (`data-[state=active]:bg-primary data-[state=active]:text-primary-foreground`)

### 3. Update `TabsList` border to glow blue permanently in `src/components/ui/tabs.tsx`
- Change `border-border/50` to `border-blue-500/50`
- Change the hover glow from conditional to always-on: add `shadow-[0_0_8px_2px_rgba(59,130,246,0.25)]` as a default class (not just on hover)
- Keep the hover state for a slightly brighter glow

These changes affect the shared `tabs.tsx` component, so both the AV (Index) and EV (OrchestraEV) pages will get the updated styling automatically.

