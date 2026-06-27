import { GlassCard } from "@/components/ui/glass-card";
import { MarkdownContent } from "@/components/ui/markdown-content";

export function PublicRules({ rules }: { rules: string }) {
  return (
    <GlassCard>
      <h2 className="font-display text-2xl tracking-wide text-text-primary">📋 Reglas</h2>
      <div className="mt-3">
        <MarkdownContent content={rules} />
      </div>
    </GlassCard>
  );
}
