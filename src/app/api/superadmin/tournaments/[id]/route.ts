import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { tournamentSchema, tournamentStatusSchema } from "@/lib/validations/tournament";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const tournament = await db.tournament.findUnique({ where: { id } });
  if (!tournament) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });

  // Toggle rápido (isActive/isPublic) desde la lista, sin pasar por el form completo.
  if (body && !("name" in body)) {
    const parsed = tournamentStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const updated = await db.tournament.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, tournament: updated });
  }

  const parsed = tournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { logo, country, description, ...rest } = parsed.data;

  const updated = await db.tournament.update({
    where: { id },
    data: {
      ...rest,
      logo: logo || null,
      country: country || null,
      description: description || null,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "TOURNAMENT_UPDATED", entityType: "Tournament", entityId: id },
  });

  return NextResponse.json({ success: true, tournament: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  const exists = await db.tournament.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });

  const [matchCount, poolCount] = await Promise.all([
    db.match.count({ where: { tournamentId: id } }),
    db.pool.count({ where: { tournamentId: id } }),
  ]);

  if (matchCount > 0 || poolCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: el torneo ya tiene partidos o pollas. Desactívalo en su lugar." },
      { status: 400 }
    );
  }

  await db.tournament.delete({ where: { id } });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "TOURNAMENT_DELETED", entityType: "Tournament", entityId: id },
  });

  return NextResponse.json({ success: true });
}
