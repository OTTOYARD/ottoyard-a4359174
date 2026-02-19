

# Fix Logo White Background (For Real This Time)

## Root Cause
The uploaded logo PNG (`Untitled_design_8.png`) has **white pixels baked into the image** -- it is NOT a transparent PNG. The corners, the inner hexagon hole, and surrounding area are all solid white. The last edit removed the `mix-blend-multiply` CSS workaround, which made the problem visible again.

## Solution
Since we cannot edit the image pixels directly in Lovable, we will use a CSS approach that reliably hides the white:

1. **Wrap each logo `<img>` in a dark-background container** and apply `mix-blend-multiply` to the image
2. `mix-blend-multiply` makes white pixels take on the color of whatever is behind them -- so with a dark container, white becomes dark
3. The container gets `overflow-hidden` and `rounded` to cleanly clip edges

## Changes

### `src/components/shared/AppHeader.tsx`
- Wrap the logo `<img>` in a `<div>` with `className="bg-background rounded-lg overflow-hidden"`
- Add `mix-blend-multiply` back to the `<img>` tag
- This ensures the white background blends into a dark container reliably, regardless of the glass-panel behind it

### `src/pages/Auth.tsx` (two locations: reset password view + main login view)
- Same approach: wrap logo in a dark-background container with `rounded-xl overflow-hidden`
- Add `mix-blend-multiply` to the `<img>` tag
- The Card background is lighter, so we explicitly set `bg-[#1a1a2e]` or `bg-background` on the wrapper

### `src/pages/Install.tsx`
- Same wrapper approach for the Install page logo

## Why This Will Work Now
The previous `mix-blend-multiply` attempt failed because the logo was sitting on a **semi-transparent glass-panel** with no solid color behind it. By adding an explicit dark background container directly behind the image, `multiply` has a solid dark color to blend against, making white pixels appear dark (matching the container).

## Alternative
If you can provide a version of the logo with actual transparency (e.g., exported from Canva with "transparent background" checked), that would be the cleanest solution and we could remove all blend-mode workarounds entirely.
