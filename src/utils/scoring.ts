import type { Politico, Breakdown } from "@/data/mockPoliticians";

export interface Weights {
  trabalho: number;
  efetividade: number;
  emendas: number;
  risco: number;
}

export const DEFAULT_WEIGHTS: Weights = {
  trabalho: 0.35,
  efetividade: 0.20,
  emendas: 0.30,
  risco: 0.15,
};

export function computeScore(politico: Politico, weights: Weights = DEFAULT_WEIGHTS): number {
  const { breakdown } = politico;
  const raw =
    breakdown.trabalho * (weights.trabalho / 0.35) +
    breakdown.efetividade * (weights.efetividade / 0.20) +
    breakdown.emendas * (weights.emendas / 0.30) -
    breakdown.risco * (weights.risco / 0.15);
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function getScoreColor(score: number): string {
  if (score >= 75) return "hsl(var(--accent))";
  if (score >= 50) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return "Alto";
  if (score >= 50) return "Médio";
  return "Baixo";
}

export function loadWeights(): Weights {
  try {
    const raw = localStorage.getItem("placar_weights");
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_WEIGHTS;
}

export function saveWeights(w: Weights) {
  localStorage.setItem("placar_weights", JSON.stringify(w));
}
