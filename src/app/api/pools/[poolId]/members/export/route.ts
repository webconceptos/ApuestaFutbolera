import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePoolRole } from "@/lib/require-pool-role";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  const ctx = await requirePoolRole(poolId, ["OWNER", "MODERATOR"]);
  if (!ctx) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const members = await db.poolMember.findMany({
    where: { poolId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const header = ["Nombre", "Email", "Rol", "Puntos", "Pagó", "Activo", "Se unió"];
  const rows = members.map((m) =>
    [m.user.name, m.user.email, m.role, String(m.totalPoints), m.hasPaid ? "si" : "no", m.isActive ? "si" : "no", m.joinedAt.toISOString()]
      .map((v) => csvEscape(v))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="miembros-${poolId}.csv"`,
    },
  });
}
