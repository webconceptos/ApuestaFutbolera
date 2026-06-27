import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { buildSessionToken } from "@/lib/impersonation";

const IMPERSONATION_MAX_AGE = 60 * 60; // 1 hora

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes impersonarte a ti mismo" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (target.role === "SUPERADMIN") {
    return NextResponse.json({ error: "No se puede impersonar a otro Superadmin" }, { status: 400 });
  }
  if (!target.isActive) {
    return NextResponse.json({ error: "No se puede impersonar a una cuenta suspendida" }, { status: 400 });
  }

  const { cookieName, token, secure } = await buildSessionToken(
    request,
    { id: target.id, role: target.role, name: target.name, email: target.email },
    { impersonatedBy: session.user.id, maxAge: IMPERSONATION_MAX_AGE }
  );

  await db.userActivityLog.create({
    data: {
      userId: session.user.id,
      action: "IMPERSONATION_STARTED",
      entityType: "User",
      entityId: target.id,
      metadata: { targetEmail: target.email },
    },
  });

  // IMPORTANTE: `requireRole` (arriba) ya llamó a `auth()`, que internamente
  // agenda su propio refresh de la cookie de sesión del admin vía
  // `next/headers`. Eso termina produciendo DOS `Set-Cookie` con el mismo
  // nombre en la respuesta. Los navegadores aplican el ÚLTIMO Set-Cookie de
  // un mismo nombre, así que mientras este bloque se ejecute *después* del
  // `requireRole`, nuestra cookie de impersonación es la que gana. No
  // reordenar este archivo sin volver a probar el flujo completo.
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: IMPERSONATION_MAX_AGE,
  });

  return response;
}
