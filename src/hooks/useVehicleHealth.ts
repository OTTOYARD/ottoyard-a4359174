import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HealthScore {
  overall_score: number;
  status: string;
  components: any[];
  alerts: any[];
  last_updated: string;
}

interface PredictiveMaintenanceResponse {
  success: boolean;
  health_score: HealthScore;
  predictions: any[];
  maintenance_schedule: any;
  cost_projections: any;
  summary: any;
}

export const useVehicleHealth = () => {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<PredictiveMaintenanceResponse | null>(null);

  const fetchHealthScore = async (vehicleId: string, predictDays: number = 30) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('predictive-maintenance', {
        body: {
          vehicleId,
          predictDays,
          maintenanceHistory: [],
          telemetryData: {}
        }
      });

      if (error) throw error;

      if (data.success) {
        setHealthData(data);
        
        // Show alerts if any critical components
        if (data.health_score.alerts.length > 0) {
          const criticalAlerts = data.health_score.alerts.filter((a: any) => a.severity === 'critical');
          if (criticalAlerts.length > 0) {
            toast.warning(`${criticalAlerts.length} critical component(s) need attention!`);
          }
        }
        
        return data;
      } else {
        throw new Error('Failed to fetch health score');
      }
    } catch (error) {
      console.error('Error fetching vehicle health:', error);
      toast.error('Failed to load vehicle health data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    healthData,
    fetchHealthScore
  };
};
