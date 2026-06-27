import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (!user.password) {
    return NextResponse.json({ error: "Esta cuenta usa solo OAuth, no tiene contraseña" }, { status: 400 });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await db.user.update({
    where: { id },
    data: { resetToken, resetTokenExp: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  await sendPasswordResetEmail({ to: user.email, name: user.name, token: resetToken });

  await db.userActivityLog.create({
    data: { userId: session.user.id, action: "USER_PASSWORD_RESET", entityType: "User", entityId: id },
  });

  return NextResponse.json({ success: true, message: `Email de reset enviado a ${user.email}.` });
}
