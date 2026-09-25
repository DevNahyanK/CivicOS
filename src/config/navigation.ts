import { BarChart3, FileText, LayoutDashboard, Lightbulb, LineChart, Microscope, type LucideIcon } from "lucide-react";
export type NavigationItem = { label: string; href: string; icon: LucideIcon };
export const navigation: NavigationItem[] = [{ label: "Overview", href: "/", icon: LayoutDashboard }, { label: "Problems", href: "/problems", icon: FileText }, { label: "Solutions", href: "/solutions", icon: Lightbulb }, { label: "Simulator", href: "/simulator", icon: Microscope }, { label: "Scenarios", href: "/scenarios", icon: LineChart }, { label: "Impact", href: "/impact", icon: BarChart3 }];
