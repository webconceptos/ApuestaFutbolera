"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { secondaryButtonClass } from "@/components/ui/form-styles";

export function VerifyToggle({ userId, isVerified }: { userId: string; isVerified: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      await fetch(`/api/superadmin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !isVerified }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" disabled={loading} onClick={handleToggle} className={secondaryButtonClass}>
      {isVerified ? "Marcar como no verificado" : "Marcar como verificado"}
    </button>
  );
}
