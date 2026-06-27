import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { tournamentSchema } from "@/lib/validations/tournament";

export async function POST(request: NextRequest) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = tournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { logo, country, description, ...rest } = parsed.data;

  const tournament = await db.tournament.create({
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
    data: {
      userId: session.user.id,
      action: "TOURNAMENT_CREATED",
      entityType: "Tournament",
      entityId: tournament.id,
    },
  });

  return NextResponse.json({ success: true, tournament }, { status: 201 });
}
