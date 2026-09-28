import { describe, expect, it } from "vitest";
import { problemAnalysisOutputSchema, reviewStatusSchema } from "./analysis";

describe("problemAnalysisOutputSchema", () => {
  const validAnalysis = {
    summary:
      "Peak-hour public bus transit delays significantly increase commuter travel times across the metropolitan area.",
    rootCauses: [
      {
        title: "Bottleneck at major central intersections",
        description: "Lack of dedicated bus rapid lanes causes buses to wait in mixed traffic.",
        category: "infrastructure",
      },
      {
        title: "Fleet shortage during morning commute",
        description: "Insufficient active vehicles during the 7 AM to 10 AM window.",
        category: "operational",
      },
    ],
    stakeholders: [
      {
        group: "Daily Commuters",
        role: "Transit passengers relying on public buses",
        impact: "Experience 30-45 minute delays daily",
      },
      {
        group: "Metropolitan Transit Authority",
        role: "Public transportation service provider",
        impact: "Faces public dissatisfaction and higher overtime operational costs",
      },
    ],
    affectedPopulation: [
      {
        group: "Urban workforce and students",
        estimatedScale: "~250,000 daily commuters",
        impactDescription: "Lost productivity and late arrivals to work and universities",
      },
    ],
    constraints: [
      {
        category: "budgetary",
        description: "Municipal capital transit budget is capped for the current fiscal cycle.",
      },
      {
        category: "physical",
        description: "Narrow roadways in the historic city center limit lane expansion.",
      },
    ],
    keyAssumptions: [
      "Bus passenger counts are highest between 7:30 AM and 9:30 AM.",
      "Road widening is politically and physically impractical in the central core.",
    ],
  };

  it("validates a complete and structured problem analysis output", () => {
    const result = problemAnalysisOutputSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rootCauses).toHaveLength(2);
      expect(result.data.stakeholders).toHaveLength(2);
      expect(result.data.affectedPopulation).toHaveLength(1);
      expect(result.data.constraints).toHaveLength(2);
      expect(result.data.keyAssumptions).toHaveLength(2);
    }
  });

  it("applies defaults for constraints and assumptions when omitted", () => {
    const minimal = {
      summary: "High municipal solid waste accumulation in low-income districts due to irregular collection cycles.",
      rootCauses: [
        {
          title: "Inadequate collection truck routing",
          description: "Trucks are frequently dispatched without GPS or real-time density data.",
        },
      ],
      stakeholders: [
        {
          group: "Local Residents",
          role: "District inhabitants",
          impact: "Exposed to sanitation hazards",
        },
      ],
      affectedPopulation: [
        {
          group: "District households",
          impactDescription: "Severe sanitation and drainage obstruction risks",
        },
      ],
    };

    const result = problemAnalysisOutputSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.constraints).toEqual([]);
      expect(result.data.keyAssumptions).toEqual([]);
      expect(result.data.rootCauses[0].category).toBe("general");
    }
  });

  it("rejects when required sections are missing or too short", () => {
    const invalid = {
      summary: "Too short",
      rootCauses: [],
      stakeholders: [],
      affectedPopulation: [],
    };
    const result = problemAnalysisOutputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("validates review statuses correctly", () => {
    expect(reviewStatusSchema.safeParse("draft").success).toBe(true);
    expect(reviewStatusSchema.safeParse("reviewed").success).toBe(true);
    expect(reviewStatusSchema.safeParse("accepted").success).toBe(true);
    expect(reviewStatusSchema.safeParse("rejected").success).toBe(true);
    expect(reviewStatusSchema.safeParse("unknown").success).toBe(false);
  });
});
