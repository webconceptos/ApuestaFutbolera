import type { Metadata } from "next";
import { Suspense } from "react";
import { Bebas_Neue, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golazo Mundial",
  description: "Predice, compite y celebra cada partido con tu grupo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bebasNeue.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* Con cacheComponents (Paso 20) todo es dinámico-en-build por
            default salvo que use "use cache" explícitamente. Casi toda la
            app (dashboard, perfil, admin) es genuinamente dinámica por
            sesión, así que en vez de envolver cada página individual,
            seguimos el patrón oficial: un único Suspense vacío acá arriba
            difiere todo a request-time como antes. Las rutas que sí quieren
            cachear (panel público) lo hacen explícitamente con su propio
            "use cache" + cacheLife, sin verse afectadas por este límite. */}
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  );
}
