import { politicians, type Politico } from "@/data/mockPoliticians";

export interface PoliticianFilters {
  search?: string;
  cargo?: string;
  uf?: string;
  partido?: string;
  sortBy?: "score" | "presenca" | "execucao" | "nome";
  sortDir?: "asc" | "desc";
}

export async function getPoliticians(filters: PoliticianFilters = {}): Promise<Politico[]> {
  let result = [...politicians];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.partido.toLowerCase().includes(q) ||
        p.uf.toLowerCase().includes(q)
    );
  }
  if (filters.cargo) result = result.filter((p) => p.cargo === filters.cargo);
  if (filters.uf) result = result.filter((p) => p.uf === filters.uf);
  if (filters.partido) result = result.filter((p) => p.partido === filters.partido);

  const dir = filters.sortDir === "asc" ? 1 : -1;
  switch (filters.sortBy) {
    case "presenca":
      result.sort((a, b) => (a.metrics.presencaPercent - b.metrics.presencaPercent) * dir);
      break;
    case "execucao":
      result.sort((a, b) => (a.metrics.emendas.execPercent - b.metrics.emendas.execPercent) * dir);
      break;
    case "nome":
      result.sort((a, b) => a.nome.localeCompare(b.nome) * dir);
      break;
    default:
      result.sort((a, b) => (a.score - b.score) * dir);
  }

  return result;
}

export async function getPoliticianById(id: string): Promise<Politico | undefined> {
  return politicians.find((p) => p.id === id);
}

export function exportPoliticianCsv(p: Politico): string {
  const rows = [
    ["Campo", "Valor"],
    ["Nome", p.nome],
    ["Cargo", p.cargo],
    ["UF", p.uf],
    ["Partido", p.partido],
    ["Score", String(p.score)],
    ["Presença %", String(p.metrics.presencaPercent)],
    ["Votações", String(p.metrics.votacoesTotal)],
    ["Comissões", String(p.metrics.comissoesTotal)],
    ["Proposições Total", String(p.metrics.proposicoesTotal)],
    ["Proposições Aprovadas", String(p.metrics.proposicoesAprovadas)],
    ["Emendas Alocado", String(p.metrics.emendas.alocado)],
    ["Emendas Pago", String(p.metrics.emendas.pago)],
    ["Emendas Execução %", String(p.metrics.emendas.execPercent)],
    ["Última Atualização", p.lastUpdated],
  ];
  return rows.map((r) => r.join(",")).join("\n");
}

export function getUniqueUFs(): string[] {
  return [...new Set(politicians.map((p) => p.uf))].sort();
}

export function getUniquePartidos(): string[] {
  return [...new Set(politicians.map((p) => p.partido))].sort();
}
