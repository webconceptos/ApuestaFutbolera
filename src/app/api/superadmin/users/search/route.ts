import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

export async function GET(request: NextRequest) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ users: [] });

  const users = await db.user.findMany({
    where: {
      role: { in: ["USER", "TOURNAMENT_MANAGER"] },
      isActive: true,
      OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, name: true, email: true, role: true },
    take: 10,
  });

  return NextResponse.json({ users });
}
