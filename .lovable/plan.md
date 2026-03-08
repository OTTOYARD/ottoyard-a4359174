

## Plan: Add "Clear All" Button to Intelligence Feed

### What
Add a "Clear All" button in the Intelligence Feed header (next to the Scan button) that marks all intelligence events as inactive in Supabase, then refreshes the local store so new queued items are visible.

### Changes

**1. `src/stores/intelligenceStore.ts`** — Add a `clearAllEvents` action:
- Update all `is_active = true` rows in `intelligence_events` to `is_active = false` via Supabase
- Clear the local `events` array in the store
- Add to the interface and implementation

**2. `src/components/OttoResponse/IntelligenceFeed.tsx`** — Add the button:
- Import `Trash2` from lucide-react and `useIntelligenceStore`
- Add a "Clear All" button next to the Settings gear and Scan button in the header actions area (line ~161)
- Button calls `clearAllEvents()` from the intelligence store
- Disabled when no events exist or when scanning
- Shows event count as confirmation (e.g., "Clear All (12)")

