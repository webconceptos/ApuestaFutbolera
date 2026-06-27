import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPredictionOpen } from "@/lib/deadline";
import { predictionSchema } from "@/lib/validations/prediction";

export async function POST(request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { poolId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = predictionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  // a) Miembro activo y, si la polla cobra cuota, con la cuota pagada.
  const member = await db.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId: session.user.id } },
    include: { pool: { include: { config: true } } },
  });
  if (!member || !member.isActive) {
    return NextResponse.json({ error: "No formas parte de esta polla" }, { status: 403 });
  }
  if (member.pool.config?.entryFeeEnabled && !member.hasPaid) {
    return NextResponse.json({ error: "Tu cuota está pendiente de confirmación" }, { status: 403 });
  }

  const { matchId, homeScore, awayScore } = parsed.data;

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match || match.tournamentId !== member.pool.tournamentId) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  // b) Partido UPCOMING y todavía dentro del deadline de la polla.
  const deadlineHours = member.pool.config?.predictionDeadlineHours ?? 1;
  if (!isPredictionOpen(match.matchDate, deadlineHours, match.status)) {
    return NextResponse.json({ error: "Las apuestas para este partido ya cerraron" }, { status: 400 });
  }

  // d) Upsert: crea o edita (una predicción por usuario por partido por polla).
  const existing = await db.prediction.findUnique({
    where: { poolId_userId_matchId: { poolId, userId: session.user.id, matchId } },
  });

  const prediction = existing
    ? await db.prediction.update({
        where: { id: existing.id },
        data: { homeScore, awayScore, editedAt: new Date() },
      })
    : await db.prediction.create({
        data: { poolId, userId: session.user.id, matchId, homeScore, awayScore },
      });

  await db.userActivityLog.create({
    data: {
      userId: session.user.id,
      action: existing ? "PREDICTION_UPDATED" : "PREDICTION_CREATED",
      entityType: "Prediction",
      entityId: prediction.id,
      metadata: { matchId, homeScore, awayScore },
    },
  });

  return NextResponse.json({ success: true, prediction });
}
