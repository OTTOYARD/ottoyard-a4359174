

# Update Site Logo (No White Background)

## Overview
Replace the current site logo everywhere with the uploaded red hexagon image, and ensure it renders without any white background artifacts against the dark UI.

## Changes

### 1. Copy new logo asset
- Copy `user-uploads://Untitled_design_7-2.png` to `public/ottoyard-logo-new.png` (overwriting the current file)
- Also copy to `src/assets/ottoyard-logo.png` (used by the Auth page via ES6 import)

### 2. Ensure no white background shows
The uploaded PNG appears to have a white background. To handle this:
- Apply `mix-blend-mode: multiply` or use a CSS approach to blend the white away on dark backgrounds
- Alternatively, if the image has transparency already, just ensure no container adds a white/light background behind it

### 3. Files affected
- **`src/components/shared/AppHeader.tsx`** - Main header logo (already references `/ottoyard-logo-new.png`)
- **`src/pages/Auth.tsx`** - Login page logo (imports from `@/assets/ottoyard-logo.png`)
- **`src/pages/Install.tsx`** - PWA install page logo (references `/ottoyard-logo-new.png`)

For each location, ensure the `<img>` tag does not have any background container styling that would show white, and add a transparent-background-friendly class if needed.

### Technical Details

The logo image will be copied to both:
- `public/ottoyard-logo-new.png` (for direct URL references in AppHeader and Install)
- `src/assets/ottoyard-logo.png` (for the ES6 import in Auth.tsx)

If the PNG has a white background baked into the pixels, we'll add `className="mix-blend-screen"` (for dark backgrounds) or `"mix-blend-multiply"` (for light backgrounds) to visually remove it. Since the app uses a dark theme, `mix-blend-screen` will make white pixels transparent against dark backgrounds.

On the Install page, the logo sits inside a container with `bg-gradient-to-br from-primary/20 to-primary/5` -- we'll keep that but ensure no solid white shows through.

