import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Color de acento de la polla (PoolConfig.accentColor); pinta el borde superior. */
  accentColor?: string;
}

export function GlassCard({ accentColor, className, style, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn("glass-surface rounded-2xl p-6 shadow-lg", accentColor && "border-t-4", className)}
      style={accentColor ? { borderTopColor: accentColor, ...style } : style}
      {...props}
    >
      {children}
    </div>
  );
}
