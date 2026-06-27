import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/require-role";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { importUserRowSchema, importUsersSchema } from "@/lib/validations/user";
import { parseCsv } from "@/lib/csv";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ROWS = 500;
const EXPECTED_HEADER = ["nombre", "email", "username", "rol"];

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url"); // 12 chars, sin ambigüedad de mayúsc/minúsc
}

interface RowResult {
  row: number;
  email: string;
  status: "created" | "error";
  message?: string;
}

export async function POST(request: NextRequest) {
  const session = await requireRole("SUPERADMIN");
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsedBody = importUsersSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }
  const { csv, sendWelcomeEmail: shouldSendWelcome, markVerified } = parsedBody.data;

  const allRows = parseCsv(csv);
  if (allRows.length === 0) {
    return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
  }

  const header = allRows[0].map((h) => h.trim().toLowerCase());
  const looksLikeHeader = EXPECTED_HEADER.every((col, i) => header[i] === col);
  const dataRows = looksLikeHeader ? allRows.slice(1) : allRows;

  if (dataRows.length === 0) {
    return NextResponse.json({ error: "No hay filas de datos para importar" }, { status: 400 });
  }
  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Máximo ${MAX_ROWS} filas por archivo` }, { status: 400 });
  }

  // Formato esperado por columna: Nombre, Email, Username (opcional), Rol (opcional).
  const results: RowResult[] = [];
  const seenEmails = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + (looksLikeHeader ? 2 : 1); // número de línea real en el archivo, para que el error sea ubicable
    const [name, email, username, role] = dataRows[i];

    const parsedRow = importUserRowSchema.safeParse({
      name: name ?? "",
      email: email ?? "",
      username: username || undefined,
      role: role ? role.trim().toUpperCase() : undefined,
    });

    if (!parsedRow.success) {
      results.push({
        row: rowNumber,
        email: email ?? "",
        status: "error",
        message: parsedRow.error.issues[0]?.message ?? "Fila inválida",
      });
      continue;
    }

    const data = parsedRow.data;

    if (seenEmails.has(data.email)) {
      results.push({ row: rowNumber, email: data.email, status: "error", message: "Email duplicado en el archivo" });
      continue;
    }
    seenEmails.add(data.email);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      results.push({ row: rowNumber, email: data.email, status: "error", message: "Ya existe una cuenta con ese email" });
      continue;
    }

    if (data.username) {
      const usernameTaken = await db.user.findUnique({ where: { username: data.username } });
      if (usernameTaken) {
        results.push({ row: rowNumber, email: data.email, status: "error", message: "Ese username ya está en uso" });
        continue;
      }
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        username: data.username || null,
        password: hashedPassword,
        role: data.role,
        isVerified: markVerified,
        verifyToken: markVerified ? null : verifyToken,
        verifyTokenExp: markVerified ? null : new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
        createdById: session.user.id,
      },
    });

    await db.userActivityLog.create({
      data: {
        userId: session.user.id,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        metadata: { createdBy: session.user.id, source: "csv_import" },
      },
    });

    await db.notification.create({
      data: { userId: user.id, type: "ACCOUNT_CREATED", title: "Bienvenido a Golazo Mundial", message: "Un administrador creó tu cuenta." },
    });

    if (shouldSendWelcome) {
      await sendWelcomeEmail({ to: user.email, name: user.name, tempPassword });
    }
    if (!markVerified) {
      await sendVerificationEmail({ to: user.email, name: user.name, token: verifyToken });
    }

    results.push({ row: rowNumber, email: data.email, status: "created" });
  }

  const created = results.filter((r) => r.status === "created").length;
  const errors = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ success: true, created, errors, results });
}
