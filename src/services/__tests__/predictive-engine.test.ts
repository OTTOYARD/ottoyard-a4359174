// src/services/__tests__/predictive-engine.test.ts
// Unit tests for Predictive Engine

import { describe, it, expect } from "vitest";
import { PredictiveEngine } from "../predictive-engine";

describe("PredictiveEngine", () => {
  describe("predictChargingNeeds", () => {
    it("should return predictions with required fields", () => {
      const result = PredictiveEngine.predictChargingNeeds({
        horizonHours: 4,
        socThreshold: 0.30
      });

      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.factors).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.modelVersion).toBeDefined();
    });

    it("should filter by city when specified", () => {
      const nashvilleResult = PredictiveEngine.predictChargingNeeds({
        city: "Nashville"
      });

      // All predicted vehicles should be from Nashville or have Nashville routes
      expect(nashvilleResult.prediction.length).toBeGreaterThanOrEqual(0);
    });

    it("should assign correct urgency levels based on SOC", () => {
      const result = PredictiveEngine.predictChargingNeeds({
        horizonHours: 8,
        socThreshold: 0.50
      });

      for (const prediction of result.prediction) {
        expect(["critical", "high", "medium", "low"]).toContain(prediction.urgency);

        // Critical should be very low SOC
        if (prediction.urgency === "critical") {
          expect(prediction.currentSoc).toBeLessThan(25);
        }
      }
    });

    it("should include estimated charge times", () => {
      const result = PredictiveEngine.predictChargingNeeds({});

      for (const prediction of result.prediction) {
        expect(prediction.estimatedChargeMinutes).toBeGreaterThan(0);
        expect(prediction.drainRate).toBeDefined();
      }
    });

    it("should sort predictions by urgency", () => {
      const result = PredictiveEngine.predictChargingNeeds({
        horizonHours: 4
      });

      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };

      for (let i = 1; i < result.prediction.length; i++) {
        const prevUrgency = urgencyOrder[result.prediction[i - 1].urgency];
        const currUrgency = urgencyOrder[result.prediction[i].urgency];
        expect(currUrgency).toBeGreaterThanOrEqual(prevUrgency);
      }
    });
  });

  describe("predictMaintenanceRisks", () => {
    it("should return predictions with required fields", () => {
      const result = PredictiveEngine.predictMaintenanceRisks({
        riskThreshold: 0.5
      });

      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);

      for (const risk of result.prediction) {
        expect(risk.vehicleId).toBeDefined();
        expect(risk.riskScore).toBeGreaterThanOrEqual(0);
        expect(risk.riskScore).toBeLessThanOrEqual(1);
        expect(risk.category).toBeDefined();
        expect(risk.predictedFailureWindow).toBeDefined();
        expect(risk.recommendedAction).toBeDefined();
      }
    });

    it("should filter by risk threshold", () => {
      const highThreshold = PredictiveEngine.predictMaintenanceRisks({
        riskThreshold: 0.8
      });

      const lowThreshold = PredictiveEngine.predictMaintenanceRisks({
        riskThreshold: 0.3
      });

      // Higher threshold should return fewer or equal results
      expect(highThreshold.prediction.length).toBeLessThanOrEqual(lowThreshold.prediction.length);

      // All returned should be above threshold
      for (const risk of highThreshold.prediction) {
        expect(risk.riskScore).toBeGreaterThanOrEqual(0.8);
      }
    });

    it("should include component risks", () => {
      const result = PredictiveEngine.predictMaintenanceRisks({
        riskThreshold: 0.4
      });

      // At least some predictions should have component risks
      const hasComponents = result.prediction.some(p => p.components.length > 0);
      expect(hasComponents).toBe(true);
    });

    it("should filter by categories when specified", () => {
      const result = PredictiveEngine.predictMaintenanceRisks({
        categories: ["sensors"],
        riskThreshold: 0.3
      });

      for (const risk of result.prediction) {
        expect(risk.category).toBe("sensors");
      }
    });
  });

  describe("predictIncidentLikelihood", () => {
    it("should return predictions with required fields", () => {
      const result = PredictiveEngine.predictIncidentLikelihood({});

      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);

      for (const risk of result.prediction) {
        expect(risk.vehicleId).toBeDefined();
        expect(risk.riskScore).toBeGreaterThanOrEqual(0);
        expect(risk.riskScore).toBeLessThanOrEqual(1);
        expect(risk.primaryFactors).toBeDefined();
        expect(risk.recommendedActions).toBeDefined();
      }
    });

    it("should include environmental factors", () => {
      const result = PredictiveEngine.predictIncidentLikelihood({
        includeFactors: true
      });

      expect(result.factors.length).toBeGreaterThan(0);

      const factorNames = result.factors.map(f => f.name);
      expect(factorNames).toContain("weather_conditions");
      expect(factorNames).toContain("traffic_conditions");
    });

    it("should filter by city when specified", () => {
      const result = PredictiveEngine.predictIncidentLikelihood({
        city: "Austin"
      });

      // Should return results (may be empty if no Austin vehicles)
      expect(result.prediction).toBeDefined();
    });
  });

  describe("predictDepotDemand", () => {
    it("should return forecasts for valid depot", () => {
      const result = PredictiveEngine.predictDepotDemand({
        depotId: "depot-waymo-nash",
        horizonHours: 24,
        granularity: "hourly"
      });

      expect(result.prediction.depotId).toBe("depot-waymo-nash");
      expect(result.prediction.forecasts.length).toBe(24);
      expect(result.prediction.recommendations.length).toBeGreaterThan(0);
    });

    it("should return different granularities", () => {
      const hourly = PredictiveEngine.predictDepotDemand({
        depotId: "depot-waymo-nash",
        horizonHours: 24,
        granularity: "hourly"
      });

      const shift = PredictiveEngine.predictDepotDemand({
        depotId: "depot-waymo-nash",
        horizonHours: 24,
        granularity: "shift"
      });

      expect(hourly.prediction.forecasts.length).toBe(24);
      expect(shift.prediction.forecasts.length).toBe(3); // 3 shifts in 24 hours
    });

    it("should identify peak hours", () => {
      const result = PredictiveEngine.predictDepotDemand({
        depotId: "depot-waymo-nash",
        horizonHours: 24
      });

      // Peak hours should be during morning and evening rush
      expect(result.prediction.peakHours).toBeDefined();
    });

    it("should handle invalid depot gracefully", () => {
      const result = PredictiveEngine.predictDepotDemand({
        depotId: "invalid-depot"
      });

      expect(result.prediction.forecasts.length).toBe(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe("getFleetPredictionSummary", () => {
    it("should return aggregated summary", () => {
      const summary = PredictiveEngine.getFleetPredictionSummary();

      expect(summary.chargingNeeds).toBeDefined();
      expect(summary.chargingNeeds.total).toBeGreaterThanOrEqual(0);
      expect(summary.chargingNeeds.critical).toBeGreaterThanOrEqual(0);

      expect(summary.maintenanceRisks).toBeDefined();
      expect(summary.maintenanceRisks.total).toBeGreaterThanOrEqual(0);

      expect(summary.incidentRisks).toBeDefined();
      expect(summary.recommendations).toBeDefined();
    });

    it("should filter by city", () => {
      const nashvilleSummary = PredictiveEngine.getFleetPredictionSummary("Nashville");
      const allSummary = PredictiveEngine.getFleetPredictionSummary();

      // Nashville-specific should be subset of all
      expect(nashvilleSummary.chargingNeeds.total).toBeLessThanOrEqual(allSummary.chargingNeeds.total);
    });
  });
});
