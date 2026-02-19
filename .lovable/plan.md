

# Fix Logo White Background

## Problem
The uploaded logo PNG has a white/light background baked into the image pixels. The `mix-blend-screen` CSS trick only works reliably when the container behind the image has a solid dark background. However, the header uses a `glass-panel` class with semi-transparent backgrounds and backdrop blur, causing the white background to partially show through.

## Solution
The most reliable fix is to **not rely on CSS blend modes** and instead take a two-pronged approach:

1. **Re-export the logo with actual transparency** -- Since we can't edit the image file directly, we'll use a CSS `filter` approach that works better than `mix-blend-screen` for this case.

2. **Use a combination of CSS techniques** to hide the white background:
   - Wrap the logo in a container with a dark background that matches the surrounding panel
   - Apply `mix-blend-multiply` instead of `mix-blend-screen` -- `multiply` makes white pixels transparent regardless of the container's darkness level
   - As a fallback, add a dark background directly behind the logo image

## Technical Details

### `src/components/shared/AppHeader.tsx`
- Change `mix-blend-screen` to `mix-blend-multiply` on the logo `<img>` tag
- Note: `mix-blend-multiply` makes white become transparent (white x any color = that color), which is the correct blend mode for removing white backgrounds. `mix-blend-screen` is for removing black backgrounds.

### `src/pages/Auth.tsx`
- Same fix: change both logo `<img>` instances from `mix-blend-screen` to `mix-blend-multiply`
- The Auth page has a dark background (`from-background via-background to-primary/5`), but the Card component is lighter, so `multiply` is the correct choice here too

### `src/pages/Install.tsx`
- Same fix on the Install page logo

### Why `multiply` instead of `screen`?
- `mix-blend-screen`: makes **black** pixels transparent (good for removing black backgrounds)
- `mix-blend-multiply`: makes **white** pixels transparent (good for removing white backgrounds)

The previous fix used `screen` which is the wrong mode -- it was designed for the opposite problem. Switching to `multiply` should properly eliminate the white background on all pages.

