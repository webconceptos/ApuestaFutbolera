import type { GlobalRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Helper compartido por las rutas API restringidas por rol (ej. /api/superadmin/*).
export async function requireRole(...roles: GlobalRole[]) {
  const session = await auth();
  if (!session?.user || !roles.includes(session.user.role)) return null;
  return session;
}

type TournamentPermission = "edit" | "create" | "results";

// SUPERADMIN siempre puede. TOURNAMENT_MANAGER puede solo si está asignado a
// ese torneo y tiene el flag correspondiente (canEditMatches/canCreateMatches/
// canEnterResults en TournamentManager). Ver tabla de permisos en CLAUDE.md.
export async function canManageTournament(tournamentId: string, permission: TournamentPermission) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "SUPERADMIN") return session;
  if (session.user.role !== "TOURNAMENT_MANAGER") return null;

  const manager = await db.tournamentManager.findUnique({
    where: { userId_tournamentId: { userId: session.user.id, tournamentId } },
  });
  if (!manager) return null;

  if (permission === "edit" && !manager.canEditMatches) return null;
  if (permission === "create" && !manager.canCreateMatches) return null;
  if (permission === "results" && !manager.canEnterResults) return null;

  return session;
}
