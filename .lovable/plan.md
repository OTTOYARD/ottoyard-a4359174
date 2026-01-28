

# Plan: Fix City Selection to Display Correct City Data Across Dashboard

## Problem Summary
When a city is selected in the Overview tab (e.g., Nashville), other tabs (Depots, Fleet) may still show data from a different city (e.g., Austin). This happens because:
1. The `mapToOTTOQCity` function is outdated and redirects new cities to old ones
2. The `cityCoordinates` mapping is missing coordinates for new cities
3. There's a mismatch between "Los Angeles" in CitySearchBar and "LA" in the database

## Root Cause
The legacy `mapToOTTOQCity` function was designed when only 3 cities existed (Nashville, Austin, LA). Now the database has 9 cities with proper Mini/Max depots, but the mapping still redirects cities like "Seattle" → "LA" and "San Francisco" → "LA".

---

## Solution Overview

### Part 1: Update City Name Mapping

**File:** `src/pages/Index.tsx`

Remove the redirects from `mapToOTTOQCity` and instead map each city to its actual database name:

```typescript
const mapToOTTOQCity = (cityName: string): string => {
  const cityMap: { [key: string]: string } = {
    'Nashville': 'Nashville',
    'Austin': 'Austin',
    'Los Angeles': 'LA',    // CitySearchBar uses "Los Angeles", DB uses "LA"
    'LA': 'LA',
    'San Francisco': 'San Francisco',
    'Seattle': 'Seattle',
    'Denver': 'Denver',
    'Chicago': 'Chicago',
    'New York': 'New York',
    'Miami': 'Miami',
  };
  return cityMap[cityName] || cityName; // Pass through unknown cities
};
```

### Part 2: Expand City Coordinates

**File:** `src/pages/Index.tsx`

Add coordinates for all 9 supported cities:

```typescript
const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Nashville': { lat: 36.1627, lng: -86.7816 },
  'Austin': { lat: 30.2672, lng: -97.7431 },
  'LA': { lat: 34.0522, lng: -118.2437 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Denver': { lat: 39.7392, lng: -104.9903 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
};
```

### Part 3: Improve OTTOQDepotView City Sync

**File:** `src/components/OTTOQDepotView.tsx`

The current city matching logic at lines 78-95 works well but should be verified. The issue is that when `selectedCityName` is "LA" (after mapping), the component correctly finds the city. No changes needed here if the mapping is fixed.

### Part 4: Fix Weather Button City Prop

**File:** `src/pages/Index.tsx` (line 551)

The WeatherButton currently receives `currentCity` which is the original city from CitySearchBar. This should continue to work correctly since it uses coordinates, not the mapped name.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Update `mapToOTTOQCity` to use actual city names; expand `cityCoordinates` to all 9 cities |

---

## Technical Details

### Before (broken):
```
User selects "Seattle" 
→ mapToOTTOQCity("Seattle") returns "LA"
→ fetchCityData("LA") 
→ OTTOQDepotView receives "LA"
→ Shows LA depots instead of Seattle depots
```

### After (fixed):
```
User selects "Seattle"
→ mapToOTTOQCity("Seattle") returns "Seattle"
→ fetchCityData("Seattle")
→ OTTOQDepotView receives "Seattle"
→ Shows Seattle Mini & Seattle Max depots
```

---

## Expected Outcome

After implementation:
- Selecting "Nashville, USA" shows Nashville vehicles, Nashville Mini/Max depots, Nashville weather
- Selecting "Seattle, USA" shows Seattle vehicles, Seattle Mini/Max depots, Seattle weather
- All 9 US cities work correctly: Nashville, Austin, Los Angeles, San Francisco, Seattle, Denver, Chicago, New York, Miami
- International cities (London, Paris, etc.) fall back gracefully (passthrough to database query which will return empty if no data exists)

---

## Testing Checklist

1. Select Nashville → verify Nashville depots appear in Depots tab
2. Select Austin → verify Austin depots appear
3. Select Los Angeles → verify LA depots appear (handles name mismatch)
4. Select Seattle → verify Seattle depots appear (previously showed LA)
5. Select San Francisco → verify SF depots appear (previously showed LA)
6. Verify weather widget updates to correct city
7. Verify Fleet tab shows vehicles for the selected city

