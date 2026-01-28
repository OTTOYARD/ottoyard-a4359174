// src/agent/__tests__/intent-classifier.test.ts
// Unit tests for Intent Classifier

import { describe, it, expect } from "vitest";
import { IntentClassifier, QueryIntent } from "../intent-classifier";

describe("IntentClassifier", () => {
  describe("classify", () => {
    // Fleet Status Queries
    it("should classify fleet status queries correctly", () => {
      const queries = [
        "How many vehicles are charging?",
        "Show me all vehicles",
        "Fleet status overview",
        "What is the fleet status?"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("fleet_status");
        expect(result.confidence).toBeGreaterThan(0.3);
        expect(result.suggestedTools).toContain("query_vehicles");
      }
    });

    // Vehicle Specific Queries
    it("should classify vehicle-specific queries correctly", () => {
      const queries = [
        "What's the SOC on WM-PAC-05?",
        "Show vehicle ZX-GEN1-19 status",
        "Where is TE-MOD3-06?"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("vehicle_specific");
        expect(result.entities.vehicleIds).toBeDefined();
        expect(result.entities.vehicleIds!.length).toBeGreaterThan(0);
      }
    });

    // Depot Queries
    it("should classify depot queries correctly", () => {
      const queries = [
        "Show Nashville depot status",
        "What stalls are available?",
        "Depot capacity in Austin"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(["depot_query", "fleet_status"]).toContain(result.intent);
      }
    });

    // Incident Triage
    it("should classify incident triage queries correctly", () => {
      const queries = [
        "Show active incidents",
        "Any critical incidents?",
        "Incident triage",
        "List collision reports"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("incident_triage");
        expect(result.suggestedTools).toContain("triage_incidents");
      }
    });

    // Predictive Queries
    it("should classify predictive queries correctly", () => {
      const queries = [
        "Which vehicles need charging soon?",
        "Predict maintenance risks",
        "Forecast charging needs"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("predictive");
        expect(result.suggestedTools.some(t => t.startsWith("predict_"))).toBe(true);
      }
    });

    // OTTOW Dispatch
    it("should classify OTTOW dispatch queries correctly", () => {
      const queries = [
        "Dispatch OTTOW to Nashville",
        "Send roadside assistance",
        "Vehicle needs help, dispatch tow"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("ottow_dispatch");
        expect(result.suggestedTools).toContain("quick_dispatch_ottow");
      }
    });

    // Optimization
    it("should classify optimization queries correctly", () => {
      const queries = [
        "Optimize charging schedule",
        "Improve fleet efficiency",
        "Maximize throughput"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("optimization");
      }
    });

    // Analytics
    it("should classify analytics queries correctly", () => {
      const queries = [
        "Generate fleet report",
        "Show utilization metrics",
        "Weekly analytics report"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("analytics");
      }
    });

    // General Knowledge
    it("should classify general knowledge queries correctly", () => {
      const queries = [
        "What is L4 autonomy?",
        "Explain disengagement rate",
        "How does DC fast charging work?"
      ];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("general_knowledge");
        expect(result.suggestedTools).toContain("explain_concept");
      }
    });

    // Conversational
    it("should classify conversational queries correctly", () => {
      const queries = ["Hi", "Hello", "Thanks", "Bye"];

      for (const query of queries) {
        const result = IntentClassifier.classify(query);
        expect(result.intent).toBe("conversation");
        expect(result.responseMode).toBe("conversational");
      }
    });
  });

  describe("entity extraction", () => {
    it("should extract vehicle IDs from queries", () => {
      const result = IntentClassifier.classify("Check status of WM-PAC-05 and ZX-GEN1-19");
      expect(result.entities.vehicleIds).toContain("WM-PAC-05");
      expect(result.entities.vehicleIds).toContain("ZX-GEN1-19");
    });

    it("should extract cities from queries", () => {
      const result = IntentClassifier.classify("Show vehicles in Nashville");
      expect(result.entities.cities).toContain("Nashville");
    });

    it("should extract OEMs from queries", () => {
      const result = IntentClassifier.classify("All Waymo vehicles");
      expect(result.entities.oems).toContain("Waymo");
    });

    it("should extract statuses from queries", () => {
      const result = IntentClassifier.classify("Show charging vehicles");
      expect(result.entities.statuses).toContain("charging");
    });

    it("should extract thresholds from queries", () => {
      const result = IntentClassifier.classify("Vehicles with SOC below 30%");
      expect(result.entities.thresholds).toBeDefined();
      expect(result.entities.thresholds![0].operator).toBe("<");
      expect(result.entities.thresholds![0].value).toBe(30);
    });

    it("should extract urgency from queries", () => {
      const result = IntentClassifier.classify("Emergency dispatch needed immediately");
      expect(result.entities.urgency).toBe("immediate");
    });
  });

  describe("helper methods", () => {
    it("should correctly identify data access requirements", () => {
      expect(IntentClassifier.requiresDataAccess("fleet_status")).toBe(true);
      expect(IntentClassifier.requiresDataAccess("vehicle_specific")).toBe(true);
      expect(IntentClassifier.requiresDataAccess("conversation")).toBe(false);
      expect(IntentClassifier.requiresDataAccess("general_knowledge")).toBe(false);
    });

    it("should correctly identify action requests", () => {
      expect(IntentClassifier.isActionRequest("scheduling")).toBe(true);
      expect(IntentClassifier.isActionRequest("ottow_dispatch")).toBe(true);
      expect(IntentClassifier.isActionRequest("fleet_status")).toBe(false);
    });

    it("should provide relevant follow-up suggestions", () => {
      const followUps = IntentClassifier.getSuggestedFollowUps("fleet_status", {
        cities: ["Nashville"]
      });
      expect(followUps.length).toBeGreaterThan(0);
    });
  });
});
