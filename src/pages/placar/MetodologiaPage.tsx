import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEFAULT_WEIGHTS, loadWeights, saveWeights, type Weights } from "@/utils/scoring";
import { RotateCcw } from "lucide-react";

export function MetodologiaPage() {
  const [weights, setWeights] = useState<Weights>(loadWeights);

  useEffect(() => { saveWeights(weights); }, [weights]);

  const updateWeight = (key: keyof Weights, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  const reset = () => setWeights(DEFAULT_WEIGHTS);

  const sliders: { key: keyof Weights; label: string; description: string }[] = [
    { key: "trabalho", label: "Trabalho (0–35)", description: "Presença em plenário, votações e participação em comissões." },
    { key: "efetividade", label: "Efetividade (0–20)", description: "Progresso das proposições (aprovadas ou em tramitação avançada)." },
    { key: "emendas", label: "Emendas (0–30)", description: "Taxa de execução (pago/alocado) e qualidade da distribuição." },
    { key: "risco", label: "Risco/Penalidade (0–15)", description: "Concentração em beneficiários, baixa rastreabilidade, picos incomuns." },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Metodologia</h1>
      <p className="text-sm text-muted-foreground">
        O score de 0 a 100 é uma soma ponderada de quatro dimensões. Cada dimensão usa dados
        públicos oficiais e é calculada de forma determinística.
      </p>

      {/* Formula */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Fórmula do Score</CardTitle></CardHeader>
        <CardContent>
          <code className="text-xs block bg-muted p-3 rounded font-mono leading-relaxed">
            Score = (Trabalho × peso_trabalho) + (Efetividade × peso_efetividade) + (Emendas × peso_emendas) − (Risco × peso_risco)
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            O resultado é limitado entre 0 e 100. A dimensão "Risco" é uma penalidade que subtrai pontos.
          </p>
        </CardContent>
      </Card>

      {/* Interactive weights */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ajustar Pesos (local)</CardTitle>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-xs">
              <RotateCcw className="w-3 h-3" /> Resetar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {sliders.map((s) => (
            <div key={s.key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{s.label}</span>
                <span className="text-sm font-mono text-primary">{(weights[s.key] * 100).toFixed(0)}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[weights[s.key] * 100]}
                onValueChange={([v]) => updateWeight(s.key, v / 100)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{s.description}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic">
            Os ajustes são salvos no seu navegador e afetam apenas a sua visualização.
          </p>
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Como Alertas são Computados</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Os alertas usam heurísticas simples sobre os dados, sem acusar irregularidade:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Concentração geográfica/beneficiário:</strong> se um beneficiário recebe mais de 60% do total alocado.</li>
            <li><strong>Baixa execução:</strong> se a taxa pago/alocado está abaixo de 30% com valor alocado alto.</li>
            <li><strong>Presença baixa:</strong> se a presença em plenário está abaixo de 70%.</li>
            <li><strong>Picos incomuns:</strong> se o valor pago de emendas triplicou de um mês para outro.</li>
          </ul>
          <p className="text-xs italic">
            Alertas indicam sinais de atenção e não implicam irregularidade.
          </p>
        </CardContent>
      </Card>

      {/* Correção */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Como Sugerir Correção</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Na página de cada político, clique em "Sugestão de Correção".</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Informe o link da fonte oficial que comprova a correção.</li>
            <li>Escreva uma breve descrição (máx. 280 caracteres).</li>
            <li>A sugestão é salva localmente no seu navegador.</li>
          </ol>
          <p className="text-xs italic">Não aceitamos textos livres sem fonte oficial vinculada.</p>
        </CardContent>
      </Card>
    </div>
  );
}
