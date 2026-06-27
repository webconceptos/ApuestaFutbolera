import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmailChangeVerification } from "@/lib/email";
import { changeEmailSchema } from "@/lib/validations/profile";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = changeEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { newEmail, currentPassword } = parsed.data;

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) {
    return NextResponse.json({ error: "Tu cuenta usa solo OAuth, no tiene contraseña" }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "La contraseña es incorrecta" }, { status: 400 });
  }

  if (newEmail === user.email) {
    return NextResponse.json({ error: "Ese ya es tu email actual" }, { status: 400 });
  }

  const taken = await db.user.findUnique({ where: { email: newEmail } });
  if (taken) {
    return NextResponse.json({ error: "Ese email ya está en uso" }, { status: 409 });
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: user.id },
    data: { pendingEmail: newEmail, verifyToken, verifyTokenExp: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
  });

  await sendEmailChangeVerification({ to: newEmail, name: user.name, token: verifyToken });

  return NextResponse.json({
    success: true,
    message: `Te enviamos un email a ${newEmail} para confirmar el cambio. Tu email actual sigue activo hasta que confirmes.`,
  });
}
