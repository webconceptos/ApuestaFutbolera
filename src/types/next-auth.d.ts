import type { GlobalRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: GlobalRole;
    } & DefaultSession["user"];
    /** userId del SUPERADMIN que está impersonando, si aplica (ver Paso 13). */
    impersonatedBy?: string;
  }

  interface User {
    role: GlobalRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: GlobalRole;
    impersonatedBy?: string;
  }
}
