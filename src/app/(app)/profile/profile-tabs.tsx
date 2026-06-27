"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/profile", label: "Información" },
  { href: "/profile/security", label: "Seguridad" },
  { href: "/profile/notifications", label: "Notificaciones" },
  { href: "/profile/activity", label: "Actividad" },
  { href: "/profile/danger", label: "Peligro" },
];

export function ProfileTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border-glass pb-3">
      {TABS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-white/5 hover:text-text-primary",
              active && "bg-white/10 text-text-primary",
              href === "/profile/danger" && active && "text-error"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
