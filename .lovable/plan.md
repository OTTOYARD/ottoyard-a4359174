

## Fix: Add iOS Safe Area Top Padding to AppHeader

The issue is that the AppHeader's container uses `pt-2` (8px) for top padding, which is not enough to clear the iOS status bar (time, battery, signal icons) in PWA/standalone mode.

### Change

**File: `src/components/shared/AppHeader.tsx`** (line ~37)

Change the outer wrapper's padding from:
```
className="px-3 pt-2 pb-1 overflow-hidden"
```
to:
```
className="px-3 pb-1 overflow-hidden"
style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }}
```

This uses `env(safe-area-inset-top)` to dynamically account for the iOS status bar. On devices without a notch/dynamic island it falls back to `0.5rem` (8px). On iOS PWA it pushes the header below the status bar.

### Single file change, no new dependencies.

