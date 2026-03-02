import { AlertTriangle, Info, ShieldAlert, ExternalLink } from "lucide-react";
import type { Alerta } from "@/data/mockPoliticians";

const config = {
  info: { icon: Info, border: "border-info/40", bg: "bg-info/5", text: "text-info" },
  warning: { icon: AlertTriangle, border: "border-warning/40", bg: "bg-warning/5", text: "text-warning" },
  danger: { icon: ShieldAlert, border: "border-destructive/40", bg: "bg-destructive/5", text: "text-destructive" },
};

export function AlertBanner({ alertas }: { alertas: Alerta[] }) {
  if (!alertas.length) return null;
  return (
    <div className="space-y-2">
      {alertas.map((a, i) => {
        const c = config[a.level];
        const Icon = c.icon;
        return (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${c.border} ${c.bg}`}>
            <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${c.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${c.text}`}>{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>
              {a.source_url && (
                <a
                  href={a.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-primary mt-1 hover:underline"
                >
                  Ver na fonte <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
