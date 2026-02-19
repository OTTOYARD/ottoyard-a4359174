

# Larger Tesla Model 3 Image with Transparent Background

## Changes

### 1. Regenerate the image (`public/tesla-model-3.png`)
- Use the image generation API to create a new 2024 Tesla Model 3 Long Range image with a **transparent/no background** (prompt will specify transparent background, studio lighting, side profile)
- Save to `public/tesla-model-3.png`, replacing the current file

### 2. Increase image size in `EVVehicleHero.tsx`
- Change the image classes from `w-12 h-8` to `w-20 h-14` (80x56px instead of 48x32px) for a noticeably larger vehicle image in the card header

