import type { Breakdown } from "@/data/mockPoliticians";

const labels: Record<keyof Breakdown, { label: string; max: number; color: string }> = {
  trabalho: { label: "Trabalho", max: 35, color: "hsl(var(--primary))" },
  efetividade: { label: "Efetividade", max: 20, color: "hsl(var(--accent))" },
  emendas: { label: "Emendas", max: 30, color: "hsl(var(--warning))" },
  risco: { label: "Risco (penalidade)", max: 15, color: "hsl(var(--destructive))" },
};

interface Props {
  breakdown: Breakdown;
}

export function BreakdownBars({ breakdown }: Props) {
  return (
    <div className="space-y-3">
      {(Object.keys(labels) as (keyof Breakdown)[]).map((key) => {
        const { label, max, color } = labels[key];
        const value = breakdown[key];
        const pct = Math.min(100, (value / max) * 100);
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono font-medium" style={{ color }}>{value}/{max}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
