import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_PROMPT_TEMPLATE = (make: string, model: string, year: string, color: string) =>
  `AAA video game 3D CG render of a ${year} ${make} ${model} in ${color}. Unreal Engine 5 quality, real-time ray tracing. Three-quarter front hero angle, the car is the centerpiece. Dramatic volumetric rim lighting from behind with cyan-blue edge glow. Subsurface scattering on metallic car paint showing flake and depth. Pure black void background, zero distractions. Reflective dark ground plane with subtle mirror reflection of the undercarriage. Cinematic depth of field with the front quarter panel tack-sharp. No text, no watermarks, no UI elements, no license plates. Studio-quality 4K resolution, hyperdetailed mesh geometry visible on wheels and grille. The render should look like a Gran Turismo 7 or Forza Motorsport car showcase screenshot.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { make, model, year, color } = await req.json();
    if (!make || !model) {
      return new Response(JSON.stringify({ error: "make and model are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Build a v2 cache key to bypass old flat-photo renders
    const safeColor = (color || "default").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const fileName = `${make}-${model}-${year || "latest"}-${safeColor}.png`.toLowerCase();
    const storagePath = `renders/v2/${fileName}`;

    // Check if render already exists in storage
    const { data: downloadCheck, error: downloadError } = await supabase.storage
      .from("vehicle-renders")
      .download(storagePath);

    if (downloadCheck && !downloadError) {
      const { data: existingFile } = supabase.storage
        .from("vehicle-renders")
        .getPublicUrl(storagePath);

      console.log("Cache hit for", storagePath);
      return new Response(
        JSON.stringify({ imageUrl: existingFile.publicUrl, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Stage 1: AI Prompt Engineering (Gemini Flash text) ──
    const yearStr = year ? String(year) : "";
    const colorStr = color || "Midnight Silver Metallic";
    let imagePrompt: string;

    try {
      console.log("Stage 1: Generating expert prompt via Gemini Flash...");

      const promptEngResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a world-class 3D vehicle rendering art director who specializes in AAA video game car showcases. Given a vehicle's specifications, you write the perfect image generation prompt to produce a stunning 3D CG render that looks like it came from Gran Turismo 7, Forza Motorsport, or an Unreal Engine 5 real-time demo.

Your prompts MUST specify:
- Three-quarter front hero angle (slightly below eye level for dramatic effect)
- Volumetric rim lighting from behind with colored edge glow
- Subsurface scattering on car paint showing metallic flake depth
- Pure black void background with zero distractions
- Dark reflective ground plane showing subtle car reflection
- Cinematic depth of field
- Hyperdetailed mesh geometry on wheels, grille, headlights
- No text, watermarks, UI elements, or license plates
- 4K studio quality, real-time ray tracing look

Return ONLY the prompt text. No explanations, no quotes, no prefixes.`,
            },
            {
              role: "user",
              content: `Write an image generation prompt for: ${yearStr} ${make} ${model} in ${colorStr} color.`,
            },
          ],
        }),
      });

      if (!promptEngResponse.ok) {
        const errText = await promptEngResponse.text();
        console.warn("Stage 1 failed, using fallback prompt:", promptEngResponse.status, errText);
        imagePrompt = FALLBACK_PROMPT_TEMPLATE(make, model, yearStr, colorStr);
      } else {
        const promptData = await promptEngResponse.json();
        const craftedPrompt = promptData.choices?.[0]?.message?.content?.trim();

        if (craftedPrompt && craftedPrompt.length > 50) {
          imagePrompt = craftedPrompt;
          console.log("Stage 1 success, crafted prompt length:", imagePrompt.length);
        } else {
          console.warn("Stage 1 returned empty/short prompt, using fallback");
          imagePrompt = FALLBACK_PROMPT_TEMPLATE(make, model, yearStr, colorStr);
        }
      }
    } catch (e) {
      console.warn("Stage 1 exception, using fallback:", e);
      imagePrompt = FALLBACK_PROMPT_TEMPLATE(make, model, yearStr, colorStr);
    }

    // ── Stage 2: Image Generation (Gemini Flash Image) ──
    console.log("Stage 2: Generating 3D render with crafted prompt...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Stage 2 AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("No image returned from AI");
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image data format");

    const base64String = base64Match[1];
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("vehicle-renders")
      .upload(storagePath, bytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from("vehicle-renders")
      .getPublicUrl(storagePath);

    console.log("3D render generated and cached:", publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({ imageUrl: publicUrlData.publicUrl, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-vehicle-render error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
