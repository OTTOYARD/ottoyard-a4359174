
# Add Tesla Model 3 Image to Vehicle Hero Card

## Goal
Replace the generic Car icon placeholder in the EVVehicleHero component with an actual 2024 Tesla Model 3 Long Range image.

## Steps

### 1. Add Tesla Model 3 image asset
- Save a clean Tesla Model 3 image to `public/tesla-model-3.png`
- I'll use a publicly available Tesla Model 3 side-profile image (transparent or clean background)

### 2. Update EVVehicleHero.tsx
Replace the icon placeholder div (lines 56-58):
```
<div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
  <Car className="h-5 w-5 text-primary" />
</div>
```
With an actual image:
```
<img
  src="/tesla-model-3.png"
  alt="2024 Tesla Model 3 Long Range"
  className="w-12 h-8 object-contain flex-shrink-0 rounded"
/>
```
- Slightly wider aspect ratio (48x32px) to fit a car side-profile naturally
- `object-contain` ensures the image scales without cropping
- Remove the `Car` icon import if no longer used elsewhere

### 3. Clean up unused import
- Remove `Car` from the lucide-react import since it's no longer needed in this component
