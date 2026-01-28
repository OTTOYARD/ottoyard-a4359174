

# Plan: Fix Quick Action Buttons Default Highlighting

## Problem
Two quick action buttons in OttoCommand AI have colored backgrounds by default:
- **"Critical Alerts"** - Red background (uses `variant: "destructive"`)
- **"OTTOW Dispatch"** - Grey background (uses `variant: "secondary"`)

The user wants all buttons to look neutral by default and only show red highlighting when hovered or selected.

---

## Solution

### File: `src/components/OttoCommand/QuickActions.tsx`

**Change 1:** Remove the `variant` property from "Critical Alerts" and "OTTOW Dispatch" actions (lines 55 and 64)

This makes all buttons use the default `variant: "outline"` which has a neutral border-only appearance.

**Change 2:** Update the `QuickActionButton` styling (line 104) to use consistent hover states

Update the button className to ensure all buttons:
- Have a neutral outline style by default
- Highlight with a red/primary color on hover

**Before:**
```typescript
{
  id: "critical-alerts",
  ...
  variant: "destructive"  // Causes red background by default
},
{
  id: "ottow-dispatch",
  ...
  variant: "secondary"    // Causes grey background by default
},
```

**After:**
```typescript
{
  id: "critical-alerts",
  ...
  // No variant - uses outline by default
},
{
  id: "ottow-dispatch",
  ...
  // No variant - uses outline by default
},
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| Line 55 | Remove `variant: "destructive"` from Critical Alerts |
| Line 64 | Remove `variant: "secondary"` from OTTOW Dispatch |

---

## Visual Result

| State | Appearance |
|-------|------------|
| Default | All buttons have neutral outline/border style |
| Hover | Buttons highlight with primary (coral/red) tint |
| Selected/Active | Red accent styling |

This ensures all 6 quick action buttons look consistent by default and only highlight on user interaction.

