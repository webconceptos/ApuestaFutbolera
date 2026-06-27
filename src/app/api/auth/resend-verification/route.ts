import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Mismo principio que /api/auth/forgot-password: respuesta genérica siempre,
// para no permitir enumerar qué emails están registrados o ya verificados.
const GENERIC_RESPONSE = {
  success: true,
  message: "Si la cuenta existe y no está verificada, te enviamos un nuevo email de verificación.",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (!user || user.isVerified) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const verifyToken = crypto.randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: user.id },
    data: { verifyToken, verifyTokenExp: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
  });

  await sendVerificationEmail({ to: user.email, name: user.name, token: verifyToken });

  return NextResponse.json(GENERIC_RESPONSE);
}
