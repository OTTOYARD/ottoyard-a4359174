

# Restore Stacked Header Layout with New Logo

## Overview
Revert the header to the previous stacked multi-row layout matching the screenshot reference, replace the site logo with the uploaded red hexagon image, and make OttoCommand a red (primary/destructive) button.

## Changes

### 1. Copy new logo to project
- Copy `user-uploads://Untitled_design_7.png` to `public/ottoyard-logo-new.png` (replacing the existing logo file)

### 2. Redesign `src/components/shared/AppHeader.tsx`
Restructure from a single compressed row to a stacked layout matching the screenshot:

**Row 1 (top):**
- Left: Logo (larger, ~10-12 size) + "OTTOYARD" bold title + app name subtitle in red/primary
- Right: Notification bell icon + Settings gear icon

**Row 2:**
- Left: Weather button (visible on all screen sizes, not hidden on mobile)
- Right: Red "OttoCommand" button (using `variant="default"` or custom red styling, not ghost)

**Row 3:**
- Right-aligned: "Online" status badge (visible on all screens)

### 3. OttoCommand Button Styling
- Change from `variant="ghost"` to `variant="default"` (red/primary background)
- Always show the "OttoCommand" text label (remove `hidden sm:inline`)
- Include the Bot icon

### Technical Details

```
Layout structure:
+------------------------------------------+
| [Logo] OTTOYARD          [Bell] [Gear]   |
|         Fleet Command                    |
| [Weather Badge]        [OttoCommandBtn] |
|                           [Online Badge] |
+------------------------------------------+
```

- The logo `img` tag will reference `/ottoyard-logo-new.png` (same path, new file)
- Logo container: remove the `bg-primary/20` background box, increase image size to ~w-10 h-10
- "OTTOYARD" becomes larger bold text (~text-lg font-bold)
- App name (e.g. "Fleet Command") rendered in primary/red color below
- Weather button shown on all breakpoints (remove `hidden sm:block`)
- "Online" badge shown on all breakpoints (remove `hidden sm:inline-flex`)
- All elements use `overflow-hidden` and `min-w-0` to prevent mobile overflow

