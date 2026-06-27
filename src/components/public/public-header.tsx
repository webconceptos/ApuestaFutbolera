import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { ShareButton } from "./share-button";

interface PublicHeaderProps {
  poolName: string;
  poolDescription: string | null;
  tournamentName: string;
  accentColor: string;
  joinHref: string;
}

export function PublicHeader({ poolName, poolDescription, tournamentName, accentColor, joinHref }: PublicHeaderProps) {
  return (
    <GlassCard accentColor={accentColor} className="flex flex-col gap-3">
      <div>
        <p className="text-sm text-text-muted">🏆 {tournamentName}</p>
        <h1 className="font-display text-3xl tracking-wide text-text-primary">{poolName}</h1>
        {poolDescription && <p className="mt-1 text-text-muted">{poolDescription}</p>}
      </div>
      <div className="flex gap-2">
        <ShareButton title={poolName} text={`Sigue el ranking de "${poolName}" en Golazo Mundial`} />
        <Link
          href={joinHref}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: accentColor }}
        >
          Unirme a esta polla
        </Link>
      </div>
    </GlassCard>
  );
}
