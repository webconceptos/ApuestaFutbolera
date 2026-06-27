"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Trophy, Users, LogOut, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/superadmin/tournaments", label: "Torneos", icon: Trophy },
  { href: "/superadmin/users", label: "Usuarios", icon: Users },
];

export function SuperadminNav() {
  const pathname = usePathname();

  return (
    <header className="glass-surface sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-6">
        <Link href="/superadmin" className="font-display text-2xl tracking-wide text-text-primary">
          Golazo Mundial <span className="text-gold-start">Admin</span>
        </Link>
        <nav className="hidden gap-1 sm:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-white/5 hover:text-text-primary",
                  active && "bg-white/10 text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-text-muted hover:bg-white/5 hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a la app
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-error hover:bg-white/5"
        >
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>
    </header>
  );
}
