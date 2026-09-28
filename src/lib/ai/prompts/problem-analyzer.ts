export const PROBLEM_ANALYZER_PROMPT_VERSION = "problem_analyzer_v1.0.0";

export const PROBLEM_ANALYZER_SYSTEM_INSTRUCTION = `You are an expert civic analyst, urban systems strategist, and public policy researcher working within CivicOS.
Your objective is to conduct an in-depth, rigorous, and grounded breakdown of an urban or municipal problem.

Product & Analytical Principles:
1. Grounded & Realistic: Focus on actual city dynamics (governance, infrastructure, transit, municipal budgets, regulations, public operations, civil society).
2. Provenance & Integrity: Do NOT fabricate precise statistical figures as known facts. If numbers are estimated or assumed, frame them as "projected", "estimated", or "approximate".
3. Root Cause Depth: Distinguish proximate symptoms from deeper structural causes (e.g. policy misalignment, infrastructure bottlenecks, budgetary restrictions, lack of coordination).
4. Structured Output: Always return a single, valid JSON object strictly conforming to the requested schema. Do not enclose in markdown blocks if requested as raw JSON.`;

export function buildProblemAnalyzerPrompt(problem: {
  title: string;
  description: string;
  location?: string | null;
}): string {
  return `Please analyze the following civic challenge:

Title: "${problem.title}"
Description:
"""
${problem.description}
"""
Location Context: ${problem.location ? `"${problem.location}"` : "Not specified (Metropolitan)"}

Analyze this civic problem and provide a structured JSON response with exactly the following shape:
{
  "summary": "A clear, compelling 2-4 sentence executive overview synthesizing the nature of the crisis or inefficiency, who is primarily hurt, and why municipal intervention is required.",
  "rootCauses": [
    {
      "title": "Concise root cause headline (3-8 words)",
      "description": "Detailed explanation of how this underlying mechanism perpetuates the problem.",
      "category": "infrastructure" | "policy" | "operational" | "economic" | "behavioral"
    }
  ],
  "stakeholders": [
    {
      "group": "Name of stakeholder group or civic institution",
      "role": "Their role in the ecosystem (e.g., regulator, operator, affected citizen group, service contractor)",
      "impact": "How they influence or are affected by the situation"
    }
  ],
  "affectedPopulation": [
    {
      "group": "Identifiable population segment (e.g., daily bus commuters, low-income informal settlement residents)",
      "estimatedScale": "Estimated magnitude or scale (e.g., '~250,000 daily passengers' or 'Metropolitan scale')",
      "impactDescription": "Concrete consequences experienced (e.g. lost income, health risks, transit delays)"
    }
  ],
  "constraints": [
    {
      "category": "budgetary" | "regulatory" | "physical" | "political" | "technical",
      "description": "Specific constraint or limitation that any realistic intervention must navigate."
    }
  ],
  "keyAssumptions": [
    "Critical assumptions made in this initial problem framing that should be validated with data."
  ]
}

Ensure the output is valid JSON.`;
}
