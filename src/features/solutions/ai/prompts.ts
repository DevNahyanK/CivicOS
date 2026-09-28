export const SOLUTION_ROADMAP_PROMPT_VERSION = "solution_roadmap_v1.0.0";

export const SOLUTION_ROADMAP_SYSTEM_INSTRUCTION = `You are an expert civic implementation strategist, municipal project director, and public operations researcher working within CivicOS.
Your objective is to propose a structured, realistic, and phased operational implementation roadmap (3 to 5 milestone phases) for a civic intervention.

CRITICAL ANALYTICAL PRINCIPLES:
1. STRICTLY QUALITATIVE OPERATIONAL STRUCTURING & ZERO MATH:
   Do NOT calculate, alter, or fabricate numerical projections or performance metrics. Any numbers provided in the prompt (e.g. food recovered in kg, meal counts, vehicle fleet numbers) are verified deterministic targets produced by the CivicOS simulation engine. Reference them faithfully.
2. CONCRETE MUNICIPAL PHASING:
   Structure the implementation into practical sequential phases (e.g. Stakeholder Alignment & Vendor SLAs, Pilot Equipment Procurement & Vehicle Routing, Public Onboarding & Route Calibration, Long-Term Institutional Handover).
3. CLEAR ACCOUNTABILITY:
   Assign each milestone phase to an exact, realistic civic or operational entity (e.g. City Department of Sanitation, Food Bank Alliance, Municipal Council, Fleet Services Division).
4. REALISTIC TIME HORIZONS:
   Provide pragmatic durations and timeframes (e.g. "Weeks 1-3", "Month 2", "Quarter 2").
5. STRUCTURED JSON OUTPUT:
   Return strictly a valid JSON object matching the requested schema without any markdown formatting or commentary.`;

export interface SolutionRoadmapPromptParams {
  problem: {
    title: string;
    description: string;
    location?: string | null;
  };
  scenario?: {
    name: string;
    description?: string | null;
    targetMetrics?: Record<string, { label: string; value: number | string; unit?: string }>;
    resolvedInputs?: Record<string, { label: string; value: number | string; unit?: string }>;
  } | null;
}

export function buildSolutionRoadmapPrompt({
  problem,
  scenario,
}: SolutionRoadmapPromptParams): string {
  let scenarioSection = "No specific simulation scenario linked. Base the operational roadmap on general municipal best practices for this civic challenge.";

  if (scenario) {
    const inputsList = scenario.resolvedInputs
      ? Object.values(scenario.resolvedInputs)
          .map((i) => `  * ${i.label}: ${i.value} ${i.unit ?? ""}`)
          .join("\n")
      : "";

    const metricsList = scenario.targetMetrics
      ? Object.values(scenario.targetMetrics)
          .map((m) => `  * ${m.label}: ${m.value} ${m.unit ?? ""}`)
          .join("\n")
      : "";

    scenarioSection = `Linked Simulation Scenario: "${scenario.name}"
Description: ${scenario.description ?? "Standard simulation run"}
Target Metrics (Deterministically Calculated Ground Truth):
${metricsList || "  * Projected operational targets active"}
Simulation Parameters:
${inputsList || "  * Fleet and merchant parameters configured"}`;
  }

  return `Please review the following civic problem and simulation targets to propose an operational execution plan:

CIVIC CHALLENGE:
- Title: "${problem.title}"
- Description:
"""
${problem.description}
"""
- Location: ${problem.location ? `"${problem.location}"` : "Metropolitan Area"}

${scenarioSection}

TASK:
Draft a 3 to 5 phase operational rollout roadmap that civic teams, NGOs, and municipal departments can follow to execute this intervention.

Return a valid JSON object conforming strictly to this format:
{
  "overview": "A compelling 2-3 sentence strategic executive overview of the rollout strategy and key risk controls.",
  "milestones": [
    {
      "title": "Phase 1: [Descriptive Milestone Title]",
      "description": "Clear explanation of core operational actions, regulatory clearances, or logistical tasks completed in this phase.",
      "duration": "Estimated duration (e.g. 'Weeks 1-4' or 'Month 1')",
      "target_actor": "Responsible entity (e.g. 'City Logistics Division' or 'Food Bank Coalition')",
      "target_completion": "Relative completion marker (e.g. 'End of Month 1')"
    }
  ]
}

Ensure the output is valid JSON.`;
}
