import { getCurrentUserProblems } from "@/features/problems/repository";
import { getProblemScenarios } from "@/features/scenarios/repository";
import { getProblemSolutions } from "@/features/solutions/repository";
import { foodRecoveryModelDefinition } from "@/simulation/models/food-recovery";
import { SimulationEngine } from "@/simulation/core/engine";
import type { SimulationInputValues } from "@/simulation/types";
import type { SolutionMilestone } from "@/lib/validation/solution";
import {
  ImpactDashboard,
  type ProblemImpactSummary,
} from "@/features/impact/components/impact-dashboard";

export default async function ImpactPage() {
  const { problems, error } = await getCurrentUserProblems();

  if (error || problems.length === 0) {
    return <ImpactDashboard summaries={[]} />;
  }

  // Aggregate metrics across all user problems deterministically
  const summaries: ProblemImpactSummary[] = await Promise.all(
    problems.map(async (problem) => {
      const [{ scenarios }, { solutions }] = await Promise.all([
        getProblemScenarios(problem.id),
        getProblemSolutions(problem.id),
      ]);

      // Find active scenario (baseline preferred, or first saved scenario)
      const primaryScenario = scenarios.find((s) => s.is_baseline) ?? scenarios[0] ?? null;

      const rawInputs = (primaryScenario &&
      typeof primaryScenario.inputs === "object" &&
      primaryScenario.inputs !== null
        ? primaryScenario.inputs
        : {}) as SimulationInputValues;

      // Deterministically run the simulation engine
      const simResult = SimulationEngine.run({
        model: foodRecoveryModelDefinition,
        inputs: rawInputs,
      });

      const dailySurplusKg = Number(simResult.metrics.daily_total_surplus_kg?.value ?? 0);
      const dailyRecoveredKg = Number(simResult.metrics.actual_recovered_food_kg?.value ?? 0);
      const annualRecoveredTons = (dailyRecoveredKg * 365) / 1000;
      const dailyMeals = Number(simResult.metrics.meals_provided_daily?.value ?? 0);
      const annualMeals = dailyMeals * 365;
      const activeVehicles = Number(simResult.resolvedInputs.active_vehicles?.value ?? 3);
      const fleetUtilizationPct = Number(simResult.metrics.fleet_utilization_pct?.value ?? 0);

      // Milestones tally
      let totalMilestones = 0;
      let completedMilestones = 0;
      for (const sol of solutions) {
        const list = (Array.isArray(sol.milestones) ? sol.milestones : []) as SolutionMilestone[];
        totalMilestones += list.length;
        completedMilestones += list.filter((m) => m.status === "completed").length;
      }

      // Location context
      let location: string | null = null;
      if (
        problem.location_context &&
        typeof problem.location_context === "object" &&
        !Array.isArray(problem.location_context) &&
        "label" in problem.location_context &&
        typeof (problem.location_context as { label: unknown }).label === "string"
      ) {
        location = (problem.location_context as { label: string }).label;
      }

      return {
        problemId: problem.id,
        problemTitle: problem.title,
        problemStatus: problem.status,
        location,
        scenarioCount: scenarios.length,
        baselineScenarioName: primaryScenario?.name ?? null,
        dailySurplusKg,
        dailyRecoveredKg,
        annualRecoveredTons,
        dailyMeals,
        annualMeals,
        fleetUtilizationPct,
        activeVehicles,
        solutionsCount: solutions.length,
        completedMilestones,
        totalMilestones,
      };
    })
  );

  return <ImpactDashboard summaries={summaries} />;
}
