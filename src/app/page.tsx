import { OverviewDashboard } from "@/features/overview/overview-dashboard";
import { getCurrentUserProblems } from "@/features/problems/repository";
import { getProblemScenarios } from "@/features/scenarios/repository";
import { getProblemSolutions } from "@/features/solutions/repository";

export default async function Home() {
  const { problems, error } = await getCurrentUserProblems();

  const counts =
    !error && problems.length > 0
      ? await Promise.all(
          problems.map(async (p) => {
            const [{ scenarios }, { solutions }] = await Promise.all([
              getProblemScenarios(p.id),
              getProblemSolutions(p.id),
            ]);
            return {
              scenariosCount: scenarios.length,
              solutionsCount: solutions.length,
            };
          })
        )
      : [];

  const totalScenarios = counts.reduce((acc, c) => acc + c.scenariosCount, 0);
  const totalSolutions = counts.reduce((acc, c) => acc + c.solutionsCount, 0);

  return (
    <OverviewDashboard
      problems={problems}
      error={error}
      scenariosCount={totalScenarios}
      solutionsCount={totalSolutions}
    />
  );
}
