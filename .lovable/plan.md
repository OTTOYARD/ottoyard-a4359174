

# Compact Header Layout

## Goal
Reorganize the header to stack Notifications + Settings, OttoCommand, and Online badge tightly on the right side, reducing vertical space.

## New Layout

Current 3-row layout becomes a 2-row layout:

```text
Row 1: [Logo + OTTOYARD/AppName]     [Notifications] [Settings]
                                      [OttoCommand button]
                                      [Online badge]

Row 2: [Weather button]
```

Specifically, the right column becomes a vertical stack (flex-col) with tight spacing containing:
1. Notifications + Settings icons (in a row)
2. OttoCommand button
3. Online badge

This all sits in Row 1 opposite the logo. Weather moves to a slim Row 2 on its own.

## Technical Changes

**`src/components/shared/AppHeader.tsx`**
- Change `space-y-2` on the container to `space-y-1` for tighter rows
- Restructure Row 1's right side into a `flex flex-col items-end gap-1` containing:
  - The notification + settings buttons row
  - The OttoCommand button
  - The Online badge
- Remove the separate Row 2 (OttoCommand) and Row 3 (Online badge) sections
- Keep Weather as a slim second row with reduced top spacing

