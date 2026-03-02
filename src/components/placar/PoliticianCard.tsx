import { Link } from "react-router-dom";
import { User, MapPin, Building2, CheckSquare } from "lucide-react";
import type { Politico } from "@/data/mockPoliticians";
import { ScoreBadge } from "./ScoreBadge";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  politico: Politico;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
  compareDisabled?: boolean;
}

export function PoliticianCard({ politico: p, selected, onToggleCompare, compareDisabled }: Props) {
  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors">
      {/* Compare checkbox */}
      {onToggleCompare && (
        <div className="absolute top-3 right-3">
          <Checkbox
            checked={selected}
            disabled={compareDisabled && !selected}
            onCheckedChange={() => onToggleCompare(p.id)}
            aria-label={`Comparar ${p.nome}`}
          />
        </div>
      )}

      <Link to={`/politico/${p.id}`} className="flex items-start gap-4">
        {/* Photo placeholder */}
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {p.nome}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{p.cargo}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.uf}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{p.partido}</Badge>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="outline" className="text-[10px]">Presença {p.metrics.presencaPercent}%</Badge>
            <Badge variant="outline" className="text-[10px]">Votações {p.metrics.votacoesTotal}</Badge>
            <Badge variant="outline" className="text-[10px]">Exec. {p.metrics.emendas.execPercent}%</Badge>
          </div>
        </div>

        <ScoreBadge score={p.score} size="sm" />
      </Link>
    </div>
  );
}
