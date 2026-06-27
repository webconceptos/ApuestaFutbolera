import type { NextConfig } from "next";

// nginx (Paso 27) ya pone estos headers en producción, pero se repiten acá
// como defensa en profundidad: cubre `npm run dev`, `next start` sin nginx
// delante, y cualquier despliegue futuro sin proxy reverso. Mismos valores
// que nginx/nginx.conf para que no haya diferencia de comportamiento.
const isDev = process.env.NODE_ENV !== "production";

const CSP = isDev
  ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws:;"
  : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';";

const nextConfig: NextConfig = {
  // Necesario para que "use cache" + cacheLife funcionen (Paso 20: ISR real
  // de 60s en el panel público con datos de Prisma, no de fetch()).
  cacheComponents: true,
  // Build standalone (solo lo que el server necesita en runtime) para que el
  // Dockerfile multi-stage no tenga que copiar node_modules completo (Paso 27).
  output: "standalone",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
