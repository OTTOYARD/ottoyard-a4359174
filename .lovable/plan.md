

## Plan: Relocate OTTO-Q Intelligence & AV Command

### Changes

**1. Remove "OTTO-Q" and "AV Command" tabs from `src/pages/OrchestraEV.tsx`**
- Remove both tab entries from `tabItems` (keeping 5 tabs: Overview, Depot, Services, OTTOW, Reports)
- Remove their `TabsContent` blocks
- Remove unused imports (`OttoQStatus`, `AVSimulation`, `Brain`, `Bot`)
- Update grid to `md:grid-cols-5`

**2. Add "Deep Insights" button to `src/components/orchestra-ev/EVServices.tsx`**
- In the OTTO-Q Smart view section, add a prominent "Deep Insights" button (Brain icon, glass-card styling)
- Clicking it opens a full-screen `Dialog` containing the `OttoQStatus` component (Operations, Energy, Predictions, Depot Map, Queue sub-tabs)
- Import `OttoQStatus` and manage dialog open state

**3. Remove AV Command from `OttoQStatus.tsx` sub-tabs**
- Remove the "av-command" entry from `subTabs` array
- Remove its `TabsContent` block
- Remove `AVPipelineView` import and `useAVOrchestrator` hook
- Update grid to `md:grid-cols-5`

**4. Add AV Command Simulator to `src/components/SettingsHub.tsx` Admin tab**
- In the Admin `TabsContent`, after the `SimulatorControlPanel`, add the `AVSimulation` component
- Only render `AVSimulation` when the admin password has been entered (reuse the `SimulatorControlPanel`'s unlock pattern)
- Since `SimulatorControlPanel` manages its own unlock state internally, create a wrapper approach: add a separate password gate in the Admin tab that, once unlocked, shows both the simulator controls and AV Command below them
- Import `AVSimulation` into `SettingsHub`

### Technical Detail

For the Admin tab unlock gating in `SettingsHub.tsx`:
- Add local state `adminUnlocked` + `adminPassword` at the `SettingsHub` level
- In the Admin `TabsContent`, show a password input if not unlocked
- Once unlocked, render both `SimulatorControlPanel` and `AVSimulation` in sequence
- This replaces the current direct render of `<SimulatorControlPanel />` with a password gate wrapping both components

