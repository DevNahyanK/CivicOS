import { describe, expect, it } from "vitest";
import { buildSimulationNarrativePrompt } from "./prompts";
import { foodRecoveryModelDefinition } from "../../../simulation/models/food-recovery";
import { SimulationEngine } from "../../../simulation/core/engine";

describe("buildSimulationNarrativePrompt", () => {
  const currentResult = SimulationEngine.run({
    model: foodRecoveryModelDefinition,
    inputs: {
      participating_restaurants: 60,
      active_vehicles: 3,
    },
  });

  it("builds a comprehensive prompt with civic context and deterministic metrics", () => {
    const prompt = buildSimulationNarrativePrompt({
      problem: {
        title: "Perishable Food Surplus Spoilage",
        description: "Commercial eateries in the city center discard edible surplus food daily.",
        location: "Downtown Metro",
      },
      currentResult,
    });

    expect(prompt).toContain("Perishable Food Surplus Spoilage");
    expect(prompt).toContain("Downtown Metro");
    expect(prompt).toContain("Commercial eateries in the city center");
    expect(prompt).toContain("Active Input Parameters:");
    expect(prompt).toContain("Calculated Operational Metrics:");
    expect(prompt).toContain("Detected Bottlenecks:");
    expect(prompt).toContain("System Constraints Status:");
    expect(prompt).toContain("executive_summary");
    expect(prompt).toContain("key_tradeoffs");
    expect(prompt).toContain("bottleneck_assessment");
    expect(prompt).toContain("policy_recommendations");
  });

  it("includes baseline comparison section when baseline result is provided", () => {
    const baselineResult = SimulationEngine.run({
      model: foodRecoveryModelDefinition,
      inputs: {
        active_vehicles: 2,
      },
    });

    const prompt = buildSimulationNarrativePrompt({
      problem: {
        title: "Perishable Food Surplus Spoilage",
        description: "Commercial eateries discard surplus.",
      },
      currentResult,
      baselineResult,
      baselineName: "Initial Pilot (2 Vans)",
    });

    expect(prompt).toContain("Baseline Scenario Comparison:");
    expect(prompt).toContain('Reference Baseline: "Initial Pilot (2 Vans)"');
  });
});
