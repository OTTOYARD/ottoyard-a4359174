

# Fix Mobile Overlaps and Tighten Header

## 1. Header -- Bring words closer to logo

**File: `src/components/shared/AppHeader.tsx`**
- Reduce the gap between the logo image and the text column from `gap-2.5` to `gap-1.5`
- Reduce logo size on mobile from `w-[60px] h-[60px]` to `w-[48px] h-[48px]`
- Reduce outer padding from `px-3 pt-3 pb-2` to `px-3 pt-2 pb-1` for a tighter header

## 2. Overview Vehicle Card -- Fix overlap

**File: `src/components/orchestra-ev/EVVehicleHero.tsx`**
- The collapsible trigger button has the vehicle name and badge+chevron in a horizontal flex row that overflows on narrow screens
- Fix: Make the trigger layout stack vertically on mobile by changing from a single row to `flex-col` on small screens, or use `flex-wrap` so the badge wraps below the vehicle name
- Reduce the vehicle name text slightly to prevent overflow

## 3. OTTOW Tab -- Fix button overlap

**File: `src/components/orchestra-ev/EVTowing.tsx`**
- The two CTA buttons ("Dispatch to My Location" and "Request OTTOW") sit side-by-side on mobile with `flex gap-2 w-full` -- the text is too long and causes overlap
- Fix: Change the button container to stack vertically on mobile using `flex-col` instead of `flex` so the buttons go full-width and don't overlap
- Use `sm:flex-row` to keep them side-by-side on larger screens

## Technical Details

### AppHeader.tsx changes
- Line 34: `gap-2.5` to `gap-1.5`  
- Line 38: `w-[60px] h-[60px]` to `w-[48px] h-[48px]`
- Line 30: `px-3 pt-3 pb-2` to `px-3 pt-2 pb-1`

### EVVehicleHero.tsx changes
- Line 54: Add `flex-col sm:flex-row` to the trigger button's inner layout so vehicle info and badge wrap on mobile
- Adjust the right-side badge/chevron group to not overlap by allowing wrapping

### EVTowing.tsx changes  
- Line 85: Change `flex gap-2` to `flex flex-col sm:flex-row gap-2` so the two CTA buttons stack vertically on mobile

