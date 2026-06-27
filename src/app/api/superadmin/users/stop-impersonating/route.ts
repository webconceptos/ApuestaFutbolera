import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildSessionToken } from "@/lib/impersonation";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.impersonatedBy) {
    return NextResponse.json({ error: "No estás impersonando a nadie" }, { status: 400 });
  }

  const admin = await db.user.findUnique({ where: { id: session.impersonatedBy } });
  if (!admin) return NextResponse.json({ error: "No se pudo restaurar la sesión del admin" }, { status: 500 });

  const { cookieName, token, secure } = await buildSessionToken(request, {
    id: admin.id,
    role: admin.role,
    name: admin.name,
    email: admin.email,
  });

  await db.userActivityLog.create({
    data: {
      userId: admin.id,
      action: "IMPERSONATION_ENDED",
      entityType: "User",
      entityId: session.user.id,
      metadata: { targetEmail: session.user.email },
    },
  });

  // Ver nota en impersonate/route.ts sobre por qué este cookies.set() debe
  // ejecutarse después de `auth()` (no antes).
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieName, token, { httpOnly: true, sameSite: "lax", path: "/", secure });

  return response;
}
