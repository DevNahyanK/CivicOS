import { describe, expect, it } from "vitest";
import {
  simulationNarrativeOutputSchema,
  keyTradeoffSchema,
  policyRecommendationSchema,
} from "./simulation-narrative";

describe("simulationNarrativeOutputSchema", () => {
  const validNarrative = {
    executive_summary:
      "Increasing active vehicles from 3 to 4 increases recovery throughput by 28%, effectively eliminating fleet saturation while maintaining safe collection routes.",
    key_tradeoffs: [
      {
        title: "Fleet Capex vs Food Spoilage",
        description: "Adding vehicles increases operational capital expenditure but prevents daily surplus rot at high-volume bakeries.",
        impact: "Reduces landfill dumping by an estimated 250 kg daily.",
      },
      {
        title: "Collection Density vs Driver Route Time",
        description: "Enrolling dispersed perimeter stores increases driving distance and fuel expenditure per kilogram collected.",
        impact: "Lowers route-level efficiency if geographic clustering is not enforced.",
      },
    ],
    bottleneck_assessment:
      "The primary structural barrier is the 350 kg payload limit on light delivery vans. At peak surplus days, vehicles operate at 94% saturation, creating delivery delays.",
    policy_recommendations: [
      {
        recommendation: "Establish a municipal vehicle sharing subsidy with local courier fleets.",
        target_actor: "City Department of Transportation",
        priority: "immediate",
        rationale: "Rapidly injects auxiliary transport capacity without purchasing new municipal vehicles.",
      },
      {
        recommendation: "Zone restaurant clusters for coordinated scheduled pickups.",
        target_actor: "Regional Business Improvement District",
        priority: "medium_term",
        rationale: "Maximizes collection yield per kilometer driven.",
      },
    ],
  };

  it("validates a compliant simulation narrative output", () => {
    const result = simulationNarrativeOutputSchema.safeParse(validNarrative);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key_tradeoffs).toHaveLength(2);
      expect(result.data.policy_recommendations).toHaveLength(2);
      expect(result.data.policy_recommendations[0]?.priority).toBe("immediate");
    }
  });

  it("rejects an executive summary that is too short", () => {
    const invalid = {
      ...validNarrative,
      executive_summary: "Too short.",
    };
    const result = simulationNarrativeOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty trade-offs array", () => {
    const invalid = {
      ...validNarrative,
      key_tradeoffs: [],
    };
    const result = simulationNarrativeOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects empty policy recommendations array", () => {
    const invalid = {
      ...validNarrative,
      policy_recommendations: [],
    };
    const result = simulationNarrativeOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("keyTradeoffSchema", () => {
  it("validates a compliant trade-off object", () => {
    const result = keyTradeoffSchema.safeParse({
      title: "Cost vs Speed",
      description: "Hiring more drivers costs more but halves pickup times.",
      impact: "Saves 100 kg daily from spoiling.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid trade-off object with short title", () => {
    const result = keyTradeoffSchema.safeParse({
      title: "No",
      description: "Valid description here.",
      impact: "Valid impact.",
    });
    expect(result.success).toBe(false);
  });
});

describe("policyRecommendationSchema", () => {
  it("validates a compliant policy recommendation", () => {
    const result = policyRecommendationSchema.safeParse({
      recommendation: "Coordinate merchant loading bays.",
      target_actor: "City Council",
      priority: "immediate",
      rationale: "Reduces double parking and speeds route cycles.",
    });
    expect(result.success).toBe(true);
  });

  it("defaults priority to immediate if not specified", () => {
    const result = policyRecommendationSchema.safeParse({
      recommendation: "Coordinate merchant loading bays.",
      target_actor: "City Council",
      rationale: "Reduces double parking and speeds route cycles.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("immediate");
    }
  });
});
