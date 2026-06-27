import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { createUserSchema } from "@/lib/validations/user";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { name, email, username, password, role, sendWelcomeEmail: shouldSendWelcome, markVerified, internalNote } =
    parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });

  if (username) {
    const usernameTaken = await db.user.findUnique({ where: { username } });
    if (usernameTaken) return NextResponse.json({ error: "Ese username ya está en uso" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const user = await db.user.create({
    data: {
      name,
      email,
      username: username || null,
      password: hashedPassword,
      role,
      isVerified: markVerified,
      verifyToken: markVerified ? null : verifyToken,
      verifyTokenExp: markVerified ? null : new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
      internalNote: internalNote || null,
      createdById: session.user.id,
    },
  });

  await db.userActivityLog.create({
    data: {
      userId: session.user.id,
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      metadata: { createdBy: session.user.id },
    },
  });

  await db.notification.create({
    data: {
      userId: user.id,
      type: "ACCOUNT_CREATED",
      title: "Bienvenido a Golazo Mundial",
      message: "Un administrador creó tu cuenta.",
    },
  });

  if (shouldSendWelcome) {
    await sendWelcomeEmail({ to: user.email, name: user.name, tempPassword: password });
  }
  if (!markVerified) {
    await sendVerificationEmail({ to: user.email, name: user.name, token: verifyToken });
  }

  return NextResponse.json({ success: true, user: { id: user.id } }, { status: 201 });
}
