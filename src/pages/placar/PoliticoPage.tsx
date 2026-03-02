import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink, User, MapPin, Building2, Calendar, Clock } from "lucide-react";
import { getPoliticianById, exportPoliticianCsv } from "@/services/politiciansService";
import { ScoreBadge } from "@/components/placar/ScoreBadge";
import { BreakdownBars } from "@/components/placar/BreakdownBars";
import { TimelineChart } from "@/components/placar/TimelineChart";
import { AlertBanner } from "@/components/placar/AlertBanner";
import { SuggestionModal } from "@/components/placar/SuggestionModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PoliticoPage() {
  const { id } = useParams<{ id: string }>();
  const { data: p, isLoading } = useQuery({
    queryKey: ["politician", id],
    queryFn: () => getPoliticianById(id!),
    enabled: !!id,
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (!p) return <div className="text-center py-12 text-muted-foreground">Político não encontrado</div>;

  const handleExport = () => {
    const csv = exportPoliticianCsv(p);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.nome.replace(/\s+/g, "_")}_dados.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusColor: Record<string, string> = {
    apresentada: "bg-info/20 text-info",
    tramitacao: "bg-warning/20 text-warning",
    aprovada: "bg-accent/20 text-accent",
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex gap-2">
          <SuggestionModal />
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* A) Header */}
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{p.nome}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{p.cargo}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{p.uf}</span>
            <Badge variant="secondary">{p.partido}</Badge>
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{p.mandatoInicio.slice(0, 4)}–{p.mandatoFim.slice(0, 4)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3" /> Atualizado em {new Date(p.lastUpdated).toLocaleDateString("pt-BR")}
          </div>
        </div>
        <ScoreBadge score={p.score} size="lg" />
      </div>

      {/* H) Alertas */}
      {p.alertas.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Alertas de Risco</CardTitle></CardHeader>
          <CardContent><AlertBanner alertas={p.alertas} /></CardContent>
        </Card>
      )}

      {/* B) Breakdown */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Por que esse score?</CardTitle></CardHeader>
        <CardContent>
          <BreakdownBars breakdown={p.breakdown} />
          <p className="text-xs text-muted-foreground mt-3">
            Score = soma ponderada de trabalho, efetividade e emendas, menos penalidades de risco.
            <Link to="/metodologia" className="text-primary ml-1 hover:underline">Ver metodologia</Link>
          </p>
        </CardContent>
      </Card>

      {/* C) Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Presença", value: `${p.metrics.presencaPercent}%` },
          { label: "Votações", value: String(p.metrics.votacoesTotal) },
          { label: "Comissões", value: String(p.metrics.comissoesTotal) },
          { label: "Proposições", value: `${p.metrics.proposicoesAprovadas}/${p.metrics.proposicoesTotal}` },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* D) Proposições */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Proposições</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {p.proposicoes.map((prop) => (
              <div key={prop.id} className="flex items-start justify-between gap-2 p-2 rounded bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{prop.titulo}</p>
                  <p className="text-[10px] text-muted-foreground">{prop.data}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColor[prop.status]}`}>
                    {prop.status === "tramitacao" ? "em tramitação" : prop.status}
                  </span>
                  <a href={prop.source_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* E) Emendas */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Emendas Parlamentares</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Alocado", value: fmt(p.metrics.emendas.alocado) },
              { label: "Empenhado", value: fmt(p.metrics.emendas.empenhado) },
              { label: "Liquidado", value: fmt(p.metrics.emendas.liquidado) },
              { label: "Pago", value: fmt(p.metrics.emendas.pago) },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-sm font-semibold">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2">Município</th>
                  <th className="text-left py-2">Beneficiário</th>
                  <th className="text-right py-2">Alocado</th>
                  <th className="text-right py-2">Pago</th>
                  <th className="text-right py-2">Fonte</th>
                </tr>
              </thead>
              <tbody>
                {p.emendasDetalhe.map((e) => (
                  <tr key={e.id} className="border-b border-border/50">
                    <td className="py-2">{e.destinoMunicipio}</td>
                    <td className="py-2 truncate max-w-[150px]">{e.beneficiario}</td>
                    <td className="py-2 text-right font-mono">{fmt(e.valorAlocado)}</td>
                    <td className="py-2 text-right font-mono">{fmt(e.valorPago)}</td>
                    <td className="py-2 text-right">
                      <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* F) Timeline */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Atividade Mensal</CardTitle></CardHeader>
        <CardContent><TimelineChart data={p.timeline} /></CardContent>
      </Card>

      {/* G) Fontes */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Fontes Oficiais</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {p.fontes.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> {f.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
