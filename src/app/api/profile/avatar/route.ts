import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");

async function removeExistingAvatar(userId: string) {
  for (const ext of Object.values(ALLOWED_TYPES)) {
    await unlink(path.join(AVATARS_DIR, `${userId}.${ext}`)).catch(() => {});
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("avatar");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Formato no soportado (usa jpg, png o webp)" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "La imagen no puede superar 2MB" }, { status: 400 });
  }

  await removeExistingAvatar(session.user.id);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(AVATARS_DIR, `${session.user.id}.${ext}`), buffer);

  const avatarUrl = `/avatars/${session.user.id}.${ext}?v=${Date.now()}`;
  await db.user.update({ where: { id: session.user.id }, data: { avatarUrl } });
  await db.userActivityLog.create({ data: { userId: session.user.id, action: "AVATAR_UPDATED" } });

  return NextResponse.json({ success: true, avatarUrl });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  await removeExistingAvatar(session.user.id);
  await db.user.update({ where: { id: session.user.id }, data: { avatarUrl: null } });
  await db.userActivityLog.create({ data: { userId: session.user.id, action: "AVATAR_UPDATED" } });

  return NextResponse.json({ success: true });
}
