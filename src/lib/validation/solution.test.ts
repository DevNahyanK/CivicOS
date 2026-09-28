import { describe, expect, it } from "vitest";
import {
  createSolutionSchema,
  solutionMilestoneSchema,
  aiRoadmapDraftSchema,
} from "./solution";

describe("solutionMilestoneSchema", () => {
  it("validates a compliant milestone", () => {
    const result = solutionMilestoneSchema.safeParse({
      id: "m-1",
      title: "Procure refrigerated collection van",
      description: "Acquire secondary electric vehicle for city center route.",
      duration: "3 weeks",
      target_completion: "Month 1",
      target_actor: "City Logistics Bureau",
      status: "pending",
    });
    expect(result.success).toBe(true);
  });

  it("defaults status to pending", () => {
    const result = solutionMilestoneSchema.safeParse({
      id: "m-2",
      title: "Establish merchant partner SLAs",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending");
    }
  });
});

describe("createSolutionSchema", () => {
  it("validates a valid solution creation payload", () => {
    const result = createSolutionSchema.safeParse({
      problemId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      scenarioId: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      title: "Downtown Food Recovery Fleet Expansion",
      description: "Scale from 3 to 4 vehicles to relieve peak surplus saturation.",
      estimatedCost: "$45,000 capex",
      targetTimeline: "6 months",
      milestones: [
        {
          id: "m-1",
          title: "Procure van",
          status: "pending",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid problem UUID", () => {
    const result = createSolutionSchema.safeParse({
      problemId: "invalid-uuid",
      title: "Downtown Fleet Expansion",
    });
    expect(result.success).toBe(false);
  });
});

describe("aiRoadmapDraftSchema", () => {
  it("validates structured AI roadmap output", () => {
    const result = aiRoadmapDraftSchema.safeParse({
      overview: "A phased 4-month operational rollout for expanding commercial organic waste diversion.",
      milestones: [
        {
          title: "Phase 1: Merchant SLA Onboarding",
          description: "Sign standardized surplus donation agreements with 25 pilot restaurants.",
          duration: "Weeks 1-4",
          target_actor: "Business Improvement District",
          target_completion: "Month 1",
        },
        {
          title: "Phase 2: Fleet Lease & Route Calibration",
          description: "Deploy additional light refrigerated van and configure GPS corridors.",
          duration: "Weeks 5-8",
          target_actor: "Municipal Transport Authority",
          target_completion: "Month 2",
        },
        {
          title: "Phase 3: Central Food Hub Handover",
          description: "Integrate collection schedules with regional food banks.",
          duration: "Weeks 9-12",
          target_actor: "Food Bank Alliance",
          target_completion: "Month 3",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects roadmaps with fewer than 3 phases", () => {
    const result = aiRoadmapDraftSchema.safeParse({
      overview: "Too short.",
      milestones: [
        {
          title: "Phase 1",
          description: "Description here.",
          duration: "1 week",
          target_actor: "Actor",
          target_completion: "Week 1",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
