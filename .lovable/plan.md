

## Issues Found & Proposed Fixes

### 1. "Orchestra AV" shows "EV" instead of "AV"
**Root cause**: In `AppHeader.tsx` line 38-45, `formatAppName` hardcodes "EV1" regardless of the `appName` prop. When `Index.tsx` passes `"OrchestraAV1"`, it still renders "Orchestra•EV1".

**Fix**: Parse the suffix from the `appName` prop dynamically. If name is `"OrchestraAV1"`, extract `"AV1"`; if `"OrchestraEV1"`, extract `"EV1"`.

### 2. Remove icons from OrchestraEV tab tray
**Location**: `OrchestraEV.tsx` lines 63-72 — each tab renders `<Icon className="h-3.5 w-3.5" />`.

**Fix**: Remove the `<Icon>` element from the tab triggers. Keep the icon data in `tabItems` (no harm), just don't render it.

### 3. "Orchestra EV" / "Orchestra AV" text too large on mobile
**Location**: `AppHeader.tsx` line 77 — the interface name label.

**Fix**: Add responsive text sizing: `text-[9px] md:text-[10px]` or similar shrink on the label span.

### 4. OttoCommand button too wide, doesn't shrink on mobile
**Location**: `AppHeader.tsx` lines 115-122 — the button has `px-4`.

**Fix**: Reduce padding to `px-2.5 md:px-4`. Reduce text to `text-[10px] md:text-xs`. Reduce icon to `h-3 w-3`. Consider hiding the text on very small screens or just making it tighter.

### 5. Depot section pulsing/bouncing too distracting
**Locations in `EVDepotQ.tsx`**:
- Line 63: `animate-pulse` on the "Open" badge
- Line 85: `animate-pulse-ring` on the ETA badge  
- Line 135: `animate-float` on the user's stall

**Fix**: Remove `animate-pulse` from the Open badge entirely. Remove `animate-pulse-ring` from the ETA badge. Keep `animate-float` on the user's stall but could reduce it or remove it. Overall: strip all pulsing/bouncing animations from the depot section.

### 6. Tab tray cutoff on mobile
**Location**: `OrchestraEV.tsx` lines 60-77 — the tab container has `max-w-lg` and `p-1.5`, and the tab triggers have relatively large padding.

**Fix**: Reduce container padding to `p-1`, reduce tab trigger padding to `px-2 py-2` on mobile, reduce text size to `text-[10px]`, and ensure the container fits within the viewport by removing `max-w-lg` or changing to `max-w-full`. Also remove `gap-0.5` or reduce it.

---

### Summary of File Changes

**`src/components/shared/AppHeader.tsx`**:
- Fix `formatAppName` to dynamically extract suffix from `appName` (AV1 vs EV1)
- Shrink orchestra label text on mobile
- Reduce OttoCommand button padding and text size on mobile

**`src/pages/OrchestraEV.tsx`**:
- Remove icon rendering from tab triggers
- Shrink tab container and trigger sizing for mobile fit

**`src/components/orchestra-ev/EVDepotQ.tsx`**:
- Remove `animate-pulse` from Open badge
- Remove `animate-pulse-ring` from ETA badge
- Remove or significantly reduce `animate-float` on user's stall

No functionality, routing, or data flow changes.

