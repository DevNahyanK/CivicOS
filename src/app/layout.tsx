import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
export const metadata: Metadata = { title: "CivicOS | AI City Problem Solver", description: "Turn city problems into tested solutions." };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en" className={geist.variable}><body><AppShell>{children}</AppShell></body></html>; }
