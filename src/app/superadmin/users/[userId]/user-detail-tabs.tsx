"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function UserDetailTabs({ userId }: { userId: string }) {
  const pathname = usePathname();
  const base = `/superadmin/users/${userId}`;
  const tabs = [
    { href: base, label: "Información" },
    { href: `${base}/security`, label: "Seguridad" },
    { href: `${base}/activity`, label: "Actividad" },
  ];

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border-glass pb-3">
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-white/5 hover:text-text-primary",
              active && "bg-white/10 text-text-primary"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
