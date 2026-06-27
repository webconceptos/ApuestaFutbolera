import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GlassCard } from "@/components/ui/glass-card";

export default async function SuperadminPage() {
  const session = await auth();
  const [tournamentCount, userCount] = await Promise.all([db.tournament.count(), db.user.count()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">¡Bienvenido, {session?.user.name}!</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/superadmin/tournaments">
          <GlassCard className="transition-colors hover:bg-white/10">
            <p className="text-sm text-text-muted">Torneos</p>
            <p className="font-display text-3xl text-text-primary">{tournamentCount}</p>
          </GlassCard>
        </Link>
        <Link href="/superadmin/users">
          <GlassCard className="transition-colors hover:bg-white/10">
            <p className="text-sm text-text-muted">Usuarios</p>
            <p className="font-display text-3xl text-text-primary">{userCount}</p>
          </GlassCard>
        </Link>
      </div>
    </div>
  );
}
