
# Plan: Change Occupied Stall Color to Yellow

## Overview
Update the depot tab to display occupied stalls in yellow color instead of the current primary (coral red) color. The existing color scheme already has a `warning` color defined as amber/yellow (`45 93% 47%`).

---

## Current State

| Status | Current Color | CSS Variable |
|--------|---------------|--------------|
| Available | Green | `success` |
| Occupied/Busy/Reserved | Coral Red | `primary` |
| Out of Service | Red | `destructive` |

## Target State

| Status | Target Color | CSS Variable |
|--------|--------------|--------------|
| Available | Green ✓ | `success` (unchanged) |
| Occupied/Busy/Reserved | **Yellow** | `warning` |
| Out of Service | Red ✓ | `destructive` (unchanged) |

---

## Files to Modify

### 1. `src/components/OTTOQDepotView.tsx`

**Location:** Lines 200-213 (`getResourceColor` function)

**Change:**
```typescript
// Before
case "OCCUPIED":
case "BUSY":
case "RESERVED":
  return "border-primary/40 bg-primary/5 text-primary";

// After  
case "OCCUPIED":
case "BUSY":
case "RESERVED":
  return "border-warning/40 bg-warning/5 text-warning";
```

**Additional changes in the same file:**
- Line 323-331: Update the "Occupied" summary card from `bg-primary/10 border-primary/20 text-primary` to `bg-warning/10 border-warning/20 text-warning`
- Line 376: Update the "Occupied" badge from `border-primary/40 text-primary` to `border-warning/40 text-warning`

### 2. `src/components/DepotStallInfo.tsx`

**Location:** Lines 72-83 (`getResourceColor` function)

**Change:**
```typescript
// Before
case "OCCUPIED":
  return "border-primary/40 bg-primary/5 text-primary";

// After
case "OCCUPIED":
  return "border-warning/40 bg-warning/5 text-warning";
```

**Additional changes:**
- Lines 136-138: Update the "Occupied" badge from `border-primary/40 bg-primary/10 text-primary` to `border-warning/40 bg-warning/10 text-warning`

---

## Technical Notes

- The `warning` color is already defined in `src/index.css` at line 136 as `45 93% 47%` (amber/yellow)
- No new CSS variables or colors need to be added
- The change is purely swapping `primary` → `warning` for occupied status styling
- The pulse animation on occupied stalls will remain unchanged

---

## Summary of Changes

| File | Changes |
|------|---------|
| `src/components/OTTOQDepotView.tsx` | Update `getResourceColor()` + 2 badge/card color updates |
| `src/components/DepotStallInfo.tsx` | Update `getResourceColor()` + 1 badge color update |

Total: ~6 line-level changes across 2 files
