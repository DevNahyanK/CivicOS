import { OverviewDashboard } from "@/features/overview/overview-dashboard";
import { getCurrentUserProblems } from "@/features/problems/repository";
export default async function Home() { const { problems, error } = await getCurrentUserProblems(); return <OverviewDashboard problems={problems} error={error} />; }
