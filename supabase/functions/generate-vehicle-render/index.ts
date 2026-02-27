import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Build a cache key
    const safeColor = (color || "default").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const fileName = `${make}-${model}-${year || "latest"}-${safeColor}.png`.toLowerCase();
    const storagePath = `renders/${fileName}`;

    // Check if render already exists in storage
    const { data: existingFile } = await supabase.storage
      .from("vehicle-renders")
      .getPublicUrl(storagePath);

    // Try to download to verify it actually exists
    const { data: downloadCheck, error: downloadError } = await supabase.storage
      .from("vehicle-renders")
      .download(storagePath);

    if (downloadCheck && !downloadError) {
      console.log("Cache hit for", storagePath);
      return new Response(
        JSON.stringify({
          imageUrl: existingFile.publicUrl,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate via Gemini image model
    const prompt = `Photorealistic 3D studio render of a ${year || ""} ${make} ${model} in ${color || "Midnight Silver Metallic"} color. Dramatic automotive showroom lighting with soft key light from upper left and rim light from behind. Dark gradient background fading to black. Three-quarter front angle view showing the full vehicle. Ultra high resolution, 4K quality, automotive photography style. The car should appear to float on a reflective dark surface with subtle reflections beneath. No text, no watermarks, clean studio shot.`;

    console.log("Generating render with prompt:", prompt);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

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

    // Extract base64 data (remove data:image/png;base64, prefix)
    const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image data format");

    const base64String = base64Match[1];

    // Decode base64 to Uint8Array
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

    console.log("Render generated and cached:", publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({
        imageUrl: publicUrlData.publicUrl,
        cached: false,
      }),
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
