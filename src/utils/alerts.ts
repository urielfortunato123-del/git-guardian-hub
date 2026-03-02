import type { Politico, Alerta } from "@/data/mockPoliticians";

export function computeAlerts(p: Politico): Alerta[] {
  const alerts: Alerta[] = [];

  // Low presence
  if (p.metrics.presencaPercent < 70) {
    alerts.push({
      level: p.metrics.presencaPercent < 55 ? "danger" : "warning",
      title: "Presença abaixo do esperado",
      detail: `Presença em plenário de ${p.metrics.presencaPercent}%, abaixo do limiar de atenção de 70%.`,
    });
  }

  // Low execution
  if (p.metrics.emendas.execPercent < 30 && p.metrics.emendas.alocado > 5000000) {
    alerts.push({
      level: "warning",
      title: "Baixa execução de emendas",
      detail: `Taxa de execução (pago/alocado) de ${p.metrics.emendas.execPercent}%, abaixo da mediana.`,
      source_url: "https://portaldatransparencia.gov.br/emendas/consulta",
    });
  }

  // Beneficiary concentration
  if (p.emendasDetalhe.length > 0) {
    const benefMap = new Map<string, number>();
    let total = 0;
    for (const e of p.emendasDetalhe) {
      benefMap.set(e.beneficiario, (benefMap.get(e.beneficiario) || 0) + e.valorAlocado);
      total += e.valorAlocado;
    }
    const maxBenef = Math.max(...benefMap.values());
    const concentration = total > 0 ? maxBenef / total : 0;
    if (concentration > 0.6) {
      const topName = [...benefMap.entries()].sort((a, b) => b[1] - a[1])[0][0];
      alerts.push({
        level: concentration > 0.8 ? "danger" : "warning",
        title: "Concentração em beneficiário",
        detail: `${Math.round(concentration * 100)}% do valor alocado concentrado em "${topName}".`,
      });
    }
  }

  // Spike detection
  if (p.timeline.length >= 3) {
    for (let i = 2; i < p.timeline.length; i++) {
      const prev = p.timeline[i - 1].emendasPago;
      const curr = p.timeline[i].emendasPago;
      if (prev > 0 && curr / prev > 3) {
        alerts.push({
          level: "info",
          title: "Variação em emendas pagas",
          detail: `Aumento significativo no valor pago entre ${p.timeline[i - 1].month} e ${p.timeline[i].month}.`,
        });
        break;
      }
    }
  }

  return alerts;
}
