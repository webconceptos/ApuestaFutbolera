import type { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import type { GlobalRole } from "@prisma/client";

// Misma convención que usa Auth.js internamente (ver @auth/core/lib/utils/cookie.js):
// el nombre de la cookie de sesión cambia con HTTPS, y por defecto el "salt"
// del JWT es ese mismo nombre de cookie.
export function getSessionCookieName(request: NextRequest) {
  const secure = request.nextUrl.protocol === "https:";
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

interface TokenUser {
  id: string;
  role: GlobalRole;
  name: string;
  email: string;
}

export async function buildSessionToken(
  request: NextRequest,
  user: TokenUser,
  options: { impersonatedBy?: string; maxAge?: number } = {}
) {
  const cookieName = getSessionCookieName(request);

  const token = await encode({
    token: {
      id: user.id,
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      ...(options.impersonatedBy ? { impersonatedBy: options.impersonatedBy } : {}),
    },
    secret: process.env.NEXTAUTH_SECRET as string,
    salt: cookieName,
    maxAge: options.maxAge,
  });

  return { cookieName, token, secure: cookieName.startsWith("__Secure-") };
}
