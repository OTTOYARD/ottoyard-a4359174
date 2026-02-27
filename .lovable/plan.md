

## Plan: AI-Generated 3D Vehicle Render with Premium Showroom

The current implementation just slaps a flat PNG on a spinning plane — that's why it looks like a rotating 2D picture. The fix: use **Gemini image generation** to produce a photorealistic studio-quality render of the vehicle, cache it in Supabase storage, and display it in an upgraded 3D environment.

### Architecture

```text
EVVehicleHero
├── VehicleShowroom3D (upgraded)
│   ├── AI-generated vehicle image (from Supabase storage)
│   ├── Environment map (HDR-style gradient skybox)
│   ├── Reflective floor with blur
│   ├── Volumetric-style fog + particles
│   └── Cinematic lighting rig
├── Edge function: generate-vehicle-render
│   ├── Calls Gemini image model (google/gemini-2.5-flash-image)
│   ├── Generates photorealistic 3D studio render
│   └── Stores result in Supabase storage bucket
└── Hook: useVehicleRender (manages generation + caching)
```

### Implementation Steps

**1. Create Supabase storage bucket `vehicle-renders`**
- Public bucket for serving cached renders
- RLS policy allowing authenticated reads and service-role writes

**2. Create edge function `generate-vehicle-render`**
- Accepts `{ make, model, year, color }` 
- Builds a detailed prompt: *"Photorealistic 3D studio render of a {year} {make} {model} in {color}, dramatic showroom lighting, dark background, high detail, 4K quality, three-quarter front angle, automotive photography style"*
- Calls `google/gemini-2.5-flash-image` via Lovable AI gateway
- Decodes base64 result, uploads to `vehicle-renders/{make}-{model}-{year}-{color}.png`
- Returns the public URL
- Checks storage first to avoid regenerating existing renders

**3. Create `src/hooks/useVehicleRender.ts`**
- Takes `{ make, model, year, color }`
- First checks if render exists in storage bucket
- If not, calls the edge function to generate it
- Returns `{ imageUrl, isGenerating }` 
- Falls back to `/tesla-model-3.png` while generating

**4. Upgrade `VehicleShowroom3D.tsx`**
- Accept `imageUrl` prop instead of hardcoded PNG
- Replace flat `planeGeometry` with a curved billboard that has slight depth (using `CylinderGeometry` segment or subtle curve)
- Add `Environment` component from drei for ambient reflections
- Add volumetric fog effect using a gradient sphere behind the car
- Improve floor with grid lines and stronger metallic reflection
- Add rim light effect (backlight spotlight) for the "studio" look
- Increase canvas height for more cinematic framing
- Higher DPR `[1, 2]` for sharper rendering

**5. Update `EVVehicleHero.tsx`**
- Import and use `useVehicleRender` hook
- Pass generated `imageUrl` to `VehicleShowroom3D`
- Show a shimmer/generating indicator while AI render is being created
- Display "AI Rendered" badge once generated

### What the user sees
- On first load: existing PNG with a subtle "Generating HD render..." indicator
- After ~5-10 seconds: the AI-generated photorealistic studio render fades in
- Subsequent visits: cached render loads instantly from storage
- The 3D scene has cinematic depth — fog, reflections, rim lighting, particles — not just a flat image spinning

