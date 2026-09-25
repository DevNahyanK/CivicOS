"use client";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
export function LogoutButton() { return <form action={logoutAction}><Button type="submit" variant="ghost" className="w-full justify-start"><LogOut size={17} /> Sign out</Button></form>; }
