

# Replace Header Logo with New Image

## Change
Save the uploaded red hexagon logo to `public/ottoyard-logo-new.png` (replacing the current file) so it takes effect everywhere the logo is referenced. No code changes needed since `AppHeader.tsx` already references `/ottoyard-logo-new.png` at 48x48px.

## Steps
1. Copy `user-uploads://Untitled_design_10-2.png` to `public/ottoyard-logo-new.png`, overwriting the existing logo
2. No code edits required -- the `img` tag already uses this path with `w-[48px] h-[48px]`

