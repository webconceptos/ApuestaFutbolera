import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Siempre responde con el mismo mensaje genérico, exista o no la cuenta, para
// no permitir enumerar emails registrados.
const GENERIC_RESPONSE = {
  success: true,
  message: "Si el email existe, te enviamos instrucciones para restablecer tu contraseña.",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  // Las cuentas que solo usan OAuth (sin password) no tienen contraseña que resetear.
  if (!user || !user.password) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });

  await sendPasswordResetEmail({ to: user.email, name: user.name, token: resetToken });

  return NextResponse.json(GENERIC_RESPONSE);
}
