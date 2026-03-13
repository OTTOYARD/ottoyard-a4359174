

## Plan: Reduce Active Tab Highlight Size

The active tab trigger has generous padding (`py-2 md:py-2.5`) and a large border-radius (`rounded-xl`), making the highlighted area feel oversized.

### Change

**`src/pages/OrchestraEV.tsx` (line 67)** — Reduce the active tab's vertical padding and border-radius on the `TabsTrigger`:

- `py-2 md:py-2.5` → `py-1 md:py-1.5`
- `rounded-xl` → `rounded-lg`

This shrinks only the tab pill (the red-highlighted active area) without affecting the outer tray container.

