import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

class AccountSuspendedError extends CredentialsSignin {
  code = "account_suspended";
}

class EmailNotVerifiedError extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  // La arquitectura de producción (Paso 27) siempre pone nginx delante de la
  // app — nunca está expuesta directo a internet — así que es seguro confiar
  // en el header Host que llega (nginx ya lo fija con proxy_set_header).
  // Sin esto, Auth.js v5 rechaza cada request con "UntrustedHost" detrás de
  // cualquier reverse proxy.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Google verifica el email de forma confiable, así que permitimos
      // vincular automáticamente con una cuenta existente (Credentials) que
      // tenga el mismo email — esto es lo que hace funcionar tanto "Continuar
      // con Google" en /login para cuentas ya registradas, como "Vincular
      // cuenta de Google" en /profile/security.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw, request) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) return null;

        if (!user.isActive) throw new AccountSuspendedError();
        if (!user.isVerified) throw new EmailNotVerifiedError();

        // request es el Request crudo (disponible en el authorize de Auth.js
        // v5); de ahí sacamos IP/user-agent para el audit trail. No siempre
        // hay proxy delante (ej. dev local), así que ambos pueden faltar.
        const ipAddress = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const userAgent = request?.headers.get("user-agent") ?? undefined;
        await db.userActivityLog.create({
          data: { userId: user.id, action: "LOGIN", ipAddress, userAgent },
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Google ya verifica el email del usuario; si es su primer login y aún
      // no estaba marcado como verificado (p.ej. se registró antes por
      // Credentials sin confirmar), lo marcamos verificado automáticamente.
      if (account?.provider === "google" && user.email) {
        await db.user.updateMany({
          where: { email: user.email, isVerified: false },
          data: { isVerified: true },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        // `user` solo está presente en el sign-in real (no en cada chequeo de
        // sesión), así que este es el lugar correcto para registrar el login.
        await db.user.update({ where: { id: token.id }, data: { lastLoginAt: new Date() } });
      }

      if (!token.id) return token;

      // Releer el usuario en cada acceso a la sesión para que una suspensión
      // (isActive=false) se refleje de inmediato. Devolver `null` aquí es la
      // forma soportada por Auth.js de forzar el cierre de sesión: el proxy
      // (Paso 6) ve `req.auth` como null y redirige a /login.
      const dbUser = await db.user.findUnique({ where: { id: token.id } });
      if (!dbUser || !dbUser.isActive) return null;

      // Si la contraseña cambió después de que se emitió este JWT, lo
      // tratamos como inválido (misma mecánica de "return null" de arriba).
      if (dbUser.passwordChangedAt && token.iat && dbUser.passwordChangedAt.getTime() / 1000 > token.iat) {
        return null;
      }

      token.role = dbUser.role;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.impersonatedBy = token.impersonatedBy;
      return session;
    },
  },
  events: {
    // Con session.strategy="jwt" este evento llega como { token }, no
    // { session }. token puede venir vacío si la sesión ya era inválida.
    async signOut(message) {
      const userId = "token" in message ? message.token?.id : undefined;
      if (!userId) return;
      await db.userActivityLog.create({ data: { userId, action: "LOGOUT" } });
    },
  },
});
