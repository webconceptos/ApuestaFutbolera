import { NextRequest, NextResponse } from "next/server";
import { runDeadlineWarnings } from "@/lib/deadline-warnings";

// Pensado para un cron externo (docker-compose / GitHub Actions / Vercel Cron)
// que llame este endpoint cada 15-30 min con el header Authorization correcto.
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result = await runDeadlineWarnings();
  return NextResponse.json({ success: true, ...result });
}
