import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { deletePoolSchema } from "@/lib/validations/pool";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = deletePoolSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Escribe "ELIMINAR" para confirmar' }, { status: 400 });
  }

  const pool = await db.pool.findUnique({ where: { id: poolId }, select: { name: true } });

  // Notification.poolId no tiene relación Prisma con Pool (es un string suelto,
  // ver Paso 21), así que no se borra en cascada: hay que limpiarlo a mano.
  await db.notification.deleteMany({ where: { poolId } });
  await db.pool.delete({ where: { id: poolId } });

  // Se loguea con entityId=poolId aunque la polla ya no exista: UserActivityLog
  // guarda una referencia suelta (string), no una FK, igual que Notification.
  await db.userActivityLog.create({
    data: {
      userId: ctx.session.user.id,
      action: "POOL_DELETED",
      entityType: "Pool",
      entityId: poolId,
      metadata: { name: pool?.name },
    },
  });

  return NextResponse.json({ success: true });
}
