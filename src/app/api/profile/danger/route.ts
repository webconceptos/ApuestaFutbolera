import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendAccountDeletionEmail } from "@/lib/email";
import { deleteAccountSchema } from "@/lib/validations/profile";

const DELETE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const ownedPool = await db.pool.findFirst({ where: { ownerId: session.user.id, isActive: true } });
  if (ownedPool) {
    return NextResponse.json(
      { error: "Eres OWNER de una o más pollas. Transfiérelas o elimínalas antes de borrar tu cuenta." },
      { status: 400 }
    );
  }

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const deleteToken = crypto.randomBytes(32).toString("hex");

  await db.user.update({
    where: { id: user.id },
    data: { deleteToken, deleteTokenExp: new Date(Date.now() + DELETE_TOKEN_TTL_MS) },
  });

  await sendAccountDeletionEmail({ to: user.email, name: user.name, token: deleteToken });

  return NextResponse.json({
    success: true,
    message: "Te enviamos un email para confirmar la eliminación de tu cuenta. El enlace expira en 24 horas.",
  });
}
