// src/services/predictive-engine.ts
// Predictive Analytics Engine for OttoCommand AI
// Provides charging, maintenance, incident, and demand predictions

import { Vehicle, Priority } from "../agent/tools";
import { fleetIntelligence, vehicles as mockVehicles, depots, maintenanceInsights } from "../data/mock";

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface PredictionFactor {
  name: string;
  weight: number;
  value: number | string;
  direction: "positive" | "negative" | "neutral";
  description: string;
}

export interface PredictionResult<T> {
  prediction: T;
  confidence: number;
  factors: PredictionFactor[];
  timestamp: string;
  modelVersion: string;
}

export interface ChargingPrediction {
  vehicleId: string;
  vehicleName: string;
  currentSoc: number;
  predictedSocAtHorizon: number;
  recommendedChargeTime: string;
  urgency: Priority;
  estimatedChargeMinutes: number;
  suggestedDepotId: string;
  suggestedStallId?: string;
  reason: string;
  drainRate: number; // SOC % per hour
}

export interface MaintenanceRisk {
  vehicleId: string;
  vehicleName: string;
  riskScore: number;
  category: string;
  predictedFailureWindow: {
    earliest: string;
    latest: string;
  };
  recommendedAction: string;
  estimatedCost: number;
  components: ComponentRisk[];
  urgency: Priority;
}

export interface ComponentRisk {
  component: string;
  riskScore: number;
  indicators: string[];
  lastServiced?: string;
}

export interface IncidentRisk {
  vehicleId: string;
  vehicleName: string;
  riskScore: number;
  primaryFactors: string[];
  recommendedActions: string[];
  affectedRoutes: string[];
  urgency: Priority;
}

export interface DemandForecast {
  timestamp: string;
  hour: number;
  resourceType: string;
  predictedDemand: number;
  capacity: number;
  utilizationPercent: number;
  recommendation: string;
  confidence: number;
}

