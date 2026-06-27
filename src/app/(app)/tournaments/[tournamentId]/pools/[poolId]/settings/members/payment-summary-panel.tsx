"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/form-styles";

export function PaymentSummaryPanel({
  poolId,
  paidCount,
  pendingCount,
  currency,
  amount,
}: {
  poolId: string;
  paidCount: number;
  pendingCount: number;
  currency: string;
  amount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const total = paidCount * amount;

  async function handleBulkConfirm() {
    if (!confirm(`¿Confirmar el pago de los ${pendingCount} miembros pendientes?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/pools/${poolId}/members/bulk-confirm-payment`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-muted">
        <span className="text-success">{paidCount} pagaron</span> · <span className="text-warning">{pendingCount} pendientes</span> · Recaudado
        estimado: <span className="font-mono text-text-primary">{total} {currency}</span>
      </p>
      {pendingCount > 0 && (
        <button type="button" disabled={loading} onClick={handleBulkConfirm} className={buttonClass}>
          {loading ? "Confirmando..." : `Confirmar pago de los ${pendingCount} pendientes`}
        </button>
      )}
    </div>
  );
}
