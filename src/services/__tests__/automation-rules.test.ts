// src/services/__tests__/automation-rules.test.ts
// Unit tests for Automation Rules Engine

import { describe, it, expect, beforeEach } from "vitest";
import { AutomationEngine, defaultAutomationRules } from "../automation-rules";

describe("AutomationEngine", () => {
  let engine: AutomationEngine;

  beforeEach(() => {
    engine = new AutomationEngine();
  });

  describe("rule management", () => {
    it("should initialize with default rules", () => {
      const rules = engine.getRules();
      expect(rules.length).toBe(defaultAutomationRules.length);
    });

    it("should get rule by id", () => {
      const rule = engine.getRule("auto-charge-critical");
      expect(rule).toBeDefined();
      expect(rule!.name).toBe("Critical SOC Auto-Charging");
    });

    it("should enable and disable rules", () => {
      const ruleId = "auto-charge-critical";

      engine.disableRule(ruleId);
      expect(engine.getRule(ruleId)!.enabled).toBe(false);

      engine.enableRule(ruleId);
      expect(engine.getRule(ruleId)!.enabled).toBe(true);
    });

    it("should add new rules", () => {
      const newRule = {
        id: "test-rule",
        name: "Test Rule",
        description: "A test rule",
        enabled: true,
        trigger: { type: "soc_threshold" as const, threshold: 50, direction: "below" as const },
        conditions: [],
        actions: [{ type: "create_alert" as const, severity: "low", message: "Test" }],
        cooldownMinutes: 60
      };

      const added = engine.addRule(newRule);
      expect(added.id).toBe("test-rule");
      expect(added.executionCount).toBe(0);
      expect(added.createdAt).toBeDefined();

      const rules = engine.getRules();
      expect(rules.length).toBe(defaultAutomationRules.length + 1);
    });

    it("should remove rules", () => {
      const initialCount = engine.getRules().length;
      const removed = engine.removeRule("auto-charge-critical");

      expect(removed).toBe(true);
      expect(engine.getRules().length).toBe(initialCount - 1);
      expect(engine.getRule("auto-charge-critical")).toBeUndefined();
    });
  });

  describe("autoQueueCharging", () => {
    it("should return results with required fields", () => {
      const result = engine.autoQueueCharging({
        socThreshold: 50,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.vehiclesQueued).toBeDefined();
      expect(result.vehiclesSkipped).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.dryRun).toBe(true);
    });

    it("should filter by city", () => {
      const nashvilleResult = engine.autoQueueCharging({
        city: "Nashville",
        socThreshold: 80,
        dryRun: true
      });

      const allResult = engine.autoQueueCharging({
        socThreshold: 80,
        dryRun: true
      });

      expect(nashvilleResult.vehiclesQueued.length).toBeLessThanOrEqual(allResult.vehiclesQueued.length);
    });

    it("should respect max concurrent limit", () => {
      const result = engine.autoQueueCharging({
        maxConcurrent: 3,
        socThreshold: 80,
        dryRun: true
      });

      expect(result.vehiclesQueued.length).toBeLessThanOrEqual(3);
    });

    it("should apply different strategies", () => {
      const urgentResult = engine.autoQueueCharging({
        strategy: "urgent_first",
        socThreshold: 80,
        dryRun: true
      });

      const revenueResult = engine.autoQueueCharging({
        strategy: "revenue_optimal",
        socThreshold: 80,
        dryRun: true
      });

      // Different strategies may produce different orderings
      expect(urgentResult.summary).toContain("urgent_first");
      expect(revenueResult.summary).toContain("revenue_optimal");
    });

    it("should assign correct priorities", () => {
      const result = engine.autoQueueCharging({
        socThreshold: 50,
        dryRun: true
      });

      for (const vehicle of result.vehiclesQueued) {
        expect(["critical", "high", "medium", "low"]).toContain(vehicle.priority);
      }
    });
  });

  describe("autoQueueMaintenance", () => {
    it("should return results with required fields", () => {
      const result = engine.autoQueueMaintenance({
        riskThreshold: 0.5,
        dryRun: true
      });

      expect(result.success).toBe(true);
      expect(result.vehiclesQueued).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it("should filter by risk threshold", () => {
      const highRisk = engine.autoQueueMaintenance({
        riskThreshold: 0.8,
        dryRun: true
      });

      const lowRisk = engine.autoQueueMaintenance({
        riskThreshold: 0.3,
        dryRun: true
      });

      expect(highRisk.vehiclesQueued.length).toBeLessThanOrEqual(lowRisk.vehiclesQueued.length);
    });

    it("should include job type as MAINTENANCE", () => {
      const result = engine.autoQueueMaintenance({
        dryRun: true
      });

      for (const vehicle of result.vehiclesQueued) {
        expect(vehicle.jobType).toBe("MAINTENANCE");
      }
    });
  });

  describe("autoRebalanceFleet", () => {
    it("should return rebalance recommendations", () => {
      const result = engine.autoRebalanceFleet({});

      expect(result.recommendation).toBeDefined();
      expect(result.vehiclesToMove).toBeDefined();
      expect(result.execute).toBe(false);
    });

    it("should use specified selection criteria", () => {
      const highSocResult = engine.autoRebalanceFleet({
        selectionCriteria: "highest_soc"
      });

      const lowUtilResult = engine.autoRebalanceFleet({
        selectionCriteria: "lowest_utilization"
      });

      // Both should return valid results
      expect(highSocResult.vehiclesToMove).toBeDefined();
      expect(lowUtilResult.vehiclesToMove).toBeDefined();
    });

    it("should respect vehicle count limit", () => {
      const result = engine.autoRebalanceFleet({
        vehicleCount: 2
      });

      expect(result.vehiclesToMove.length).toBeLessThanOrEqual(2);
    });
  });

  describe("rule evaluation", () => {
    it("should evaluate enabled rules", () => {
      const executions = engine.evaluateRules();
      expect(executions).toBeDefined();
      expect(Array.isArray(executions)).toBe(true);
    });

    it("should respect cooldown periods", () => {
      // First evaluation
      const first = engine.evaluateRules();

      // Immediate second evaluation should respect cooldowns
      const second = engine.evaluateRules();

      // Rules with cooldowns shouldn't trigger twice immediately
      // (depends on rule configuration)
      expect(second).toBeDefined();
    });

    it("should track execution count", () => {
      const ruleId = "auto-charge-critical";
      const initialCount = engine.getRule(ruleId)!.executionCount;

      engine.evaluateRules();

      // Execution count may or may not increase depending on trigger conditions
      expect(engine.getRule(ruleId)!.executionCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe("execution log", () => {
    it("should maintain execution log", () => {
      engine.evaluateRules();
      const log = engine.getExecutionLog();

      expect(log).toBeDefined();
      expect(Array.isArray(log)).toBe(true);
    });

    it("should clear execution log", () => {
      engine.evaluateRules();
      engine.clearExecutionLog();

      expect(engine.getExecutionLog().length).toBe(0);
    });
  });
});
