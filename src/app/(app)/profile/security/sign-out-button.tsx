"use client";

import { signOut } from "next-auth/react";
import { dangerButtonClass } from "@/components/ui/form-styles";

export function SignOutButton() {
  return (
    <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className={dangerButtonClass}>
      Cerrar esta sesión
    </button>
  );
}
