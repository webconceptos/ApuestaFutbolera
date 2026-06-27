"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Trophy, User as UserIcon, Bell, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalRole } from "@prisma/client";

interface SidebarProps {
  role: GlobalRole;
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Mis Pollas", icon: LayoutDashboard },
  { href: "/tournaments", label: "Torneos", icon: Trophy },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/profile", label: "Mi Perfil", icon: UserIcon },
];

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items =
    role === "SUPERADMIN" ? [...NAV_ITEMS, { href: "/superadmin", label: "Superadmin", icon: ShieldCheck }] : NAV_ITEMS;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "glass-surface fixed inset-y-0 left-0 z-50 w-64 -translate-x-full overflow-y-auto p-4 transition-transform duration-200",
          "lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0",
          open && "translate-x-0"
        )}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="font-display text-xl text-text-primary">Menú</span>
          <button onClick={onClose} aria-label="Cerrar menú">
            <X className="h-5 w-5 text-text-primary" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-white/5 hover:text-text-primary",
                  active && "bg-white/10 text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
