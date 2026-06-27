"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientDate } from "@/components/ui/client-date";
import { inputClass } from "@/components/ui/form-styles";

interface MemberRowProps {
  poolId: string;
  memberId: string;
  name: string;
  email: string;
  role: string;
  hasPaid: boolean;
  paymentNote: string | null;
  totalPoints: number;
  joinedAt: string;
  isActive: boolean;
  isOwnerView: boolean;
  isSelf: boolean;
  entryFeeEnabled: boolean;
}

export function MemberRow({
  poolId,
  memberId,
  name,
  email,
  role,
  hasPaid,
  paymentNote,
  totalPoints,
  joinedAt,
  isActive,
  isOwnerView,
  isSelf,
  entryFeeEnabled,
}: MemberRowProps) {
  const router = useRouter();
  const [note, setNote] = useState(paymentNote ?? "");
  const [loading, setLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");

  async function togglePaid() {
    setLoading(true);
    try {
      await fetch(`/api/pools/${poolId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasPaid: !hasPaid, paymentNote: note }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(newRole: string) {
    setLoading(true);
    try {
      await fetch(`/api/pools/${poolId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleExpel() {
    if (!confirm(`¿Expulsar a ${name} de la polla?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/pools/${poolId}/members/${memberId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pools/${poolId}/members/${memberId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: messageTitle, message: messageBody }),
      });
      if (res.ok) {
        setShowMessage(false);
        setMessageTitle("");
        setMessageBody("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <tr className={`border-b border-border-glass last:border-0 ${!isActive ? "opacity-50" : ""}`}>
        <td className="px-4 py-3">
          <p className="text-text-primary">{name}</p>
          <p className="text-xs text-text-muted">{email}</p>
        </td>
        <td className="px-4 py-3">
          {isOwnerView && !isSelf && role !== "OWNER" ? (
            <select
              value={role}
              disabled={loading}
              onChange={(e) => changeRole(e.target.value)}
              className="rounded border border-border-glass bg-bg-glass px-2 py-1 text-xs text-text-primary"
            >
              <option value="PLAYER">PLAYER</option>
              <option value="MODERATOR">MODERATOR</option>
            </select>
          ) : (
            <span className="text-text-muted">{role}</span>
          )}
        </td>
        {entryFeeEnabled && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading || role === "OWNER"}
                onClick={togglePaid}
                className={hasPaid ? "text-success" : "text-warning"}
              >
                {hasPaid ? "✓ Pago" : "✗ Pago"}
              </button>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="nota"
                className="w-24 rounded border border-border-glass bg-bg-glass px-1.5 py-0.5 text-xs text-text-primary"
              />
            </div>
          </td>
        )}
        <td className="px-4 py-3 font-mono text-text-primary">{totalPoints}</td>
        <td className="px-4 py-3 text-text-muted">
          <ClientDate iso={joinedAt} options={{ dateStyle: "short" }} />
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button type="button" onClick={() => setShowMessage((v) => !v)} className="text-info hover:underline">
              Mensaje
            </button>
            {role !== "OWNER" && isActive && (
              <button type="button" disabled={loading} onClick={handleExpel} className="text-error hover:underline">
                Expulsar
              </button>
            )}
            {!isActive && <span className="text-text-muted">Expulsado</span>}
          </div>
        </td>
      </tr>
      {showMessage && (
        <tr className="border-b border-border-glass">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                placeholder="Título"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                className={`${inputClass} sm:w-48`}
              />
              <input
                type="text"
                placeholder="Mensaje"
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                disabled={loading || !messageTitle || !messageBody}
                onClick={sendMessage}
                className="shrink-0 rounded-lg bg-gold-start px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
