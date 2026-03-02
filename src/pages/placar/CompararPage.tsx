import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, User } from "lucide-react";
import { getPoliticianById } from "@/services/politiciansService";
import { ScoreBadge } from "@/components/placar/ScoreBadge";
import { BreakdownBars } from "@/components/placar/BreakdownBars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompararPage() {
  const [params] = useSearchParams();
  const idA = params.get("a");
  const idB = params.get("b");

  const { data: a } = useQuery({ queryKey: ["politician", idA], queryFn: () => getPoliticianById(idA!), enabled: !!idA });
  const { data: b } = useQuery({ queryKey: ["politician", idB], queryFn: () => getPoliticianById(idB!), enabled: !!idB });

  if (!idA || !idB) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Selecione 2 políticos na página inicial para comparar.</p>
      <Link to="/" className="text-primary text-sm mt-2 inline-block hover:underline">← Voltar</Link>
    </div>
  );

  if (!a || !b) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  const metrics = [
    { label: "Score", a: String(a.score), b: String(b.score) },
    { label: "Presença", a: `${a.metrics.presencaPercent}%`, b: `${b.metrics.presencaPercent}%` },
    { label: "Votações", a: String(a.metrics.votacoesTotal), b: String(b.metrics.votacoesTotal) },
    { label: "Comissões", a: String(a.metrics.comissoesTotal), b: String(b.metrics.comissoesTotal) },
    { label: "Proposições Aprovadas", a: String(a.metrics.proposicoesAprovadas), b: String(b.metrics.proposicoesAprovadas) },
    { label: "Emendas Execução", a: `${a.metrics.emendas.execPercent}%`, b: `${b.metrics.emendas.execPercent}%` },
  ];

  return (
    <div className="space-y-6">
      <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-2xl font-bold">Comparar Políticos</h1>

      {/* Header row */}
      <div className="grid grid-cols-2 gap-4">
        {[a, b].map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <Link to={`/politico/${p.id}`} className="font-semibold hover:text-primary">{p.nome}</Link>
              <p className="text-xs text-muted-foreground">{p.cargo} · {p.uf} · {p.partido}</p>
              <div className="mt-2"><ScoreBadge score={p.score} size="md" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics comparison */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Métricas</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="text-left py-2">Métrica</th>
                <th className="text-center py-2">{a.nome.split(" ")[0]}</th>
                <th className="text-center py-2">{b.nome.split(" ")[0]}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.label} className="border-b border-border/50">
                  <td className="py-2 text-muted-foreground text-xs">{m.label}</td>
                  <td className="py-2 text-center font-mono font-medium">{m.a}</td>
                  <td className="py-2 text-center font-mono font-medium">{m.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Breakdown side by side */}
      <div className="grid grid-cols-2 gap-4">
        {[a, b].map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2"><CardTitle className="text-xs">{p.nome.split(" ")[0]}</CardTitle></CardHeader>
            <CardContent><BreakdownBars breakdown={p.breakdown} /></CardContent>
          </Card>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center italic">
        Comparação baseada em dados disponíveis; não mede intenção.
        <Link to="/fontes" className="text-primary ml-1 hover:underline">Ver fontes</Link>
      </p>
    </div>
  );
}
