import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validations/auth";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const userCount = await db.user.count();
  const isFirstUser = userCount === 0;

  const hashedPassword = await bcrypt.hash(password, 12);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      // El primer usuario del sistema se convierte en SUPERADMIN automáticamente.
      role: isFirstUser ? "SUPERADMIN" : "USER",
      isVerified: isFirstUser,
      verifyToken: isFirstUser ? null : verifyToken,
      verifyTokenExp: isFirstUser ? null : new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    },
  });

  await db.userActivityLog.create({
    data: { userId: user.id, action: "REGISTER" },
  });

  if (!isFirstUser) {
    await sendVerificationEmail({ to: user.email, name: user.name, token: verifyToken });
  }

  return NextResponse.json(
    {
      success: true,
      requiresVerification: !isFirstUser,
      message: isFirstUser
        ? "Cuenta creada como Superadmin. Ya puedes iniciar sesión."
        : "Cuenta creada. Revisa tu email para verificarla antes de iniciar sesión.",
    },
    { status: 201 }
  );
}
