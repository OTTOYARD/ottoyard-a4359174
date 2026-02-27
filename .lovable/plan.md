## Plan: Add OTTO-Q Intelligence as a Tab in OrchestraEV

Rather than keeping Fleet Command OTTO-Q as a separate hidden page, embed it directly into the OrchestraEV interface as a prominent **"OTTO-Q"** tab — right where members and operators already navigate.

### What Changes

**1. Add "OTTO-Q" tab to `src/pages/OrchestraEV.tsx**`

- Add a new tab entry `{ value: "otto-q", label: "OTTO-Q", icon: Brain }` to the `tabItems` array (position it after "Services" or as the last tab)
- Import and render a new `OttoQStatus` component inside the new `TabsContent`
- Use the `Brain` icon from lucide-react to distinguish it

**2. Create `src/components/OttoQ/OttoQStatus.tsx**` — A unified OTTO-Q hub component

- Contains its own internal sub-tabs or segmented view:
  - **Operations** — renders `OperationsOverview` (utilization gauges, live event stream, KPIs)
  - **Energy** — renders `EnergyDashboard` (consumption profile, TOU overlay, savings)
  - **Predictions** — renders `PredictionPerformance` (accuracy, engagement funnel)
  - **Depot Map** — renders `DepotFloorPlan`
  - **AV Command** — renders `AVPipelineView` with `useAVOrchestrator`
  - **Queue** — renders `QueueManager`
- This consolidates the entire Fleet Command OTTO-Q page content into a single embeddable component
- Reuses all existing intelligence components — no duplication

**3. Optionally remove or keep `/fleet-command/otto-q` route**

- Keep the route as a standalone deep-link for admin bookmarks, but the primary access point becomes the OrchestraEV tab

### Result

- OTTO-Q Intelligence becomes one tap away from the OrchestraEV dashboard
- No separate hidden page to discover — it lives where the user already is
- All 6 sub-views accessible via internal navigation within the tab  
  
Make sure to include current otto-q functionality and optimize for efficientcies and reduce redundancies 