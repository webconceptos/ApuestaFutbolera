import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Contador de ventana fija en Redis (INCR + EXPIRE). Si Redis no responde,
 * la petición se permite ("fail open"): preferible degradar el rate limiting
 * a tumbar el login de todo el mundo por una caída de Redis. Mismo criterio
 * que invalidatePoolRankingCache (src/lib/redis.ts, Paso 19).
 */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (error) {
    logger.error({ err: error, key }, "rate limit check falló, se permite la petición (fail open)");
    return { allowed: true, remaining: limit };
  }
}

/** IP del cliente real detrás de nginx (X-Forwarded-For); "unknown" si no hay proxy delante (ej. dev local). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

/**
 * Lee un campo de un body application/x-www-form-urlencoded SIN consumir el
 * stream original — clona la request primero. Necesario en proxy.ts: el
 * body todavía lo tiene que leer el route handler real de Auth.js más
 * adelante en la cadena, así que no se puede hacer `request.formData()`
 * directo (eso vaciaría el stream una sola vez disponible).
 */
export async function readFormField(request: Request, field: string): Promise<string | null> {
  try {
    const formData = await request.clone().formData();
    const value = formData.get(field);
    return typeof value === "string" ? value.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}
