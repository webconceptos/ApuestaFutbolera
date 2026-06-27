"use client";

import { useState } from "react";
import type { GlobalRole } from "@prisma/client";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { ParticleBackground } from "@/components/effects/particle-background";

interface AppShellProps {
  user: { name?: string | null; email?: string | null; role: GlobalRole };
  unreadCount: number;
  children: React.ReactNode;
}

export function AppShell({ user, unreadCount, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col">
      <ParticleBackground />
      <Header user={user} unreadCount={unreadCount} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1">
        <Sidebar role={user.role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
