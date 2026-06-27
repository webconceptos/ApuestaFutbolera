import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit, getClientIp, readFormField } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// En Next.js 16 el archivo "middleware.ts" fue renombrado a "proxy.ts" (y la
// función exportada debe llamarse "proxy"). El runtime de proxy es siempre
// nodejs, por lo que el chequeo en vivo de "suspended" en el callback `jwt`
// de NextAuth (src/lib/auth.ts) sí puede consultar la base de datos aquí, y
// también es lo que permite usar ioredis (cliente TCP, no funcionaría en
// edge) para el rate limiting de abajo (Paso 29).

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/forgot-password", "/verify-email", "/setup"]);
// /join/[code] es público a propósito: la página ya maneja el caso "sin
// sesión" mostrando "Te invitaron a..." con un botón que manda a /register
// si hace falta — quien recibe un link de invitación todavía no tiene
// cuenta, así que forzar /login antes de verlo es un callejón sin salida.
const PUBLIC_PREFIXES = ["/p/", "/join/", "/api/auth", "/api/setup"];

const PROTECTED_PREFIXES = ["/dashboard", "/tournaments", "/profile", "/notifications", "/superadmin"];

// Rutas que no deben competir por el cupo genérico de la API: auth ya tiene
// sus propios límites más estrictos abajo, y health/cron los golpea
// infraestructura propia (Docker healthcheck, cron externo), no un usuario.
const RATE_LIMIT_EXEMPT_PREFIXES = ["/api/auth/", "/api/health", "/api/cron/"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Los headers de seguridad (X-Frame-Options, CSP, etc.) los pone
// next.config.ts `headers()` para todas las respuestas — no se repiten acá.
function tooManyRequests(message: string) {
  return NextResponse.json({ error: message }, { status: 429 });
}

async function handle(req: NextRequest & { auth?: { user?: { id: string; role: string } } | null }) {
  const { nextUrl } = req;
  const { pathname } = nextUrl;

  // Rate limiting (CLAUDE.md, sección Seguridad): corre ANTES que cualquier
  // chequeo de auth, incluso en rutas públicas como login/registro.
  //
  // El límite de login NO puede ser solo por IP: detrás de NAT (Docker
  // Desktop reenviando puertos del host, redes corporativas, CGNAT de
  // operadores móviles) muchos usuarios reales y distintos comparten la
  // misma IP aparente ante el backend, así que un límite estricto por-IP
  // termina bloqueando a TODOS combinados, no solo al atacante. Por eso se
  // combinan dos cupos: uno estricto por (ip, email) — protege una cuenta
  // puntual de fuerza bruta — y uno más laxo solo por IP — protege contra
  // abuso masivo (probar muchas cuentas distintas) sin gatillar con el
  // tráfico normal de un grupo de gente detrás del mismo NAT.
  if (req.method === "POST" && pathname === "/api/auth/callback/credentials") {
    const ip = getClientIp(req);
    const email = await readFormField(req, "email");

    const perIp = await checkRateLimit(`ratelimit:login:ip:${ip}`, 30, 15 * 60);
    if (!perIp.allowed) return tooManyRequests("Demasiados intentos de inicio de sesión. Intenta en 15 minutos.");

    if (email) {
      const perAccount = await checkRateLimit(`ratelimit:login:account:${ip}:${email}`, 5, 15 * 60);
      if (!perAccount.allowed) {
        return tooManyRequests("Demasiados intentos para esta cuenta. Intenta en 15 minutos.");
      }
    }
  }
  if (req.method === "POST" && pathname === "/api/auth/register") {
    // Mismo razonamiento: la IP puede representar a varias personas reales
    // registrándose a la vez detrás del mismo NAT, así que el cupo es más
    // generoso que el originalmente pensado para "una sola persona, una IP".
    const { allowed } = await checkRateLimit(`ratelimit:register:${getClientIp(req)}`, 20, 60 * 60);
    if (!allowed) return tooManyRequests("Demasiados registros desde esta IP. Intenta más tarde.");
  }
  if (pathname.startsWith("/api/") && !RATE_LIMIT_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) {
    const identity = req.auth?.user?.id ?? getClientIp(req);
    const { allowed } = await checkRateLimit(`ratelimit:api:${identity}`, 100, 60);
    if (!allowed) return tooManyRequests("Demasiadas peticiones. Espera un momento.");
  }

  if (isPublicPath(pathname) || !isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = req.auth;

  // Si la cuenta fue suspendida, el callback `jwt` (src/lib/auth.ts) ya
  // devolvió `null` y aquí session/user llegan vacíos: se trata igual que
  // "no autenticado". El mensaje específico de suspensión lo da authorize()
  // en el siguiente intento de login.
  if (!session?.user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/superadmin") && session.user.role !== "SUPERADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
}

export const proxy = auth(async (req) => {
  const start = Date.now();
  const response = await handle(req);
  // Una línea estructurada por request (Paso 29: "logs estructurados"). Se
  // omiten los assets estáticos vía el matcher de abajo, así que esto cubre
  // páginas + API sin inundar el log con JS/CSS/imágenes.
  logger.info(
    {
      method: req.method,
      path: req.nextUrl.pathname,
      status: response.status,
      durationMs: Date.now() - start,
      userId: req.auth?.user?.id,
    },
    "http_request"
  );
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
