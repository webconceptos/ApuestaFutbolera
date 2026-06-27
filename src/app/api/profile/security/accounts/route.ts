import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const provider = request.nextUrl.searchParams.get("provider");
  if (!provider) return NextResponse.json({ error: "Falta el provider" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  const accountCount = await db.account.count({ where: { userId: session.user.id } });

  // Si no tiene contraseña, el OAuth vinculado es su único método de acceso.
  if (!user?.password && accountCount <= 1) {
    return NextResponse.json(
      { error: "No puedes desvincular tu único método de acceso. Configura una contraseña primero." },
      { status: 400 }
    );
  }

  await db.account.deleteMany({ where: { userId: session.user.id, provider } });

  return NextResponse.json({ success: true });
}
