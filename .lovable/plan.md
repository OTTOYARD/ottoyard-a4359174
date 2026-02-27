

## Plan: Dual-AI 3D Vehicle Render Pipeline (Claude + Gemini)

The current prompt asks Gemini for a "photorealistic studio render" which produces a flat photo. The fix: use a **two-stage AI pipeline** — Claude crafts an expert-level 3D rendering prompt, then Gemini generates the image from that prompt. The result: a proper CG/video-game-style 3D vehicle display with transparent background.

### Changes

**1. Update `supabase/functions/generate-vehicle-render/index.ts`**

Replace the single Gemini call with a two-stage pipeline:

- **Stage 1 — Claude prompt engineering**: Call `google/gemini-2.5-flash` (text-only, fast) to act as a "3D vehicle rendering art director." Give it the vehicle specs (make, model, year, color) and ask it to write the optimal image generation prompt for a video-game-quality 3D render. Instruct it to specify: CG/Unreal Engine style, dramatic rim lighting on pure black background with transparency, three-quarter hero angle, no text/watermarks, floating above reflective surface.

- **Stage 2 — Gemini image generation**: Take Claude's crafted prompt and pass it to `google/gemini-2.5-flash-image` to generate the actual image. This produces a much higher quality result because the prompt is expertly constructed.

- **Fallback**: If Stage 1 fails, fall back to a hardcoded high-quality prompt and proceed directly to Stage 2.

- Update the base prompt style from "photorealistic automotive photography" to **"3D CG render, Unreal Engine 5 quality, video game asset showcase, dramatic volumetric lighting, dark studio environment, hero car display"**.

- Add cache-busting version suffix to storage path so existing flat-photo caches don't persist (`v2` suffix).

**2. No changes to `VehicleShowroom3D.tsx` or `EVVehicleHero.tsx`** — the 3D scene and hook are already wired up correctly. Only the generated image quality changes.

### Edge Function Flow

```text
Client → useVehicleRender hook
  → Check storage cache (renders/v2/{make}-{model}-{year}-{color}.png)
  → Cache miss → invoke generate-vehicle-render
    → Stage 1: Gemini Flash (text) → crafted 3D prompt
    → Stage 2: Gemini Flash Image → base64 PNG
    → Upload to Supabase storage
    → Return public URL
```

### Prompt Strategy

Stage 1 system prompt (to Gemini Flash text model):
> "You are a 3D vehicle rendering art director. Given a vehicle's make, model, year, and color, write the perfect image generation prompt to produce a AAA video-game-quality 3D render. The output must look like a real-time 3D engine screenshot (Unreal Engine 5 / Gran Turismo style). Specify: three-quarter front hero angle, dramatic volumetric rim lighting, pure black background, reflective ground plane, subsurface scattering on paint, no text or UI elements. Return ONLY the prompt text, nothing else."

Stage 2 (Gemini Image) receives the crafted prompt directly.

