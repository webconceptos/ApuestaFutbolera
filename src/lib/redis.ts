import Redis from "ioredis";
import { logger } from "@/lib/logger";

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export function poolRankingCacheKey(poolId: string) {
  return `pool:${poolId}:ranking`;
}

// La key se reserva para un futuro cache de lectura del ranking; hoy en día
// /ranking y el panel público leen PoolMember directo (campos ya cacheados
// por el batch de scoring, ver Paso 19/22). El batch sí invalida esta key
// por si algo llega a usarla. Si Redis no está disponible, no debe tumbar el
// scoring: se loguea y se sigue (mismo criterio que el rate limiting).
export async function invalidatePoolRankingCache(poolId: string) {
  try {
    await redis.del(poolRankingCacheKey(poolId));
  } catch (error) {
    logger.error({ err: error, poolId }, "no se pudo invalidar el cache de ranking de la polla");
  }
}
