"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";

interface RankingRow {
  userId: string;
  name: string;
  totalPoints: number;
  exactScores: number;
  rankPosition: number | null;
  previousRankPosition: number | null;
  isMe: boolean;
}

function trendIcon(current: number | null, previous: number | null) {
  if (current === null || previous === null) return "—";
  if (current < previous) return "↑";
  if (current > previous) return "↓";
  return "↔";
}

function trendColor(current: number | null, previous: number | null) {
  if (current === null || previous === null) return "text-text-muted";
  if (current < previous) return "text-success";
  if (current > previous) return "text-error";
  return "text-text-muted";
}

export function RankingTable({ rows, accentColor }: { rows: RankingRow[]; accentColor?: string }) {
  return (
    <GlassCard className="p-0" accentColor={accentColor}>
      <h2 className="px-4 pt-4 font-display text-2xl tracking-wide text-text-primary">📊 Ranking completo</h2>
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-glass text-text-muted">
            <th className="px-4 py-2 font-medium">#</th>
            <th className="px-4 py-2 font-medium">Jugador</th>
            <th className="px-4 py-2 font-medium">Pts</th>
            <th className="px-4 py-2 font-medium">Exactos</th>
            <th className="px-4 py-2 font-medium">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.tr
                key={r.userId}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`border-b border-border-glass last:border-0 ${r.isMe ? "bg-gold-start/10" : ""}`}
              >
                <td className="px-4 py-2 font-mono text-text-primary">{r.rankPosition ?? "—"}</td>
                <td className="px-4 py-2 text-text-primary">
                  {r.name}
                  {r.isMe && <span className="ml-2 text-xs text-gold-start">(tú)</span>}
                </td>
                <td className="px-4 py-2 font-mono text-text-primary">{r.totalPoints}</td>
                <td className="px-4 py-2 text-text-muted">{r.exactScores}</td>
                <td className={`px-4 py-2 ${trendColor(r.rankPosition, r.previousRankPosition)}`}>
                  {trendIcon(r.rankPosition, r.previousRankPosition)}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>

          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                Todavía no hay participantes con puntos.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </GlassCard>
  );
}
