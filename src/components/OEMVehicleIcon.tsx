import React from "react";

// OEM vehicle images - realistic mini icons
import waymoIcon from "@/assets/oem-icons/waymo.png";
import zooxIcon from "@/assets/oem-icons/zoox.png";
import motionalIcon from "@/assets/oem-icons/motional.png";
import cruiseIcon from "@/assets/oem-icons/cruise.png";
import auroraIcon from "@/assets/oem-icons/aurora.png";
import nuroIcon from "@/assets/oem-icons/nuro.png";
import teslaIcon from "@/assets/oem-icons/tesla.png";
import mayMobilityIcon from "@/assets/oem-icons/may-mobility.png";
import aptivIcon from "@/assets/oem-icons/aptiv.png";
import defaultIcon from "@/assets/oem-icons/default.png";

// Map OEM names to their vehicle images
const oemIconMap: Record<string, string> = {
  waymo: waymoIcon,
  zoox: zooxIcon,
  motional: motionalIcon,
  cruise: cruiseIcon,
  aurora: auroraIcon,
  nuro: nuroIcon,
  tesla: teslaIcon,
  tensor: teslaIcon, // Tensor uses Tesla vehicles
  "may mobility": mayMobilityIcon,
  "may-mobility": mayMobilityIcon,
  maymobility: mayMobilityIcon,
  aptiv: aptivIcon,
  argo: defaultIcon,
  baidu: defaultIcon,
  apollo: defaultIcon,
};

// Size presets for consistent usage - slightly larger for cleaner vehicle display
const sizePresets = {
  xs: "h-5 w-5",
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
  xl: "h-14 w-14",
  "2xl": "h-20 w-20",
};

interface OEMVehicleIconProps {
  /** The OEM name or vehicle name containing the OEM (e.g., "Waymo", "Waymo BUS07", "ZX-GEN1-19") */
  name: string;
  /** Size preset or custom Tailwind classes */
  size?: keyof typeof sizePresets | string;
  /** Additional CSS classes */
  className?: string;
  /** Show rounded corners */
  rounded?: boolean;
  /** Show with a subtle background */
  withBackground?: boolean;
}

/**
 * Extracts the OEM name from various formats:
 * - "Waymo" -> "waymo"
 * - "Waymo BUS07" -> "waymo"
 * - "WM-PAC-05" -> "waymo" (Waymo prefix)
 * - "ZX-GEN1-19" -> "zoox" (Zoox prefix)
 * - "CR-ORG-27" -> "cruise" (Cruise prefix)
 * - "TE-MOD3-06" -> "tesla" (Tesla prefix)
 * - "NR-R2-18" -> "nuro" (Nuro prefix)
 * - "AU-XC90-31" -> "aurora" (Aurora prefix)
 * - "MO-I5-42" -> "motional" (Motional prefix)
 */
function extractOEM(name: string): string {
  const normalized = name.toLowerCase().trim();
  
  // Check direct OEM name match
  for (const oem of Object.keys(oemIconMap)) {
    if (normalized.startsWith(oem)) {
      return oem;
    }
  }
  
  // Check ID prefix patterns
  const prefixMap: Record<string, string> = {
    "wm-": "waymo",
    "wm_": "waymo",
    "zx-": "zoox",
    "zx_": "zoox",
    "cr-": "cruise",
    "cr_": "cruise",
    "te-": "tesla",
    "te_": "tesla",
    "nr-": "nuro",
    "nr_": "nuro",
    "au-": "aurora",
    "au_": "aurora",
    "mo-": "motional",
    "mo_": "motional",
    "mm-": "may mobility",
    "mm_": "may mobility",
    "ap-": "aptiv",
    "ap_": "aptiv",
  };
  
  for (const [prefix, oem] of Object.entries(prefixMap)) {
    if (normalized.startsWith(prefix)) {
      return oem;
    }
  }
  
  // Fallback: check if any OEM name appears anywhere in the string
  for (const oem of Object.keys(oemIconMap)) {
    if (normalized.includes(oem)) {
      return oem;
    }
  }
  
  return "default";
}

/**
 * Displays a realistic mini vehicle icon based on the OEM name.
 * Automatically extracts the OEM from vehicle names/IDs.
 */
export function OEMVehicleIcon({
  name,
  size = "sm",
  className = "",
  rounded = true,
  withBackground = false,
}: OEMVehicleIconProps) {
  const oem = extractOEM(name);
  const iconSrc = oemIconMap[oem] || defaultIcon;
  
  // Get size classes
  const sizeClasses = size in sizePresets 
    ? sizePresets[size as keyof typeof sizePresets]
    : size;
  
  const containerClasses = [
    "flex-shrink-0 overflow-hidden",
    rounded ? "rounded-md" : "",
    withBackground ? "bg-muted/50 p-0.5" : "",
    className,
  ].filter(Boolean).join(" ");
  
  return (
    <div className={containerClasses}>
      <img
        src={iconSrc}
        alt={`${oem} vehicle`}
        className={`${sizeClasses} object-contain`}
        loading="lazy"
      />
    </div>
  );
}

/**
 * Hook to get the OEM icon source for a given name
 */
export function useOEMIcon(name: string): string {
  const oem = extractOEM(name);
  return oemIconMap[oem] || defaultIcon;
}

/**
 * Get just the OEM name extracted from a vehicle name/ID
 */
export function getOEMName(name: string): string {
  const oem = extractOEM(name);
  if (oem === "default") return "Unknown";
  // Capitalize first letter of each word
  return oem.split(" ").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");
}

export default OEMVehicleIcon;
