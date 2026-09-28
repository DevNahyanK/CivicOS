import type { SimulationResult } from "@/simulation/types";

export const SIMULATION_NARRATIVE_PROMPT_VERSION = "simulation_narrative_v1.0.0";

export const SIMULATION_NARRATIVE_SYSTEM_INSTRUCTION = `You are a senior civic policy strategist and municipal logistics advisor working within CivicOS.
Your objective is to provide a grounded, rigorous, and actionable strategic executive briefing for city policymakers, NGO directors, and operational heads based on deterministic urban simulation results.

CRITICAL ANALYTICAL PRINCIPLES:
1. STRICTLY QUALITATIVE INTERPRETATION & ZERO MATH:
   Do NOT calculate, recalculate, or alter any numbers. All input values, calculated metrics, fleet saturation percentages, and capacity limits provided in the prompt are ground-truth facts produced deterministically by CivicOS's verified TypeScript simulation engine. Treat them as immutable. Your role is strictly qualitative policy analysis: explaining what these numbers mean for governance, street operations, trade-offs, and public impact.
2. OPERATIONAL & REGULATORY REALITIES:
   Translate metrics into realistic urban operational dynamics (e.g. driver exhaustion, cold-chain compliance, fuel costs, commercial merchant friction, food spoilage time windows, equitable food distribution).
3. EXPLAIN STRATEGIC TRADE-OFFS:
   Every parameter change has trade-offs. Detail the tensions between operational expenditure, fleet utilization, geographical reach, and food recovery yield.
4. ACTIONABLE SEQUENCING:
   Provide concrete next steps naming the exact civic or operational actor responsible (e.g., City Department of Logistics, Food Bank Alliance, Municipal Council) with clear priority categorization ("immediate", "medium_term", or "long_term").
5. STRUCTURED JSON OUTPUT:
   Return strictly a valid JSON object matching the requested schema without any markdown formatting or commentary.`;

export interface SimulationNarrativePromptParams {
  problem: {
    title: string;
    description: string;
    location?: string | null;
  };
  currentResult: SimulationResult;
  baselineResult?: SimulationResult | null;
  baselineName?: string | null;
}

export function buildSimulationNarrativePrompt({
  problem,
  currentResult,
  baselineResult,
  baselineName,
}: SimulationNarrativePromptParams): string {
  // Format resolved inputs
  const inputsFormatted = Object.values(currentResult.resolvedInputs)
    .map((inp) => `  - ${inp.label}: ${inp.value} ${inp.unit ?? ""}`)
    .join("\n");

  // Format calculated metrics (strictly calculated by Phase 4 engine)
  const metricsFormatted = Object.values(currentResult.metrics)
    .map((m) => `  - ${m.label}: ${m.value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${m.unit ?? ""}`)
    .join("\n");

  // Format bottlenecks
  const bottlenecksFormatted =
    currentResult.bottlenecks.length > 0
      ? currentResult.bottlenecks
          .map((b) => `  - [${b.severity.toUpperCase()}] ${b.label}: ${b.message}`)
          .join("\n")
      : "  - None detected. System is operating within normal capacity limits.";

  // Format constraints
  const constraintsFormatted =
    currentResult.constraints.length > 0
      ? currentResult.constraints
          .map(
            (c) =>
              `  - ${c.label} (${c.satisfied ? "SATISFIED" : "VIOLATED"}): ${c.description}${c.message ? ` [Detail: ${c.message}]` : ""}`
          )
          .join("\n")
      : "  - None defined.";

  // Format baseline comparison if available
  let baselineSection = "";
  if (baselineResult && baselineName) {
    const baselineMetrics = Object.values(baselineResult.metrics)
      .map((m) => `    * ${m.label}: ${m.value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${m.unit ?? ""}`)
      .join("\n");

    baselineSection = `
Baseline Scenario Comparison:
- Reference Baseline: "${baselineName}"
- Baseline Metrics:
${baselineMetrics}
- Note the delta and shifts when contrasting this live configuration with the reference baseline.`;
  }

  return `Please review the following civic challenge and deterministic simulation results:

CIVIC CHALLENGE CONTEXT:
- Title: "${problem.title}"
- Description:
"""
${problem.description}
"""
- Location: ${problem.location ? `"${problem.location}"` : "Metropolitan Context"}

GROUND-TRUTH SIMULATION CONFIGURATION & METRICS (Deterministically Calculated):
Active Input Parameters:
${inputsFormatted}

Calculated Operational Metrics:
${metricsFormatted}

Detected Bottlenecks:
${bottlenecksFormatted}

System Constraints Status:
${constraintsFormatted}
${baselineSection}

TASK:
Based strictly on the provided simulation figures, generate an authoritative strategic narrative and executive briefing for municipal decision-makers. Do NOT invent new numbers or perform calculations. Interpret the provided data qualitatively.

Return a JSON object conforming strictly to this structure:
{
  "executive_summary": "A cohesive 2-4 sentence high-level executive synthesis summarizing the operational performance, public impact, and feasibility of this configuration for city leaders.",
  "key_tradeoffs": [
    {
      "title": "Clear headline for the operational trade-off (e.g. Fleet Expansion vs Spoilage Window)",
      "description": "Thorough explanation of the friction or balancing act between two operational factors.",
      "impact": "Concrete consequence for the city, drivers, or community."
    }
  ],
  "bottleneck_assessment": "In-depth narrative assessment explaining why the identified bottlenecks occur (or why operations remain stable), what ceiling limits future expansion, and operational risks.",
  "policy_recommendations": [
    {
      "recommendation": "Concrete actionable policy or operational intervention.",
      "target_actor": "Exact agency, department, or civic group (e.g. City Department of Logistics, Food Bank Network)",
      "priority": "immediate" | "medium_term" | "long_term",
      "rationale": "Why this intervention is justified based on the simulation metrics."
    }
  ]
}

Ensure the output is valid JSON.`;
}
