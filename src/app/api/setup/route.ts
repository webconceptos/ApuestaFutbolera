import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { isSetupComplete } from "@/lib/setup";
import { setupSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  if (await isSetupComplete()) {
    return NextResponse.json({ error: "El setup inicial ya fue completado." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = setupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { name, email, password, appName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "SUPERADMIN",
      isVerified: true,
    },
  });

  await db.appSetup.create({
    data: { id: "singleton", appName, completedAt: new Date(), setupById: user.id },
  });

  await db.userActivityLog.create({
    data: { userId: user.id, action: "REGISTER", metadata: { via: "setup" } },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
