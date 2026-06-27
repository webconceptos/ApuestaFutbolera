import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { updateManagerPermissionsSchema } from "@/lib/validations/manager";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; managerId: string }> }
) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id: tournamentId, managerId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateManagerPermissionsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const manager = await db.tournamentManager.findUnique({ where: { id: managerId } });
  if (!manager || manager.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Manager no encontrado" }, { status: 404 });
  }

  const updated = await db.tournamentManager.update({ where: { id: managerId }, data: parsed.data });

  return NextResponse.json({ success: true, manager: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; managerId: string }> }
) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id: tournamentId, managerId } = await params;
  const manager = await db.tournamentManager.findUnique({ where: { id: managerId } });
  if (!manager || manager.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Manager no encontrado" }, { status: 404 });
  }

  await db.tournamentManager.delete({ where: { id: managerId } });

  await db.userActivityLog.create({
    data: {
      userId: session.user.id,
      action: "MANAGER_REVOKED",
      entityType: "Tournament",
      entityId: tournamentId,
      metadata: { managerUserId: manager.userId },
    },
  });

  return NextResponse.json({ success: true });
}
