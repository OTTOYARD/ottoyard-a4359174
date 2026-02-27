import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseVehicleRenderProps {
  make: string;
  model: string;
  year?: number;
  color?: string;
}

interface UseVehicleRenderResult {
  imageUrl: string;
  isGenerating: boolean;
  isAIRendered: boolean;
}

const FALLBACK_IMAGE = "/tesla-model-3.png";

export function useVehicleRender({ make, model, year, color }: UseVehicleRenderProps): UseVehicleRenderResult {
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAIRendered, setIsAIRendered] = useState(false);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!make || !model || requestedRef.current) return;
    requestedRef.current = true;

    const safeColor = (color || "default").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const fileName = `${make}-${model}-${year || "latest"}-${safeColor}.png`.toLowerCase();
    const storagePath = `renders/v2/${fileName}`;

    // Check cache first
    const checkCacheAndGenerate = async () => {
      try {
        // Try to get public URL and verify file exists
        const { data: downloadCheck } = await supabase.storage
          .from("vehicle-renders")
          .download(storagePath);

        if (downloadCheck) {
          const { data: publicUrlData } = supabase.storage
            .from("vehicle-renders")
            .getPublicUrl(storagePath);
          setImageUrl(publicUrlData.publicUrl + "?t=" + Date.now());
          setIsAIRendered(true);
          return;
        }
      } catch {
        // File doesn't exist, proceed to generate
      }

      // Generate via edge function
      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-vehicle-render", {
          body: { make, model, year, color },
        });

        if (error) {
          console.error("Vehicle render generation error:", error);
          return;
        }

        if (data?.imageUrl) {
          setImageUrl(data.imageUrl + "?t=" + Date.now());
          setIsAIRendered(true);
        }
      } catch (err) {
        console.error("Failed to generate vehicle render:", err);
      } finally {
        setIsGenerating(false);
      }
    };

    checkCacheAndGenerate();
  }, [make, model, year, color]);

  return { imageUrl, isGenerating, isAIRendered };
}
