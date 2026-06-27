"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";

const LINE_COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#A855F7", "#EC4899", "#14B8A6", "#F97316"];

export interface EvolutionPoint {
  label: string;
  [userId: string]: string | number;
}

interface MemberRef {
  userId: string;
  name: string;
}

export function PointsEvolutionChart({ data, members }: { data: EvolutionPoint[]; members: MemberRef[] }) {
  return (
    <GlassCard>
      <h2 className="font-display text-2xl tracking-wide text-text-primary">📈 Evolución de puntos</h2>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} hide={data.length > 8} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#111128", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              labelStyle={{ color: "#F8FAFC" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#94A3B8" }} />
            {members.map((m, i) => (
              <Line
                key={m.userId}
                type="monotone"
                dataKey={m.userId}
                name={m.name}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
