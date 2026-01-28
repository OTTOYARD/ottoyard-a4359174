
# Plan: Reorganize Fleet Tab Layout with Merged Categories

## Overview
Restructure the Fleet tab layout to:
1. Merge "AI Predictions" and "Auto-Scheduled Queue" into a single "Intelligent Maintenance" section (since predicted = auto-scheduled)
2. Move "Manual Schedule" and "Upcoming Maintenance/Detailing" outside the Intelligent Maintenance collapsible as separate side-by-side collapsible buttons
3. Place the overall fleet vehicle list below these control buttons, scrollable

## Current Layout
```text
┌─────────────────────────────────────────────────────────────────┐
│ Intelligent Maintenance (Collapsible Button)                    │
│   ├── AI Predictions Section                                    │
│   ├── Auto-Scheduled Queue Section                              │
│   ├── Manual Schedule Section                                   │
│   └── Upcoming Maintenance / Detailing (side by side)           │
├─────────────────────────────────────────────────────────────────┤
│ Fleet Vehicle Cards (Scrollable Grid)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Target Layout
```text
┌─────────────────────────────────────────────────────────────────┐
│        Intelligent Maintenance (Collapsible - Centered)         │
│        [Shows merged Predicted + Auto-Scheduled items]          │
├──────────────────────────┬──────────────────────────────────────┤
│  Manual Schedule         │   Upcoming Services                  │
│  (Collapsible)           │   (Collapsible)                      │
├──────────────────────────┴──────────────────────────────────────┤
│ Fleet Vehicle Cards (Scrollable Grid)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File: `src/components/MaintenancePanel.tsx`

**Changes:**
1. Remove the "Auto-Scheduled Queue" section (merge with AI Predictions)
2. Since all predicted items are now auto-scheduled, show all predictions as "Auto-Scheduled by OTTO-Q"
3. Remove the "Manual Schedule" and "Upcoming Maintenance/Detailing" sections from this component

**Updated Logic:**
- Remove the `predictedCount` that filters for `!p.autoScheduled`
- Show all predictions as auto-scheduled (the assumption is: predicted = auto-scheduled)
- Badge will just show total count of auto-scheduled items

### File: `src/components/OTTOQFleetView.tsx`

**Changes:**
1. Add two new collapsible panels: "Manual Schedule" and "Upcoming Services"
2. Place them side-by-side in a responsive grid below the Intelligent Maintenance button
3. Move the existing "Manual Schedule" and "Upcoming" content into these new collapsibles

**New Structure:**
```typescript
<div className="space-y-4">
  {/* Top: Intelligent Maintenance Button (centered) */}
  <MaintenancePanel ... />
  
  {/* Middle: Manual Schedule + Upcoming Services (side by side) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <ManualSchedulePanel />      {/* New collapsible */}
    <UpcomingServicesPanel />    {/* New collapsible */}
  </div>
  
  {/* Bottom: Fleet Vehicle Grid (scrollable) */}
  <ScrollArea>
    {/* Vehicle cards */}
  </ScrollArea>
</div>
```

### New Components

**Option A: Inline in OTTOQFleetView**
Create the Manual Schedule and Upcoming Services as inline Collapsible components within OTTOQFleetView.

**Option B: Separate Components**
Create two new small components: `ManualSchedulePanel.tsx` and `UpcomingServicesPanel.tsx`.

Recommended: **Option A** (inline) to minimize file complexity, since these are small UI sections.

---

## Detailed Changes

### 1. MaintenancePanel.tsx - Simplify to Merged View

**Remove:**
- Lines 217-260: Auto-Scheduled Queue card (redundant since all predictions are auto-scheduled)
- Lines 262-297: Manual Schedule section
- Lines 300-368: Upcoming Services Grid (Maintenance + Detailing)

**Modify:**
- Lines 131-138: Change badges to show only "X Auto-Scheduled" (merged count)
- Lines 145-215: Rename "AI Predictions" to "Auto-Scheduled Maintenance" and update styling to reflect all items are scheduled
- Update the card styling so all items show as "Auto-Scheduled" (green success styling)

### 2. OTTOQFleetView.tsx - Add New Collapsible Sections

**Add after MaintenancePanel (around line 437):**

```typescript
{/* Manual Schedule & Upcoming Services - Side by Side */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Manual Schedule Collapsible */}
  <Collapsible open={manualScheduleOpen} onOpenChange={setManualScheduleOpen}>
    <CollapsibleTrigger asChild>
      <Button className="w-full justify-between bg-primary/80 hover:bg-primary">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Manual Schedule
        </div>
        <ChevronDown className={`transition-transform ${manualScheduleOpen ? 'rotate-180' : ''}`} />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      {/* Vehicle selector + Schedule button */}
    </CollapsibleContent>
  </Collapsible>

  {/* Upcoming Services Collapsible */}
  <Collapsible open={upcomingServicesOpen} onOpenChange={setUpcomingServicesOpen}>
    <CollapsibleTrigger asChild>
      <Button className="w-full justify-between bg-warning/80 hover:bg-warning">
        <div className="flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Upcoming Services
          <Badge className="ml-2">{upcomingMaintenance.length + upcomingDetailing.length}</Badge>
        </div>
        <ChevronDown className={`transition-transform ${upcomingServicesOpen ? 'rotate-180' : ''}`} />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      {/* Tabs for Maintenance vs Detailing */}
    </CollapsibleContent>
  </Collapsible>
</div>
```

**Add new state variables:**
```typescript
const [manualScheduleOpen, setManualScheduleOpen] = useState(false);
const [upcomingServicesOpen, setUpcomingServicesOpen] = useState(false);
```

**Import additional dependencies:**
```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, ChevronDown } from "lucide-react";
import { upcomingMaintenance, upcomingDetailing } from "@/data/maintenance-mock";
```

---

## Mock Data Update

### File: `src/data/maintenance-mock.ts`

**Update `predictiveMaintenanceData`:**
- Set `autoScheduled: true` for ALL predictions (since predicted = auto-scheduled)
- Populate `depotName` and `scheduledTime` for all entries

---

## Visual Design

### Intelligent Maintenance Button (Top, Centered)
- Full-width gradient button (warning → primary)
- Shows merged count: "X Auto-Scheduled"
- Opens to show all predicted/scheduled maintenance items

### Manual Schedule Button (Left Side)
- Primary color button
- Calendar icon
- Expands to show vehicle selector + schedule action

### Upcoming Services Button (Right Side)  
- Warning color button
- Clock icon + badge with count
- Expands to show tabs: Maintenance | Detailing

### Fleet Vehicle Grid (Below)
- Scrollable area with vehicle cards
- No changes to existing card design

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/MaintenancePanel.tsx` | Remove redundant sections, merge predicted + auto-scheduled |
| `src/components/OTTOQFleetView.tsx` | Add Manual Schedule + Upcoming Services collapsibles |
| `src/data/maintenance-mock.ts` | Set all predictions as auto-scheduled with depot info |

---

## Summary

This reorganization:
1. Treats all AI predictions as automatically scheduled (merged category)
2. Provides Manual Schedule as a quick-access collapsible button
3. Provides Upcoming Services (maintenance + detailing) as a separate collapsible
4. Keeps the fleet vehicle list scrollable below these controls
5. Creates a cleaner, more logical hierarchy
