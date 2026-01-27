
# Plan: City-Specific Depots with Consistent Occupied Stalls & Task Cards

## Overview
This plan implements a proper city-depot relationship where each city displays exactly 2 depots ("Mini" and "Max"), with consistent mock occupancy data showing task cards for occupied stalls. The solution will work dynamically for any city selected in the Overview tab.

---

## Part 1: Database Cleanup & Depot Naming Standardization

### 1.1 Clean Up Duplicate Depots
Remove duplicate "Depot 1" and "Depot 2" entries, keeping only the properly named "OTTOYARD Mini - {City}" and "OTTOYARD Max - {City}" depots.

```sql
-- Delete duplicate depots (Depot 1, Depot 2 variants)
DELETE FROM ottoq_depots 
WHERE name LIKE '%Depot 1%' OR name LIKE '%Depot 2%';
```

### 1.2 Add Support for Additional Cities
Create new cities and depots for cities that users can select but don't exist yet (Seattle, San Francisco, etc.):

**New Cities to Add:**
- Seattle (maps to new depots)
- San Francisco (maps to new depots)
- Denver (maps to new depots)
- Chicago (maps to new depots)
- New York (maps to new depots)
- Miami (maps to new depots)

**For each new city, create:**
- `OTTOYARD Mini - {CityName}`
- `OTTOYARD Max - {CityName}`
- Corresponding resources (12 charge stalls, 4 clean/detail, 2 maintenance, 6 staging)

---

## Part 2: Mock Occupation Data Generator

### 2.1 Create Edge Function Enhancement
Modify `supabase/functions/ottoq-depots-resources/index.ts` to generate consistent mock occupancy when real jobs don't exist.

**Mock Occupation Pattern (per depot):**
| Resource Type | Occupied Count | Status |
|--------------|----------------|--------|
| CHARGE_STALL | 3 | BUSY |
| CLEAN_DETAIL_STALL | 2 | BUSY |
| MAINTENANCE_BAY | 1 | BUSY |
| STAGING_STALL | 2 | RESERVED |

**Implementation:**
- When fetching resources, if no real jobs exist, inject mock job data
- Generate deterministic mock job IDs based on depot_id + resource_id (so they persist across refreshes)
- Include vehicle references for task cards
- Set `job_id` and `vehicle_id` on occupied resources

### 2.2 Mock Job Data Structure
```typescript
// For each occupied stall, generate:
{
  id: generateDeterministicId(depotId, resourceId),
  vehicle_id: generateMockVehicleId(index),
  job_type: resourceTypeToJobType(resourceType),
  state: 'ACTIVE',
  started_at: recentTimestamp(),
  eta_seconds: randomEta(),
  metadata_jsonb: { mock: true }
}
```

---

## Part 3: Frontend Changes

### 3.1 Update CitySearchBar Cities
Add Nashville to the city list and update coordinates:

**File:** `src/components/CitySearchBar.tsx`
```typescript
const cities: City[] = [
  { name: "Nashville", coordinates: [-86.7816, 36.1627], country: "USA" }, // ADD
  { name: "Austin", coordinates: [-97.7431, 30.2672], country: "USA" },
  { name: "Los Angeles", coordinates: [-118.2437, 34.0522], country: "USA" },
  // ... rest
];
```

### 3.2 Update Index.tsx City Mapping
Enhance `mapToOTTOQCity()` to handle all cities consistently:

**File:** `src/pages/Index.tsx`

Remove the mapping function and instead use the actual city name for depot display. The backend will handle creating proper depots for each city.

### 3.3 Ensure OTTOQDepotView Shows Only Mini/Max
Add filtering to show only OTTOYARD Mini and Max depots:

**File:** `src/components/OTTOQDepotView.tsx`
```typescript
const fetchDepotsForCity = async (cityId: string) => {
  const { data, error } = await supabase
    .from("ottoq_depots")
    .select("*")
    .eq("city_id", cityId)
    .or('name.ilike.%Mini%,name.ilike.%Max%') // Filter for Mini/Max only
    .order("name");
  // ...
};
```

### 3.4 Reset/Refresh Button Behavior
Update `handleRefresh` to clear mock deployments and restore default occupancy:

