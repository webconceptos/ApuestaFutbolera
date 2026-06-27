import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const user = await db.user.findFirst({ where: { resetToken: token } });

  if (!user || !user.resetTokenExp || user.resetTokenExp < new Date()) {
    return NextResponse.json({ error: "El enlace es inválido o expiró" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetToken: null, resetTokenExp: null, passwordChangedAt: new Date() },
  });

  await db.userActivityLog.create({
    data: { userId: user.id, action: "PASSWORD_CHANGED" },
  });

  return NextResponse.json({ success: true });
}
