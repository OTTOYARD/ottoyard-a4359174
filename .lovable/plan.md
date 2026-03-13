

## Plan: Brighter Stars, Smaller Tabs, Tighter Tray

Three changes across two files:

### 1. Stars 50% brighter (`VehicleShowroom3D.tsx`, line 188)
- Increase `size` from `0.095` to `0.143` (0.095 × 1.5)

### 2. Shrink tab font by 15% (`OrchestraEV.tsx`, line 67)
- Mobile: `text-[10px]` → `text-[8.5px]` (round to `text-[8px]`)
- Desktop: `text-xs` (12px) → `text-[10px]`

### 3. Condense tab tray border closer to words (`OrchestraEV.tsx`, line 61)
- Change container from `max-w-full md:max-w-lg w-full` to `w-auto` so it shrinks to fit content
- Remove `mx-auto` width forcing; the `flex justify-center` parent already centers it
- Reduce padding: `p-0.5 md:p-1.5` → `p-0.5 md:p-1`

