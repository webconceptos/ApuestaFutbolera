"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StopImpersonationButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStop() {
    setLoading(true);
    try {
      await fetch("/api/superadmin/users/stop-impersonating", { method: "POST" });
      router.push("/superadmin/users");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleStop}
      className="rounded-lg bg-black/20 px-3 py-1 text-sm font-semibold text-white hover:bg-black/30 disabled:opacity-50"
    >
      {loading ? "Volviendo..." : "Volver a mi cuenta"}
    </button>
  );
}