**File:** `src/components/OTTOQDepotView.tsx`
```typescript
const handleRefresh = async () => {
  setRefreshing(true);
  try {
    // Call reset endpoint to clear task confirmations and restore defaults
    await supabase.functions.invoke("ottoq-depots-resources", {
      body: { depot_id: selectedDepot, reset: true },
      method: "POST",
    });
    // Re-fetch fresh data
    await fetchDepotResources(selectedDepot);
    toast.success("Depot data reset to defaults");
  } finally {
    setRefreshing(false);
  }
};
```

---

## Part 4: Edge Function Update for Mock Occupancy

### 4.1 Update `ottoq-depots-resources/index.ts`

Add logic to generate mock occupied stalls when no real jobs exist:

```typescript
// Define mock occupation pattern
const MOCK_OCCUPATION = {
  CHARGE_STALL: 3,
  CLEAN_DETAIL_STALL: 2,
  MAINTENANCE_BAY: 1,
  STAGING_STALL: 2,
};

// Generate mock jobs for display
function generateMockOccupancy(resources: Resource[], depotId: string) {
  const grouped = groupBy(resources, 'resource_type');
  const mockJobs = new Map();
  
  for (const [type, count] of Object.entries(MOCK_OCCUPATION)) {
    const typeResources = grouped[type] || [];
    for (let i = 0; i < count && i < typeResources.length; i++) {
      const resource = typeResources[i];
      const mockJobId = `mock-${depotId}-${resource.id}`.substring(0, 36);
      mockJobs.set(resource.id, {
        id: mockJobId,
        vehicle_id: `mock-vehicle-${i}`,
        vehicle_ref: `AV-${(i + 1).toString().padStart(3, '0')}`,
        job_type: typeToJobType(type),
        state: 'ACTIVE',
        started_at: new Date(Date.now() - 30 * 60000).toISOString(),
        eta_seconds: 1800 + Math.floor(Math.random() * 1800),
      });
      resource.status = 'BUSY';
      resource.current_job_id = mockJobId;
    }
  }
  return mockJobs;
}
```

### 4.2 Handle Reset Flag
When `reset: true` is passed:
1. Delete any task confirmations for mock jobs
2. Return fresh default occupancy state

---

## Part 5: Database Seed Script

Create new cities and depots via SQL migration or RPC:

```sql
-- Create new cities
INSERT INTO ottoq_cities (name, tz) VALUES
  ('Seattle', 'America/Los_Angeles'),
  ('San Francisco', 'America/Los_Angeles'),
  ('Denver', 'America/Denver'),
  ('Chicago', 'America/Chicago'),
  ('New York', 'America/New_York'),
  ('Miami', 'America/New_York')
ON CONFLICT (name) DO NOTHING;

-- For each new city, create Mini and Max depots with resources
-- (using the existing create_ottoq_depot_resources function pattern)
```

---

## Technical Details

### Files to Modify:
1. **`supabase/functions/ottoq-depots-resources/index.ts`** - Add mock occupancy generation
2. **`src/components/OTTOQDepotView.tsx`** - Filter to Mini/Max depots only
3. **`src/components/CitySearchBar.tsx`** - Add Nashville to city list
4. **`src/pages/Index.tsx`** - Simplify city mapping

### Files to Create:
None - all changes are modifications to existing files

### Database Changes:
1. Delete duplicate "Depot 1/2" entries
2. Add new cities (Seattle, SF, Denver, Chicago, NYC, Miami)
3. Create Mini/Max depots for new cities with resources

---

## Expected Outcome

After implementation:
- Selecting "Nashville, USA" shows only "OTTOYARD Mini - Nashville" and "OTTOYARD Max - Nashville"
- Selecting "Seattle, USA" shows "OTTOYARD Mini - Seattle" and "OTTOYARD Max - Seattle"
- Each depot shows:
  - 3 charging bays occupied with task cards
  - 2 cleaning stalls occupied with task cards
  - 1 maintenance bay occupied with task card
  - 2 staging stalls occupied with task cards
- "Refresh" button restores default vehicle occupancy after deployment
- Task cards display vehicle info, job type, and time remaining
