"use client";

import { motion } from "framer-motion";

interface PodiumMember {
  userId: string;
  name: string;
  totalPoints: number;
  rankPosition: number | null;
}

const STEP_ORDER = [2, 1, 3]; // izquierda=2°, centro=1°, derecha=3° (orden visual clásico)
const STEP_HEIGHT: Record<number, string> = { 1: "h-32", 2: "h-24", 3: "h-16" };
const STEP_COLOR: Record<number, string> = {
  1: "from-gold-start to-gold-end",
  2: "from-slate-300 to-slate-400",
  3: "from-amber-700 to-amber-800",
};
const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function Podium({ top3 }: { top3: PodiumMember[] }) {
  const byPosition = new Map(top3.map((m) => [m.rankPosition, m]));

  return (
    <div className="flex items-end justify-center gap-4 px-4 pb-2 pt-8">
      {STEP_ORDER.map((position) => {
        const member = byPosition.get(position);
        if (!member) return <div key={position} className="w-28" />;

        return (
          <motion.div
            key={member.userId}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (3 - position) * 0.1 }}
            className="flex w-28 flex-col items-center gap-2"
          >
            <span className="text-3xl">{MEDAL[position]}</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-start/20 text-lg font-semibold text-gold-start">
              {member.name.charAt(0).toUpperCase()}
            </span>
            <p className="truncate text-center text-sm font-medium text-text-primary">{member.name}</p>
            <p className="font-mono text-sm text-text-muted">{member.totalPoints} pts</p>
            <div
              className={`w-full rounded-t-lg bg-linear-to-b ${STEP_COLOR[position]} ${STEP_HEIGHT[position]} flex items-start justify-center pt-1`}
            >
              <span className="font-display text-2xl text-bg-primary">{position}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
