import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET() {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      email: true,
      username: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  const header = ["Nombre", "Email", "Username", "Rol", "Activo", "Verificado", "Creado", "Último login"];
  const rows = users.map((u) =>
    [
      u.name,
      u.email,
      u.username ?? "",
      u.role,
      u.isActive ? "si" : "no",
      u.isVerified ? "si" : "no",
      u.createdAt.toISOString(),
      u.lastLoginAt?.toISOString() ?? "",
    ]
      .map((v) => csvEscape(String(v)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="usuarios-apuestafutbolera-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
