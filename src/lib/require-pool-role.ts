import type { PoolRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// Análogo a requireRole/canManageTournament pero para el rol DENTRO de una
// polla (PoolRole), que es independiente del GlobalRole del usuario.
export async function requirePoolRole(poolId: string, roles: PoolRole[]) {
  const session = await auth();
  if (!session?.user) return null;

  const member = await db.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: session.user.id } },
  });
  if (!member || !member.isActive || !roles.includes(member.role)) return null;

  return { session, member };
}