export interface DepotDemandForecast {
  depotId: string;
  depotName: string;
  forecasts: DemandForecast[];
  peakHours: number[];
  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class PredictiveEngine {
  private static readonly MODEL_VERSION = "1.0.0";

  // ─────────────────────────────────────────────────────────────────────────────
  // CHARGING PREDICTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  static predictChargingNeeds(params: {
    horizonHours?: number;
    city?: string;
    depotId?: string;
    socThreshold?: number;
    includeRecommendations?: boolean;
  }): PredictionResult<ChargingPrediction[]> {
    const {
      horizonHours = 4,
      city,
      depotId,
      socThreshold = 0.30,
      includeRecommendations = true
    } = params;

    const factors: PredictionFactor[] = [];
    const now = new Date();

    // Filter vehicles
    let targetVehicles = [...mockVehicles];
    if (city) {
      targetVehicles = targetVehicles.filter(v => v.city?.toLowerCase() === city.toLowerCase());
    }
    if (depotId) {
      targetVehicles = targetVehicles.filter(v => v.currentDepotId === depotId);
    }

    // Calculate predictions for each vehicle
    const predictions: ChargingPrediction[] = targetVehicles
      .filter(v => v.status !== "charging" && v.status !== "maintenance")
      .map(vehicle => {
        // Estimate SOC drain rate based on operational metrics
        const avgDailyDistance = vehicle.operationalMetrics?.avgDailyDistance || 150;
        const energyConsumption = vehicle.operationalMetrics?.energyConsumption || 90;
        const batteryCapacity = vehicle.batteryCapacity || 100;

        // Calculate hourly drain rate (assuming 12 active hours)
        const dailyEnergyUse = (avgDailyDistance / 100) * energyConsumption;
        const hourlyDrain = (dailyEnergyUse / batteryCapacity) / 12; // SOC % per hour

        // Predict SOC at horizon
        const currentSoc = vehicle.soc || 0.5;
        const predictedSoc = Math.max(0, currentSoc - (hourlyDrain * horizonHours));

        // Determine urgency
        let urgency: Priority = "low";
        if (currentSoc < 0.15 || predictedSoc < 0.10) urgency = "critical";
        else if (currentSoc < 0.25 || predictedSoc < 0.20) urgency = "high";
        else if (predictedSoc < socThreshold) urgency = "medium";

        // Calculate recommended charge time
        const hoursUntilThreshold = currentSoc > socThreshold
          ? (currentSoc - socThreshold) / hourlyDrain
          : 0;
        const recommendedTime = new Date(now.getTime() + hoursUntilThreshold * 60 * 60 * 1000);

        // Estimate charge time to 80%
        const energyNeeded = (0.80 - currentSoc) * batteryCapacity;
        const avgChargingPower = 250; // kW average
        const estimatedChargeMinutes = Math.round((energyNeeded / avgChargingPower) * 60);

        // Find suggested depot
        const suggestedDepot = vehicle.currentDepotId || depots[0]?.id || "depot-waymo-nash";

        return {
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.make} ${vehicle.model}`,
          currentSoc: Math.round(currentSoc * 100),
          predictedSocAtHorizon: Math.round(predictedSoc * 100),
          recommendedChargeTime: recommendedTime.toISOString(),
          urgency,
          estimatedChargeMinutes,
          suggestedDepotId: suggestedDepot,
          reason: this.getChargingReason(currentSoc, predictedSoc, urgency),
          drainRate: Math.round(hourlyDrain * 100 * 100) / 100
        };
      })
      .filter(p => p.predictedSocAtHorizon < socThreshold * 100 || p.urgency !== "low")
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.urgency] - priorityOrder[b.urgency];
      });

    // Build factors
    factors.push({
      name: "horizon_hours",
      weight: 0.3,
      value: horizonHours,
      direction: "neutral",
      description: `Looking ahead ${horizonHours} hours`
    });
    factors.push({
      name: "soc_threshold",
      weight: 0.4,
      value: socThreshold * 100,
      direction: "neutral",
      description: `Threshold set at ${socThreshold * 100}% SOC`
    });
    factors.push({
      name: "vehicles_analyzed",
      weight: 0.2,
      value: targetVehicles.length,
      direction: "neutral",
      description: `Analyzed ${targetVehicles.length} vehicles`
    });
    factors.push({
      name: "critical_count",
      weight: 0.5,
      value: predictions.filter(p => p.urgency === "critical").length,
      direction: predictions.filter(p => p.urgency === "critical").length > 0 ? "negative" : "positive",
      description: `${predictions.filter(p => p.urgency === "critical").length} critical vehicles identified`
    });

    const confidence = this.calculateConfidence(factors, predictions.length);

    return {
      prediction: predictions,
      confidence,
      factors,
      timestamp: now.toISOString(),
      modelVersion: this.MODEL_VERSION
    };
  }

  private static getChargingReason(currentSoc: number, predictedSoc: number, urgency: Priority): string {
    if (urgency === "critical") {
      return currentSoc < 0.15
        ? "Battery critically low - immediate charging required"
        : "Will reach critical level within forecast window";
    }
    if (urgency === "high") {
      return "SOC trending toward critical threshold";
    }
    if (urgency === "medium") {
      return "Recommend charging to maintain optimal range";
    }
    return "Proactive charging suggested for fleet optimization";
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAINTENANCE PREDICTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  static predictMaintenanceRisks(params: {
    riskThreshold?: number;
    categories?: string[];
    city?: string;
    vehicleIds?: string[];
  }): PredictionResult<MaintenanceRisk[]> {
    const {
      riskThreshold = 0.6,
      categories,
      city,
      vehicleIds
    } = params;

    const factors: PredictionFactor[] = [];
    const now = new Date();

    // Filter vehicles
    let targetVehicles = [...mockVehicles];
    if (city) {
      targetVehicles = targetVehicles.filter(v => v.city?.toLowerCase() === city.toLowerCase());
    }
    if (vehicleIds?.length) {
      targetVehicles = targetVehicles.filter(v => vehicleIds.includes(v.id));
    }

    // Use existing maintenance insights and generate additional predictions
    const existingAlerts = maintenanceInsights.predictiveAlerts;

    const predictions: MaintenanceRisk[] = targetVehicles.map(vehicle => {
      // Check if vehicle has existing alert
      const existingAlert = existingAlerts.find(a => a.vehicleId === vehicle.id);

      // Calculate risk factors
      const mileageRisk = this.calculateMileageRisk(vehicle);
      const ageRisk = this.calculateAgeRisk(vehicle);
      const maintenanceDueRisk = this.calculateMaintenanceDueRisk(vehicle);
      const operationalRisk = this.calculateOperationalRisk(vehicle);

      // Weighted risk score
      const riskScore = (
        mileageRisk * 0.25 +
        ageRisk * 0.15 +
        maintenanceDueRisk * 0.35 +
        operationalRisk * 0.25
      );

      // Build component risks
      const components: ComponentRisk[] = [];

      if (mileageRisk > 0.5) {
        components.push({
          component: "drivetrain",
          riskScore: mileageRisk,
          indicators: ["High mileage", "Increased wear patterns"]
        });
      }

      if (vehicle.autonomyLevel && (vehicle.autonomyLevel === "L4" || vehicle.autonomyLevel === "L5")) {
        const sensorRisk = Math.random() * 0.3 + (mileageRisk * 0.2);
        if (sensorRisk > 0.4) {
          components.push({
            component: "autonomous_sensors",
            riskScore: sensorRisk,
            indicators: ["Sensor calibration drift", "LIDAR cleaning required"]
          });
        }
      }

      if (existingAlert) {
        components.push({
          component: existingAlert.component,
          riskScore: existingAlert.confidence,
          indicators: [existingAlert.recommendation]
        });
      }

      // Determine urgency
      let urgency: Priority = "low";
      if (riskScore > 0.8) urgency = "critical";
      else if (riskScore > 0.6) urgency = "high";
      else if (riskScore > 0.4) urgency = "medium";

      // Calculate failure window
      const daysUntilFailure = Math.round((1 - riskScore) * 30) + 5;
      const earliest = new Date(now.getTime() + daysUntilFailure * 0.7 * 86400000);
      const latest = new Date(now.getTime() + daysUntilFailure * 1.3 * 86400000);

      // Determine category
      let category = "general";
      if (components.some(c => c.component.includes("sensor"))) category = "sensors";
      else if (components.some(c => c.component === "battery")) category = "battery";
      else if (mileageRisk > 0.6) category = "general";

      return {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
        riskScore: Math.round(riskScore * 100) / 100,
        category,
        predictedFailureWindow: {
          earliest: earliest.toISOString().split("T")[0],
          latest: latest.toISOString().split("T")[0]
        },
        recommendedAction: this.getMaintenanceRecommendation(riskScore, components),
        estimatedCost: existingAlert?.costImpact || Math.round(riskScore * 5000 + 500),
        components,
        urgency
      };
    })
    .filter(p => {
      // Filter by threshold and categories
      if (p.riskScore < riskThreshold) return false;
      if (categories?.length && !categories.includes(p.category)) return false;
      return true;
    })
    .sort((a, b) => b.riskScore - a.riskScore);

    // Build factors
    factors.push({
      name: "risk_threshold",
      weight: 0.3,
      value: riskThreshold,
      direction: "neutral",
      description: `Filtering risks above ${riskThreshold * 100}%`
    });
    factors.push({
      name: "vehicles_analyzed",
      weight: 0.2,
      value: targetVehicles.length,
      direction: "neutral",
      description: `Analyzed ${targetVehicles.length} vehicles`
    });
    factors.push({
      name: "high_risk_count",
      weight: 0.5,
      value: predictions.filter(p => p.urgency === "critical" || p.urgency === "high").length,
      direction: predictions.filter(p => p.urgency === "critical").length > 2 ? "negative" : "neutral",
      description: `${predictions.filter(p => p.urgency === "high" || p.urgency === "critical").length} high-risk vehicles`
    });

    return {
      prediction: predictions,
      confidence: this.calculateConfidence(factors, predictions.length),
      factors,
      timestamp: now.toISOString(),
      modelVersion: this.MODEL_VERSION
    };
  }

  private static calculateMileageRisk(vehicle: Vehicle): number {
    const mileage = vehicle.mileage || 0;
    // Risk increases after 40k miles
    if (mileage < 20000) return 0.1;
    if (mileage < 40000) return 0.3;
    if (mileage < 60000) return 0.5;
    if (mileage < 80000) return 0.7;
    return 0.9;
  }

  private static calculateAgeRisk(vehicle: Vehicle): number {
    const engineHours = vehicle.engineHours || 0;
    // Risk increases after 2000 engine hours
    if (engineHours < 1000) return 0.1;
    if (engineHours < 2000) return 0.3;
    if (engineHours < 3000) return 0.5;
    return 0.7;
  }

  private static calculateMaintenanceDueRisk(vehicle: Vehicle): number {
    if (!vehicle.nextMaintenanceDate) return 0.5;
    const daysUntilMaintenance = Math.floor(
      (new Date(vehicle.nextMaintenanceDate).getTime() - Date.now()) / 86400000
    );
    if (daysUntilMaintenance < 0) return 1.0;
    if (daysUntilMaintenance < 7) return 0.8;
    if (daysUntilMaintenance < 14) return 0.5;
    if (daysUntilMaintenance < 30) return 0.3;
    return 0.1;
  }

  private static calculateOperationalRisk(vehicle: Vehicle): number {
    const uptime = vehicle.operationalMetrics?.uptime || 0.9;
    const utilizationRate = vehicle.operationalMetrics?.utilizationRate || 0.8;
    const maintenanceCost = vehicle.operationalMetrics?.maintenanceCostPerKm || 0.08;

    let risk = 0;
    if (uptime < 0.85) risk += 0.3;
    if (utilizationRate > 0.9) risk += 0.2; // High utilization = more wear
    if (maintenanceCost > 0.10) risk += 0.3;

    return Math.min(1, risk);
  }

  private static getMaintenanceRecommendation(riskScore: number, components: ComponentRisk[]): string {
    if (riskScore > 0.8) {
      return "Schedule immediate inspection - high probability of component failure";
    }
    if (components.some(c => c.component.includes("sensor"))) {
      return "Schedule sensor calibration and cleaning within 1 week";
    }
    if (riskScore > 0.6) {
      return "Schedule preventive maintenance within 2 weeks";
    }
    return "Continue monitoring - schedule routine check during next service window";
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INCIDENT PREDICTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  static predictIncidentLikelihood(params: {
    city?: string;
    vehicleIds?: string[];
    includeFactors?: boolean;
    routeIds?: string[];
  }): PredictionResult<IncidentRisk[]> {
    const { city, vehicleIds, includeFactors = true } = params;

    const factors: PredictionFactor[] = [];
    const now = new Date();

    // Filter vehicles
    let targetVehicles = [...mockVehicles];
    if (city) {
      targetVehicles = targetVehicles.filter(v => v.city?.toLowerCase() === city.toLowerCase());
    }
    if (vehicleIds?.length) {
      targetVehicles = targetVehicles.filter(v => vehicleIds.includes(v.id));
    }

    const predictions: IncidentRisk[] = targetVehicles.map(vehicle => {
      // Calculate risk factors
      const safetyScore = vehicle.safetyScore || 98;
      const disengagementRate = vehicle.disengagementRate || 0.0001;
      const autonomyLevel = vehicle.autonomyLevel || "L4";

      // Base risk from safety metrics
      let riskScore = (100 - safetyScore) / 100;

      // Adjust for disengagement rate
      riskScore += disengagementRate * 1000; // Scale up small numbers

      // Adjust for autonomy level
      if (autonomyLevel === "L3") riskScore *= 1.2;
      else if (autonomyLevel === "L5") riskScore *= 0.8;

      // Weather factor (simulated)
      const weatherFactor = fleetIntelligence.contextualData.currentWeather === "rain" ? 1.3 : 1.0;
      riskScore *= weatherFactor;

      // Traffic factor
      const trafficFactor = fleetIntelligence.contextualData.trafficConditions === "heavy" ? 1.2 : 1.0;
      riskScore *= trafficFactor;

      // Normalize
      riskScore = Math.min(1, Math.max(0, riskScore));

      // Determine urgency
      let urgency: Priority = "low";
      if (riskScore > 0.6) urgency = "critical";
      else if (riskScore > 0.4) urgency = "high";
      else if (riskScore > 0.2) urgency = "medium";

      // Build primary factors
      const primaryFactors: string[] = [];
      if (safetyScore < 98) primaryFactors.push(`Below-average safety score (${safetyScore})`);
      if (disengagementRate > 0.00008) primaryFactors.push("Elevated disengagement rate");
      if (autonomyLevel === "L3") primaryFactors.push("L3 autonomy requires more driver intervention");
      if (weatherFactor > 1) primaryFactors.push("Adverse weather conditions");
      if (trafficFactor > 1) primaryFactors.push("Heavy traffic conditions");

      // Recommended actions
      const recommendedActions: string[] = [];
      if (riskScore > 0.4) {
        recommendedActions.push("Consider route optimization to avoid high-risk areas");
      }
      if (disengagementRate > 0.00008) {
        recommendedActions.push("Schedule sensor calibration");
      }
      if (safetyScore < 97) {
        recommendedActions.push("Review recent driving patterns for anomalies");
      }

      return {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
        riskScore: Math.round(riskScore * 100) / 100,
        primaryFactors,
        recommendedActions,
        affectedRoutes: vehicle.currentRoute ? [vehicle.currentRoute] : [],
        urgency
      };
    })
    .filter(p => p.riskScore > 0.1)
    .sort((a, b) => b.riskScore - a.riskScore);

    factors.push({
      name: "weather_conditions",
      weight: 0.3,
      value: fleetIntelligence.contextualData.currentWeather,
      direction: fleetIntelligence.contextualData.currentWeather === "clear" ? "positive" : "negative",
      description: `Current weather: ${fleetIntelligence.contextualData.currentWeather}`
    });
    factors.push({
      name: "traffic_conditions",
      weight: 0.2,
      value: fleetIntelligence.contextualData.trafficConditions,
      direction: fleetIntelligence.contextualData.trafficConditions === "light" ? "positive" : "negative",
      description: `Traffic: ${fleetIntelligence.contextualData.trafficConditions}`
    });

    return {
      prediction: predictions,
      confidence: this.calculateConfidence(factors, predictions.length),
      factors,
      timestamp: now.toISOString(),
      modelVersion: this.MODEL_VERSION
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DEPOT DEMAND PREDICTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  static predictDepotDemand(params: {
    depotId: string;
    horizonHours?: number;
    resourceTypes?: string[];
    granularity?: "hourly" | "shift" | "daily";
  }): PredictionResult<DepotDemandForecast> {
    const {
      depotId,
      horizonHours = 24,
      resourceTypes = ["CHARGE_STALL"],
      granularity = "hourly"
    } = params;

    const factors: PredictionFactor[] = [];
    const now = new Date();

    // Find depot
    const depot = depots.find(d => d.id === depotId);
    if (!depot) {
      return {
        prediction: {
          depotId,
          depotName: "Unknown Depot",
          forecasts: [],
          peakHours: [],
          recommendations: ["Depot not found"]
        },
        confidence: 0,
        factors: [],
        timestamp: now.toISOString(),
        modelVersion: this.MODEL_VERSION
      };
    }

    // Get vehicles at this depot
    const depotVehicles = mockVehicles.filter(v => v.currentDepotId === depotId);

    // Generate hourly forecasts
    const forecasts: DemandForecast[] = [];
    const peakHours: number[] = [];

    const intervals = granularity === "hourly" ? horizonHours :
                      granularity === "shift" ? Math.ceil(horizonHours / 8) :
                      Math.ceil(horizonHours / 24);

    for (let i = 0; i < intervals; i++) {
      const forecastTime = new Date(now.getTime() + i * (
        granularity === "hourly" ? 3600000 :
        granularity === "shift" ? 28800000 :
        86400000
      ));
      const hour = forecastTime.getHours();

      // Simulate demand patterns (higher during peak hours)
      let demandMultiplier = 1;
      if (hour >= 6 && hour <= 9) demandMultiplier = 1.5; // Morning peak
      if (hour >= 17 && hour <= 20) demandMultiplier = 1.6; // Evening peak
      if (hour >= 22 || hour <= 5) demandMultiplier = 1.3; // Overnight charging

      const baseDemand = Math.round(depotVehicles.length * 0.3);
      const predictedDemand = Math.round(baseDemand * demandMultiplier);
      const capacity = depot.chargingStations;
      const utilizationPercent = Math.round((predictedDemand / capacity) * 100);

      if (utilizationPercent > 80) {
        peakHours.push(hour);
      }

      let recommendation = "";
      if (utilizationPercent > 90) {
        recommendation = "Consider staggering vehicle arrivals or using alternative depots";
      } else if (utilizationPercent > 70) {
        recommendation = "Monitor queue closely - approaching capacity";
      } else {
        recommendation = "Capacity available for additional vehicles";
      }

      forecasts.push({
        timestamp: forecastTime.toISOString(),
        hour,
        resourceType: "CHARGE_STALL",
        predictedDemand,
        capacity,
        utilizationPercent: Math.min(100, utilizationPercent),
        recommendation,
        confidence: 0.75 - (i * 0.02) // Confidence decreases further out
      });
    }

    // Generate recommendations
    const recommendations: string[] = [];
    const avgUtilization = forecasts.reduce((sum, f) => sum + f.utilizationPercent, 0) / forecasts.length;

    if (avgUtilization > 80) {
      recommendations.push("High demand forecast - consider pre-scheduling priority vehicles");
    }
    if (peakHours.length > 0) {
      recommendations.push(`Peak hours identified: ${[...new Set(peakHours)].join(", ")}:00`);
    }
    if (avgUtilization < 50) {
      recommendations.push("Low utilization forecast - opportunity for maintenance scheduling");
    }

    factors.push({
      name: "vehicles_at_depot",
      weight: 0.4,
      value: depotVehicles.length,
      direction: "neutral",
      description: `${depotVehicles.length} vehicles assigned to depot`
    });
    factors.push({
      name: "charging_capacity",
      weight: 0.3,
      value: depot.chargingStations,
      direction: "positive",
      description: `${depot.chargingStations} charging stations available`
    });
    factors.push({
      name: "avg_utilization_forecast",
      weight: 0.3,
      value: Math.round(avgUtilization),
      direction: avgUtilization > 80 ? "negative" : "positive",
      description: `Average forecasted utilization: ${Math.round(avgUtilization)}%`
    });

    return {
      prediction: {
        depotId,
        depotName: depot.name,
        forecasts,
        peakHours: [...new Set(peakHours)],
        recommendations
      },
      confidence: this.calculateConfidence(factors, forecasts.length),
      factors,
      timestamp: now.toISOString(),
      modelVersion: this.MODEL_VERSION
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  private static calculateConfidence(factors: PredictionFactor[], dataPoints: number): number {
    // Base confidence from data points
    let confidence = Math.min(0.95, 0.5 + (dataPoints * 0.02));

    // Adjust based on factor quality
    const negativeFactors = factors.filter(f => f.direction === "negative").length;
    confidence -= negativeFactors * 0.05;

    // Ensure bounds
    return Math.round(Math.max(0.3, Math.min(0.95, confidence)) * 100) / 100;
  }

  /**
   * Get a summary of all predictions for a quick overview
   */
  static getFleetPredictionSummary(city?: string): {
    chargingNeeds: { critical: number; high: number; total: number };
    maintenanceRisks: { critical: number; high: number; total: number };
    incidentRisks: { elevated: number };
    recommendations: string[];
  } {
    const chargingPrediction = this.predictChargingNeeds({ city, horizonHours: 4 });
    const maintenancePrediction = this.predictMaintenanceRisks({ city, riskThreshold: 0.5 });
    const incidentPrediction = this.predictIncidentLikelihood({ city });

    const recommendations: string[] = [];

    const criticalCharging = chargingPrediction.prediction.filter(p => p.urgency === "critical").length;
    const highCharging = chargingPrediction.prediction.filter(p => p.urgency === "high").length;

    if (criticalCharging > 0) {
      recommendations.push(`${criticalCharging} vehicles need immediate charging`);
    }
    if (highCharging > 3) {
      recommendations.push("Consider batch charging optimization");
    }

    const criticalMaintenance = maintenancePrediction.prediction.filter(p => p.urgency === "critical").length;
    if (criticalMaintenance > 0) {
      recommendations.push(`${criticalMaintenance} vehicles need urgent maintenance attention`);
    }

    const elevatedIncidents = incidentPrediction.prediction.filter(p => p.riskScore > 0.3).length;
    if (elevatedIncidents > 2) {
      recommendations.push("Multiple vehicles showing elevated incident risk - review routes");
    }

    return {
      chargingNeeds: {
        critical: criticalCharging,
        high: highCharging,
        total: chargingPrediction.prediction.length
      },
      maintenanceRisks: {
        critical: criticalMaintenance,
        high: maintenancePrediction.prediction.filter(p => p.urgency === "high").length,
        total: maintenancePrediction.prediction.length
      },
      incidentRisks: {
        elevated: elevatedIncidents
      },
      recommendations
    };
  }
}

export default PredictiveEngine;
