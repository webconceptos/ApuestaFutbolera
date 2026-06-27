import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { assignManagerSchema } from "@/lib/validations/manager";
import { notifyUser } from "@/lib/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id: tournamentId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = assignManagerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });

  const { userId, ...permissions } = parsed.data;
  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (targetUser.role === "SUPERADMIN") {
    return NextResponse.json({ error: "Un Superadmin ya tiene acceso total, no necesita asignación" }, { status: 400 });
  }

  const existing = await db.tournamentManager.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
  });
  if (existing) return NextResponse.json({ error: "Ese usuario ya es manager de este torneo" }, { status: 409 });

  await db.tournamentManager.create({
    data: { userId, tournamentId, assignedById: session.user.id, ...permissions },
  });

  await db.userActivityLog.create({
    data: {
      userId: session.user.id,
      action: "MANAGER_ASSIGNED",
      entityType: "Tournament",
      entityId: tournamentId,
      metadata: { managerUserId: userId },
    },
  });

  if (targetUser.role === "USER") {
    await db.user.update({ where: { id: userId }, data: { role: "TOURNAMENT_MANAGER" } });
    await db.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: "USER_ROLE_CHANGED",
        entityType: "User",
        entityId: userId,
        metadata: { from: "USER", to: "TOURNAMENT_MANAGER" },
      },
    });
  }

  await notifyUser({
    userId,
    type: "ROLE_CHANGED",
    title: "Nuevo torneo asignado",
    message: `Ahora eres manager de ${tournament.shortName}.`,
    metadata: { tournamentId },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
