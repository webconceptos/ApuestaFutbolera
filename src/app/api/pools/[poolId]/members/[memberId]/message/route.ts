import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";
import { sendPoolMessageEmail } from "@/lib/email";
import { memberMessageSchema } from "@/lib/validations/pool-member";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poolId: string; memberId: string }> }
) {
  const { poolId, memberId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = memberMessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const member = await db.poolMember.findUnique({ where: { id: memberId }, include: { user: true } });
  if (!member || member.poolId !== poolId) return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });

  const pool = await db.pool.findUniqueOrThrow({ where: { id: poolId } });

  await db.notification.create({
    data: {
      userId: member.userId,
      poolId,
      type: "CUSTOM",
      title: parsed.data.title,
      message: parsed.data.message,
    },
  });

  await sendPoolMessageEmail({
    to: member.user.email,
    name: member.user.name,
    poolName: pool.name,
    title: parsed.data.title,
    message: parsed.data.message,
  });

  return NextResponse.json({ success: true });
}
