

## Plan: Tighten Mobile Tab Spacing

The tab bar on the OrchestraEV page gets cut off on mobile because the container padding and tab trigger padding are too generous. Three changes in `src/pages/OrchestraEV.tsx`:

1. **Reduce wrapper padding**: Change `p-1` to `p-0.5` on the `surface-luxury` container div (line 61)
2. **Reduce tab trigger padding**: Change `px-2` to `px-1` on mobile for `TabsTrigger` (line 67)
3. **Tighten letter-spacing**: Change `tracking-wide` to `tracking-normal` on mobile to compress the text

All changes are on lines 61 and 67 of `src/pages/OrchestraEV.tsx`.

