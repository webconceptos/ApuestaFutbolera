import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

// Usado por el HEALTHCHECK del contenedor "app" en docker-compose.yml.
// No expone detalles internos más allá de "ok"/"error" por servicio.
//
// La DB es crítica: si falla, el status HTTP es 503 (Docker reinicia el
// container). Redis no lo es — rate limiting y cache de ranking ya fallan
// "open" sin Redis (ver src/lib/rate-limit.ts y src/lib/redis.ts), así que
// una caída de Redis se reporta pero no tumba el healthcheck.
export async function GET() {
  const db_ = await db
    .$queryRaw`SELECT 1`
    .then(() => "ok" as const)
    .catch(() => "error" as const);

  const redis_ = await redis
    .ping()
    .then(() => "ok" as const)
    .catch(() => "error" as const);

  const status = db_ === "ok" ? "ok" : "error";
  return NextResponse.json({ status, db: db_, redis: redis_ }, { status: status === "ok" ? 200 : 503 });
}
