import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sources = [
  {
    label: "Câmara dos Deputados — Dados Abertos",
    url: "https://dadosabertos.camara.leg.br/swagger/api.html",
    description: "API pública com dados de deputados, proposições, votações, órgãos e legislaturas.",
  },
  {
    label: "Presença em Plenário (Câmara)",
    url: "https://sisei.camara.gov.br/",
    description: "Consulta de presenças e ausências em sessões plenárias da Câmara dos Deputados.",
  },
  {
    label: "Senado Federal — Dados Abertos",
    url: "https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html",
    description: "API com dados de senadores, matérias legislativas e comissões do Senado.",
  },
  {
    label: "Portal da Transparência — API de Dados",
    url: "https://portaldatransparencia.gov.br/api-de-dados",
    description: "Dados de emendas, convênios, despesas e receitas do governo federal.",
  },
  {
    label: "Emendas Parlamentares — Consulta",
    url: "https://portaldatransparencia.gov.br/emendas/consulta",
    description: "Consulta detalhada de emendas parlamentares com valores alocados, empenhados e pagos.",
  },
  {
    label: "SIGA Brasil",
    url: "https://www12.senado.leg.br/orcamento/sigabrasil",
    description: "Sistema de informações sobre orçamento público brasileiro mantido pelo Senado.",
  },
];

export function FontesPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Fontes de Dados</h1>
      <p className="text-sm text-muted-foreground">
        Todas as informações apresentadas neste aplicativo são originadas de fontes oficiais do
        governo brasileiro. Abaixo estão os links para cada fonte utilizada.
      </p>

      <div className="space-y-3">
        {sources.map((s) => (
          <Card key={s.url}>
            <CardContent className="p-4">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                {s.label}
              </a>
              <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground italic">
            As fontes oficiais são a autoridade sobre os dados. Este aplicativo apenas organiza e
            apresenta informações já disponíveis publicamente. Em caso de divergência, a fonte
            oficial prevalece.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
