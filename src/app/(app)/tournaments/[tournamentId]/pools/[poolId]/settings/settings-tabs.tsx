"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SettingsTabsProps {
  tournamentId: string;
  poolId: string;
  isOwner: boolean;
}

export function SettingsTabs({ tournamentId, poolId, isOwner }: SettingsTabsProps) {
  const pathname = usePathname();
  const base = `/tournaments/${tournamentId}/pools/${poolId}/settings`;

  const tabs = [
    { href: base, label: "General", ownerOnly: true },
    { href: `${base}/scoring`, label: "Puntuación", ownerOnly: true },
    { href: `${base}/fee`, label: "Cuota", ownerOnly: true },
    { href: `${base}/visibility`, label: "Visibilidad", ownerOnly: true },
    { href: `${base}/members`, label: "Miembros", ownerOnly: false },
    { href: `${base}/predictions`, label: "Predicciones", ownerOnly: false },
    { href: `${base}/enter-predictions`, label: "Ingresar", ownerOnly: false },
    { href: `${base}/danger`, label: "Peligro", ownerOnly: true },
  ].filter((tab) => isOwner || !tab.ownerOnly);

  return (
    <nav className="mt-3 flex flex-wrap gap-2 border-b border-border-glass pb-3 text-sm">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              active ? "bg-white/10 text-text-primary" : "text-text-muted hover:bg-white/5"
            } ${tab.label === "Peligro" ? (active ? "text-error" : "text-error/70 hover:text-error") : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
