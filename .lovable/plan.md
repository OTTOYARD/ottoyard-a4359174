

# Tighter Tab Styling for Mobile and Desktop

## What Changes

### 1. Reduce horizontal padding between tab labels (`src/components/ui/tabs.tsx`)
- **TabsTrigger**: Reduce `px-2 md:px-4` to `px-1 md:px-2.5` so the text in each tab sits closer together

### 2. Shrink the tab tray border inward (`src/components/ui/tabs.tsx`)
- **TabsList**: Reduce internal padding from `p-0.5 md:p-1` to `p-px md:p-0.5` so the glowing border hugs the tabs more tightly

### 3. Constrain tab tray width on both pages
- **OrchestraEV** (`src/pages/OrchestraEV.tsx`, line 52): Change `max-w-2xl` to `max-w-xl` so the tray doesn't stretch as wide
- **Index/AV** (`src/pages/Index.tsx`, ~line 532): Add `max-w-xl` to the TabsList wrapper so it also doesn't span the full page width

All changes are purely CSS class adjustments -- no logic changes.

