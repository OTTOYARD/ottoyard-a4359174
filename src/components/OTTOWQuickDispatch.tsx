// Helper for OttoCommand AI to dispatch OTTOW
import { vehicles } from "@/data/mock";
import { useIncidentsStore } from "@/stores/incidentsStore";
import { IncidentType } from "@/data/incidents-mock";

export function createOTTOWDispatchFromAI(params: {
  city: string;
  vehicleId?: string;
  type?: IncidentType;
  summary?: string;
}): { success: boolean; incidentId?: string; message: string; vehicles?: any[] } {
  const { city, vehicleId, type = "malfunction", summary = "Incident reported via OttoCommand AI" } = params;
  
  // Get city vehicles for selection
  const cityVehicles = vehicles
    .filter((v) => {
      const depotCity = v.currentDepotId?.includes("nash") ? "Nashville" :
                       v.currentDepotId?.includes("austin") ? "Austin" : "LA";
      return depotCity === city;
    })
    .slice(0, 4) // Return top 4
    .map((v, idx) => ({
      id: v.id,
      soc: v.soc,
      label: String.fromCharCode(65 + idx), // A, B, C, D
      distance: (Math.random() * 3).toFixed(1), // Mock distance
    }));
  
  // If no vehicle selected, return options
  if (!vehicleId) {
    return {
      success: false,
      message: `Select a vehicle:\n${cityVehicles.map(v => `${v.label}) ${v.id} (${v.distance} mi)`).join('\n')}`,
      vehicles: cityVehicles,
    };
  }
  
  // Dispatch the tow
  const incidentId = useIncidentsStore.getState().dispatchOTTOW(vehicleId, city, type, summary);
  
  return {
    success: true,
    incidentId,
    message: `OTTOW dispatched for ${vehicleId}. Incident ${incidentId} created with ETA 6 min.`,
  };
}

// Export for use in edge function
export const ottowDispatchTool = {
  name: "dispatch_ottow_tow",
  description: "Dispatch OTTOW tow service for a vehicle in a specific city. First call without vehicleId to get options.",
  input_schema: {
    type: "object",
    properties: {
      city: { type: "string", enum: ["Nashville", "Austin", "LA"] },
      vehicleId: { type: "string", description: "Optional: specific vehicle ID to dispatch for" },
      type: { type: "string", enum: ["collision", "malfunction", "interior", "vandalism"] },
      summary: { type: "string", description: "Brief incident description" },
    },
    required: ["city"],
  },
};
