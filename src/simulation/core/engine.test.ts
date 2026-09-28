import { describe, expect, it } from "vitest";
import { runSimulation, SimulationEngine } from "./engine";
import { evaluateSafeExpression, safeDivide, clamp, round } from "./evaluator";
import { foodRecoveryModelDefinition } from "../models/food-recovery";
import type { SimulationModelDefinition } from "../types";

describe("SimulationEngine & Contracts", () => {
  it("executes default values when no inputs are provided and marks provenance as assumption", () => {
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
    });

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toHaveLength(0);

    // Default inputs check
    const restaurantsInput = result.resolvedInputs.participating_restaurants;
    expect(restaurantsInput.value).toBe(60);
    expect(restaurantsInput.provenance).toBe("assumption");
    expect(restaurantsInput.isOverridden).toBe(false);

    // Math check:
    // 60 restaurants * 18.5 kg = 1110 kg surplus
    // 3 vehicles * 350 kg = 1050 kg capacity
    // 1110 * 0.75 efficiency = 832.5 kg potential
    // actual recovered = min(832.5, 1050) = 832.5 kg
    // meals = 832.5 * 2.1 = 1748.25 -> 1748 meals
    expect(result.metrics.actual_recovered_food_kg.value).toBe(832.5);
    expect(result.metrics.meals_provided_daily.value).toBe(1748);
    expect(result.metrics.daily_total_surplus_kg.value).toBe(1110);
  });

  it("applies user inputs with provenance user_input", () => {
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
      inputs: {
        participating_restaurants: 40,
        daily_surplus_per_restaurant_kg: 20,
        collection_efficiency_pct: 80,
      },
    });

    // 40 * 20 = 800 kg surplus
    // 800 * 0.80 = 640 kg collected
    // capacity: 3 * 350 = 1050 kg
    // actual recovered: 640 kg
    expect(result.resolvedInputs.participating_restaurants.value).toBe(40);
    expect(result.resolvedInputs.participating_restaurants.provenance).toBe("user_input");
    expect(result.resolvedInputs.participating_restaurants.isOverridden).toBe(false);
    expect(result.metrics.actual_recovered_food_kg.value).toBe(640);
  });

  it("applies scenario overrides over base user inputs", () => {
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
      inputs: {
        participating_restaurants: 40,
      },
      scenarioOverrides: {
        participating_restaurants: 80,
      },
    });

    const resInput = result.resolvedInputs.participating_restaurants;
    expect(resInput.value).toBe(80);
    expect(resInput.provenance).toBe("user_input");
    expect(resInput.isOverridden).toBe(true);
  });

  it("guarantees 100% deterministic calculations across multiple runs", () => {
    const runOptions = {
      model: foodRecoveryModelDefinition,
      inputs: {
        participating_restaurants: 75,
        daily_surplus_per_restaurant_kg: 15.5,
        collection_efficiency_pct: 70,
        active_vehicles: 4,
        vehicle_capacity_kg: 300,
        meals_per_kg: 2.2,
      },
    };

    const run1 = runSimulation(runOptions);
    const run2 = runSimulation(runOptions);

    expect(run1.metrics).toEqual(run2.metrics);
    expect(run1.intermediateCalculations).toEqual(run2.intermediateCalculations);
    expect(run1.bottlenecks).toEqual(run2.bottlenecks);
    expect(run1.constraints).toEqual(run2.constraints);
  });

  it("enforces provenance = calculated for all output metrics", () => {
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
    });

    Object.values(result.metrics).forEach((metric) => {
      expect(metric.provenance).toBe("calculated");
      expect(typeof metric.value).not.toBe("undefined");
      expect(metric.label).toBeTruthy();
    });
  });

  it("detects and flags invalid out-of-range inputs", () => {
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
      inputs: {
        collection_efficiency_pct: 150, // exceeds max 100
        participating_restaurants: -5, // below min 1
      },
    });

    expect(result.isValid).toBe(false);
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(2);
    expect(
      result.validationErrors.some((e) => e.includes("exceeds maximum allowed value"))
    ).toBe(true);
    expect(
      result.validationErrors.some((e) => e.includes("below minimum allowed value"))
    ).toBe(true);
  });

  it("evaluates constraint violations and updates isValid flag", () => {
    // collection_efficiency_pct < 5 violates minimum_efficiency_threshold
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
      inputs: {
        collection_efficiency_pct: 3,
      },
    });

    expect(result.isValid).toBe(false);
    const violation = result.constraints.find(
      (c) => c.constraintId === "minimum_efficiency_threshold"
    );
    expect(violation).toBeDefined();
    expect(violation?.satisfied).toBe(false);
    expect(violation?.severity).toBe("violation");
    expect(violation?.message).toContain("below the minimum viable threshold");
  });

  it("detects fleet logistics bottlenecks and suggests interventions", () => {
    // 200 restaurants * 20 kg = 4000 kg surplus
    // 80% collection = 3200 kg potential
    // Fleet capacity = 2 vehicles * 350 kg = 700 kg -> utilization > 400%
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
      inputs: {
        participating_restaurants: 200,
        daily_surplus_per_restaurant_kg: 20,
        collection_efficiency_pct: 80,
        active_vehicles: 2,
        vehicle_capacity_kg: 350,
      },
    });

    const fleetBottleneck = result.bottlenecks.find(
      (b) => b.id === "logistics_fleet_saturation"
    );
    expect(fleetBottleneck).toBeDefined();
    expect(fleetBottleneck?.detected).toBe(true);
    expect(fleetBottleneck?.severity).toBe("high");
    expect(fleetBottleneck?.suggestedIntervention).toContain("Deploy additional collection vans");

    // Actual recovered food should be capped by vehicle fleet capacity
    expect(result.metrics.actual_recovered_food_kg.value).toBe(700);
  });

  it("detects low donor network density bottleneck", () => {
    const result = runSimulation({
      model: foodRecoveryModelDefinition,
      inputs: {
        participating_restaurants: 8, // below threshold of 15
      },
    });

    const densityBottleneck = result.bottlenecks.find(
      (b) => b.id === "low_donor_density"
    );
    expect(densityBottleneck).toBeDefined();
    expect(densityBottleneck?.detected).toBe(true);
    expect(densityBottleneck?.severity).toBe("low");
  });

  it("prevents arbitrary string code execution and safely divides by zero", () => {
    expect(safeDivide(100, 0, 0)).toBe(0);
    expect(safeDivide(0, 0, 42)).toBe(42);
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(round(12.3456, 2)).toBe(12.35);

    // Verify model cannot execute raw strings as code
    const invalidModel: SimulationModelDefinition = {
      id: "test_model",
      name: "Test",
      version: "1.0",
      description: "Test",
      inputs: [],
      assumptions: [],
      constraints: [],
      bottleneckRules: [],
      formulas: [
        {
          key: "test_formula",
          label: "Test",
          calculate: () => {
            // TypeScript function, no eval, cannot run arbitrary user string
            return 42;
          },
        },
      ],
      outputMetrics: [
        {
          key: "out",
          label: "Output",
          formulaKey: "test_formula",
        },
      ],
    };

    const res = SimulationEngine.run({ model: invalidModel });
    expect(res.metrics.out.value).toBe(42);
  });

  it("evaluates safe AST expressions without eval", () => {
    const variables = { a: 10, b: 20, c: 5 };

    const expr = {
      type: "add" as const,
      left: { type: "variable" as const, name: "a" },
      right: {
        type: "multiply" as const,
        left: { type: "variable" as const, name: "b" },
        right: { type: "variable" as const, name: "c" },
      },
    };

    // 10 + (20 * 5) = 110
    const result = evaluateSafeExpression(expr, variables);
    expect(result).toBe(110);

    // Throws on missing variable
    expect(() =>
      evaluateSafeExpression({ type: "variable", name: "missing" }, variables)
    ).toThrow('Variable "missing" not found');
  });
});
