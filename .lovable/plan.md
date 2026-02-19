
# Move Amenities into Overview as Collapsible Tile

## What Changes

### 1. Update EVOverview to include an embedded Amenities section
- Add a collapsible card at the bottom of the Overview tab (before the events/notifications section or after it)
- The card header shows "Amenities" with a Target icon and a chevron that toggles open/closed
- When expanded, it renders the full EVAmenities component content inline (reservations, sim golf, cowork tables, privacy pods, shop link, and booking dialog)
- EVOverview will receive two new props: `amenityAvailability` and `amenityReservations`
- Uses the existing Collapsible component from `@/components/ui/collapsible.tsx`

### 2. Remove the Amenities tab from OrchestraEV page
- Delete the `<TabsTrigger value="amenities">` and `<TabsContent value="amenities">` from `src/pages/OrchestraEV.tsx`
- Remove the `EVAmenities` import from the page (it will now be imported inside EVOverview instead)
- Update the tab grid from `md:grid-cols-6` to `md:grid-cols-5` so the remaining 5 tabs fill evenly

### 3. Update the Quick Actions button
- The "Reserve Amenity" quick action currently calls `onTabChange("amenities")` -- this will be updated to scroll to the amenities collapsible section or simply expand it (using a ref or state callback)

## Files Modified

1. **`src/components/orchestra-ev/EVOverview.tsx`**
   - Add `amenityAvailability` and `amenityReservations` props
   - Import `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from UI
   - Import `EVAmenities` component
   - Add a collapsible card tile at the bottom of the overview that wraps `<EVAmenities />`
   - Update "Reserve Amenity" quick action to toggle the collapsible open and scroll to it

2. **`src/pages/OrchestraEV.tsx`**
   - Remove `amenities` tab trigger and tab content
   - Remove `EVAmenities` import
   - Pass `amenityAvailability={mockAmenityAvailability}` and `amenityReservations={mockAmenityReservations}` to `<EVOverview />`
   - Change TabsList grid from `md:grid-cols-6` to `md:grid-cols-5`

## Technical Details

- The Collapsible component from Radix is already installed and exported at `src/components/ui/collapsible.tsx`
- The collapsible tile will use `useState` for open/closed state, defaulting to closed
- A `useRef` will be used to scroll the amenities tile into view when the "Reserve Amenity" quick action is clicked
- The tab tray naturally becomes tighter with 5 tabs instead of 6, and the `md:grid-cols-5` ensures even spacing
