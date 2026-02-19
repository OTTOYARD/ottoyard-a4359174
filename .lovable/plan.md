

# Rename Interfaces and Remove "Coming Soon" Option

## Summary
Rename the three product interfaces and remove the disabled "OrchestraAV" coming-soon entry from the switcher.

## Changes

### 1. Rename interfaces
- **"Fleet Command"** becomes **"OrchestraAV1"** with description "Autonomous vehicle management"
- **"OrchestraEV"** becomes **"OrchestraEV1"** (description stays "Private EV management")
- The old "OrchestraAV" coming-soon entry is removed entirely

### 2. Files to update

**`src/components/shared/InterfaceToggle.tsx`**
- Update the `interfaces` array: rename labels/descriptions, remove the third "coming soon" entry
- Update `getInterfaceName()` to return the new names

**`src/components/shared/AppHeader.tsx`**
- Update the Orchestra color condition to match new names (both now start with "Orchestra", so both get the ice blue color -- or keep AV1 using the primary red to distinguish it)

**`src/pages/Index.tsx`**
- Pass `appName="OrchestraAV1"` instead of `"Fleet Command"` to the header (if it uses AppHeader)

**`src/pages/OrchestraEV.tsx`**
- Pass `appName="OrchestraEV1"` instead of `"OrchestraEV"`

### 3. Design decision
Since both interfaces now start with "Orchestra", both labels in the header will display in the ice-blue color. If you'd prefer AV1 to stay in the red/primary color, I can keep that distinction -- but by default both will get the Orchestra blue treatment.

