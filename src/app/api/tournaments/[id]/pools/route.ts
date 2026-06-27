import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { generateUniqueSlug, generateInviteCode } from "@/lib/slug";
import { createPoolSchema } from "@/lib/validations/pool";

// Crear pollas es solo para administradores (SUPERADMIN o TOURNAMENT_MANAGER),
// no para usuarios comunes — restricción de negocio pedida explícitamente,
// no estaba así en el diseño original de CLAUDE.md.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPERADMIN", "TOURNAMENT_MANAGER");
  if (!session) return NextResponse.json({ error: "Solo administradores pueden crear pollas" }, { status: 403 });

  const { id: tournamentId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createPoolSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || !tournament.isActive) {
    return NextResponse.json({ error: "Torneo no disponible" }, { status: 404 });
  }

  const { name, description, logo, inviteOnly } = parsed.data;
  const slug = await generateUniqueSlug(name);
  const inviteCode = generateInviteCode();

  const pool = await db.$transaction(async (tx) => {
    const created = await tx.pool.create({
      data: {
        tournamentId,
        ownerId: session.user.id,
        name,
        slug,
        description: description || null,
        logo: logo || null,
        inviteOnly,
        // El form solo expone un toggle ("¿Pública o privada?"); una polla
        // pública (no inviteOnly) también aparece listada en el torneo.
        isPublic: !inviteOnly,
        inviteCode,
      },
    });

    await tx.poolConfig.create({ data: { poolId: created.id } });

    await tx.poolMember.create({
      data: { poolId: created.id, userId: session.user.id, role: "OWNER", hasPaid: true },
    });

    return created;
  });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "POOL_CREATED", entityType: "Pool", entityId: pool.id },
  });

  return NextResponse.json({ success: true, pool: { id: pool.id, slug: pool.slug } }, { status: 201 });
}
