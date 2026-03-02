export interface Proposicao {
  id: string;
  titulo: string;
  status: "apresentada" | "tramitacao" | "aprovada";
  data: string;
  source_url: string;
}

export interface EmendaDetalhe {
  id: string;
  ano: number;
  destinoMunicipio: string;
  beneficiario: string;
  valorAlocado: number;
  valorPago: number;
  source_url: string;
}

export interface TimelineEntry {
  month: string;
  presencas: number;
  ausencias: number;
  votacoes: number;
  emendasPago: number;
}

export interface Fonte {
  label: string;
  url: string;
}

export interface Alerta {
  level: "info" | "warning" | "danger";
  title: string;
  detail: string;
  source_url?: string;
}

export interface Breakdown {
  trabalho: number;
  efetividade: number;
  emendas: number;
  risco: number;
}

export interface EmendasMetrics {
  alocado: number;
  empenhado: number;
  liquidado: number;
  pago: number;
  execPercent: number;
}

export interface Metrics {
  presencaPercent: number;
  votacoesTotal: number;
  comissoesTotal: number;
  proposicoesTotal: number;
  proposicoesAprovadas: number;
  emendas: EmendasMetrics;
}

export interface Politico {
  id: string;
  nome: string;
  cargo: "Deputado" | "Senador";
  uf: string;
  partido: string;
  fotoUrl: string;
  mandatoInicio: string;
  mandatoFim: string;
  score: number;
  breakdown: Breakdown;
  metrics: Metrics;
  timeline: TimelineEntry[];
  proposicoes: Proposicao[];
  emendasDetalhe: EmendaDetalhe[];
  fontes: Fonte[];
  alertas: Alerta[];
  lastUpdated: string;
}

function timeline(base: Partial<TimelineEntry>[]): TimelineEntry[] {
  const months = ["2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06"];
  return months.map((m, i) => ({
    month: m,
    presencas: base[i]?.presencas ?? Math.floor(Math.random() * 10 + 12),
    ausencias: base[i]?.ausencias ?? Math.floor(Math.random() * 4),
    votacoes: base[i]?.votacoes ?? Math.floor(Math.random() * 20 + 10),
    emendasPago: base[i]?.emendasPago ?? Math.floor(Math.random() * 500000 + 100000),
  }));
}

const defaultFontes: Fonte[] = [
  { label: "Câmara Dados Abertos", url: "https://dadosabertos.camara.leg.br/swagger/api.html" },
  { label: "Portal da Transparência", url: "https://portaldatransparencia.gov.br/api-de-dados" },
  { label: "Emendas — Consulta", url: "https://portaldatransparencia.gov.br/emendas/consulta" },
];

export const politicians: Politico[] = [
  {
    id: "dep-001",
    nome: "Maria Souza",
    cargo: "Deputado",
    uf: "SP",
    partido: "PSD",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2027-01-31",
    score: 78,
    breakdown: { trabalho: 30, efetividade: 16, emendas: 24, risco: 8 },
    metrics: {
      presencaPercent: 92,
      votacoesTotal: 187,
      comissoesTotal: 4,
      proposicoesTotal: 12,
      proposicoesAprovadas: 3,
      emendas: { alocado: 15000000, empenhado: 12000000, liquidado: 10500000, pago: 9800000, execPercent: 65 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p1", titulo: "PL 1234/2024 — Ampliação do Fundo de Saúde", status: "aprovada", data: "2024-03-15", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p2", titulo: "PL 5678/2024 — Incentivo à Energia Solar", status: "tramitacao", data: "2024-06-20", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p3", titulo: "PL 9012/2024 — Regulamentação de IA", status: "apresentada", data: "2024-09-10", source_url: "https://dadosabertos.camara.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e1", ano: 2024, destinoMunicipio: "São Paulo", beneficiario: "Prefeitura de São Paulo", valorAlocado: 5000000, valorPago: 3200000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e2", ano: 2024, destinoMunicipio: "Campinas", beneficiario: "Prefeitura de Campinas", valorAlocado: 3000000, valorPago: 2100000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e3", ano: 2024, destinoMunicipio: "Santos", beneficiario: "Hospital Municipal", valorAlocado: 4000000, valorPago: 2800000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: defaultFontes,
    alertas: [],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "sen-001",
    nome: "Carlos Oliveira",
    cargo: "Senador",
    uf: "MG",
    partido: "MDB",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2031-01-31",
    score: 52,
    breakdown: { trabalho: 18, efetividade: 10, emendas: 18, risco: 6 },
    metrics: {
      presencaPercent: 68,
      votacoesTotal: 95,
      comissoesTotal: 2,
      proposicoesTotal: 5,
      proposicoesAprovadas: 1,
      emendas: { alocado: 20000000, empenhado: 8000000, liquidado: 5000000, pago: 4200000, execPercent: 21 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p4", titulo: "PLS 345/2024 — Reforma Tributária Complementar", status: "tramitacao", data: "2024-05-10", source_url: "https://legis.senado.leg.br/" },
      { id: "p5", titulo: "PLS 678/2024 — Programa Jovem Rural", status: "apresentada", data: "2024-08-22", source_url: "https://legis.senado.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e4", ano: 2024, destinoMunicipio: "Uberlândia", beneficiario: "Prefeitura de Uberlândia", valorAlocado: 12000000, valorPago: 2500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e5", ano: 2024, destinoMunicipio: "Uberlândia", beneficiario: "Associação Rural de Uberlândia", valorAlocado: 5000000, valorPago: 1200000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: [...defaultFontes, { label: "Senado Dados Abertos", url: "https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html" }],
    alertas: [
      { level: "warning", title: "Baixa execução de emendas", detail: "A taxa de execução (pago/alocado) está em 21%, abaixo da mediana de 45%.", source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { level: "warning", title: "Concentração geográfica elevada", detail: "Mais de 70% das emendas destinadas a um único município (Uberlândia)." },
    ],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "dep-002",
    nome: "Ana Beatriz Lima",
    cargo: "Deputado",
    uf: "RJ",
    partido: "PT",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2027-01-31",
    score: 85,
    breakdown: { trabalho: 33, efetividade: 18, emendas: 27, risco: 7 },
    metrics: {
      presencaPercent: 96,
      votacoesTotal: 210,
      comissoesTotal: 5,
      proposicoesTotal: 18,
      proposicoesAprovadas: 6,
      emendas: { alocado: 12000000, empenhado: 11000000, liquidado: 10000000, pago: 9500000, execPercent: 79 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p6", titulo: "PL 111/2024 — Programa Primeira Infância", status: "aprovada", data: "2024-02-10", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p7", titulo: "PL 222/2024 — Transporte Público Gratuito para Idosos", status: "aprovada", data: "2024-04-15", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p8", titulo: "PL 333/2025 — Educação Digital nas Escolas", status: "tramitacao", data: "2025-01-20", source_url: "https://dadosabertos.camara.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e6", ano: 2024, destinoMunicipio: "Rio de Janeiro", beneficiario: "Secretaria de Saúde RJ", valorAlocado: 4000000, valorPago: 3500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e7", ano: 2024, destinoMunicipio: "Niterói", beneficiario: "Prefeitura de Niterói", valorAlocado: 3000000, valorPago: 2300000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e8", ano: 2024, destinoMunicipio: "Petrópolis", beneficiario: "Hospital Regional", valorAlocado: 2500000, valorPago: 1800000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: defaultFontes,
    alertas: [],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "sen-002",
    nome: "Roberto Farias",
    cargo: "Senador",
    uf: "BA",
    partido: "UNIÃO",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2031-01-31",
    score: 41,
    breakdown: { trabalho: 14, efetividade: 6, emendas: 15, risco: 6 },
    metrics: {
      presencaPercent: 58,
      votacoesTotal: 72,
      comissoesTotal: 1,
      proposicoesTotal: 3,
      proposicoesAprovadas: 0,
      emendas: { alocado: 25000000, empenhado: 10000000, liquidado: 6000000, pago: 5000000, execPercent: 20 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p9", titulo: "PLS 999/2024 — Fundo de Irrigação Nordeste", status: "apresentada", data: "2024-07-01", source_url: "https://legis.senado.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e9", ano: 2024, destinoMunicipio: "Salvador", beneficiario: "Instituto Baiano de Desenvolvimento", valorAlocado: 18000000, valorPago: 3500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e10", ano: 2024, destinoMunicipio: "Salvador", beneficiario: "Fundação Cultural Salvador", valorAlocado: 7000000, valorPago: 1500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: [...defaultFontes, { label: "Senado Dados Abertos", url: "https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html" }],
    alertas: [
      { level: "danger", title: "Concentração em beneficiário único", detail: "Mais de 72% do valor alocado destinado a um único município (Salvador), com execução de apenas 20%." },
      { level: "warning", title: "Presença abaixo de 70%", detail: "Presença em plenário de 58%, abaixo do limiar de atenção de 70%." },
    ],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "dep-003",
    nome: "Fernanda Torres",
    cargo: "Deputado",
    uf: "RS",
    partido: "PP",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2027-01-31",
    score: 67,
    breakdown: { trabalho: 24, efetividade: 12, emendas: 22, risco: 9 },
    metrics: {
      presencaPercent: 81,
      votacoesTotal: 145,
      comissoesTotal: 3,
      proposicoesTotal: 8,
      proposicoesAprovadas: 2,
      emendas: { alocado: 10000000, empenhado: 7000000, liquidado: 5500000, pago: 4800000, execPercent: 48 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p10", titulo: "PL 444/2024 — Programa Leite para Todos", status: "aprovada", data: "2024-03-01", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p11", titulo: "PL 555/2024 — Incentivo à Agroecologia", status: "tramitacao", data: "2024-06-15", source_url: "https://dadosabertos.camara.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e11", ano: 2024, destinoMunicipio: "Porto Alegre", beneficiario: "Secretaria Estadual de Saúde", valorAlocado: 5000000, valorPago: 2500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e12", ano: 2024, destinoMunicipio: "Caxias do Sul", beneficiario: "Prefeitura de Caxias do Sul", valorAlocado: 3000000, valorPago: 1500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: defaultFontes,
    alertas: [
      { level: "info", title: "Variação em emendas pagas", detail: "Houve aumento significativo no valor pago de emendas entre out/2024 e nov/2024." },
    ],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "dep-004",
    nome: "João Pedro Almeida",
    cargo: "Deputado",
    uf: "CE",
    partido: "PDT",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2027-01-31",
    score: 72,
    breakdown: { trabalho: 28, efetividade: 14, emendas: 22, risco: 8 },
    metrics: {
      presencaPercent: 88,
      votacoesTotal: 165,
      comissoesTotal: 3,
      proposicoesTotal: 10,
      proposicoesAprovadas: 3,
      emendas: { alocado: 8000000, empenhado: 6500000, liquidado: 5500000, pago: 4800000, execPercent: 60 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p12", titulo: "PL 777/2024 — Cisternas para o Semiárido", status: "aprovada", data: "2024-04-20", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p13", titulo: "PL 888/2024 — Microcrédito para MEIs", status: "tramitacao", data: "2024-08-10", source_url: "https://dadosabertos.camara.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e13", ano: 2024, destinoMunicipio: "Fortaleza", beneficiario: "Secretaria de Educação CE", valorAlocado: 4000000, valorPago: 2600000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e14", ano: 2024, destinoMunicipio: "Juazeiro do Norte", beneficiario: "Prefeitura de Juazeiro", valorAlocado: 2000000, valorPago: 1200000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: defaultFontes,
    alertas: [],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "sen-003",
    nome: "Luciana Martins",
    cargo: "Senador",
    uf: "PR",
    partido: "PL",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2031-01-31",
    score: 61,
    breakdown: { trabalho: 22, efetividade: 12, emendas: 20, risco: 7 },
    metrics: {
      presencaPercent: 75,
      votacoesTotal: 110,
      comissoesTotal: 3,
      proposicoesTotal: 7,
      proposicoesAprovadas: 2,
      emendas: { alocado: 18000000, empenhado: 12000000, liquidado: 9000000, pago: 7500000, execPercent: 42 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p14", titulo: "PLS 100/2024 — Marco da Inteligência Artificial", status: "tramitacao", data: "2024-03-05", source_url: "https://legis.senado.leg.br/" },
      { id: "p15", titulo: "PLS 200/2024 — Proteção de Dados Pessoais Atualização", status: "aprovada", data: "2024-06-30", source_url: "https://legis.senado.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e15", ano: 2024, destinoMunicipio: "Curitiba", beneficiario: "Prefeitura de Curitiba", valorAlocado: 8000000, valorPago: 3500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e16", ano: 2024, destinoMunicipio: "Londrina", beneficiario: "Hospital Universitário", valorAlocado: 5000000, valorPago: 2000000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: [...defaultFontes, { label: "Senado Dados Abertos", url: "https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html" }],
    alertas: [],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "dep-005",
    nome: "Ricardo Nunes",
    cargo: "Deputado",
    uf: "GO",
    partido: "REPUBLICANOS",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2027-01-31",
    score: 34,
    breakdown: { trabalho: 10, efetividade: 4, emendas: 14, risco: 6 },
    metrics: {
      presencaPercent: 52,
      votacoesTotal: 60,
      comissoesTotal: 1,
      proposicoesTotal: 2,
      proposicoesAprovadas: 0,
      emendas: { alocado: 14000000, empenhado: 5000000, liquidado: 3000000, pago: 2000000, execPercent: 14 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p16", titulo: "PL 1111/2024 — Zona Franca do Cerrado", status: "apresentada", data: "2024-09-01", source_url: "https://dadosabertos.camara.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e17", ano: 2024, destinoMunicipio: "Goiânia", beneficiario: "Fundação Goiana de Esportes", valorAlocado: 10000000, valorPago: 1500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e18", ano: 2024, destinoMunicipio: "Goiânia", beneficiario: "Fundação Goiana de Esportes", valorAlocado: 4000000, valorPago: 500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: defaultFontes,
    alertas: [
      { level: "danger", title: "Concentração em beneficiário único", detail: "100% das emendas destinadas à mesma entidade (Fundação Goiana de Esportes), com execução de apenas 14%." },
      { level: "warning", title: "Presença muito baixa", detail: "Presença em plenário de 52%, significativamente abaixo da mediana." },
      { level: "warning", title: "Baixa execução de emendas", detail: "Taxa de execução (pago/alocado) de 14%, a mais baixa do grupo analisado." },
    ],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "dep-006",
    nome: "Patrícia Duarte",
    cargo: "Deputado",
    uf: "PE",
    partido: "PSB",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2027-01-31",
    score: 90,
    breakdown: { trabalho: 34, efetividade: 19, emendas: 28, risco: 9 },
    metrics: {
      presencaPercent: 97,
      votacoesTotal: 225,
      comissoesTotal: 6,
      proposicoesTotal: 22,
      proposicoesAprovadas: 8,
      emendas: { alocado: 10000000, empenhado: 9500000, liquidado: 9000000, pago: 8700000, execPercent: 87 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p17", titulo: "PL 2222/2024 — Saúde Mental nas Escolas", status: "aprovada", data: "2024-02-28", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p18", titulo: "PL 3333/2024 — Conectividade Rural", status: "aprovada", data: "2024-05-10", source_url: "https://dadosabertos.camara.leg.br/" },
      { id: "p19", titulo: "PL 4444/2024 — Proteção de Manguezais", status: "tramitacao", data: "2024-08-20", source_url: "https://dadosabertos.camara.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e19", ano: 2024, destinoMunicipio: "Recife", beneficiario: "Secretaria de Saúde PE", valorAlocado: 3500000, valorPago: 3200000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e20", ano: 2024, destinoMunicipio: "Caruaru", beneficiario: "Prefeitura de Caruaru", valorAlocado: 3000000, valorPago: 2600000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e21", ano: 2024, destinoMunicipio: "Petrolina", beneficiario: "IFPE Petrolina", valorAlocado: 2000000, valorPago: 1700000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: defaultFontes,
    alertas: [],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
  {
    id: "sen-004",
    nome: "Eduardo Campos Neto",
    cargo: "Senador",
    uf: "AM",
    partido: "PSDB",
    fotoUrl: "",
    mandatoInicio: "2023-02-01",
    mandatoFim: "2031-01-31",
    score: 55,
    breakdown: { trabalho: 20, efetividade: 8, emendas: 20, risco: 7 },
    metrics: {
      presencaPercent: 73,
      votacoesTotal: 98,
      comissoesTotal: 2,
      proposicoesTotal: 4,
      proposicoesAprovadas: 1,
      emendas: { alocado: 22000000, empenhado: 14000000, liquidado: 10000000, pago: 8000000, execPercent: 36 },
    },
    timeline: timeline([]),
    proposicoes: [
      { id: "p20", titulo: "PLS 500/2024 — Proteção da Amazônia Legal", status: "tramitacao", data: "2024-04-01", source_url: "https://legis.senado.leg.br/" },
    ],
    emendasDetalhe: [
      { id: "e22", ano: 2024, destinoMunicipio: "Manaus", beneficiario: "Prefeitura de Manaus", valorAlocado: 15000000, valorPago: 5500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
      { id: "e23", ano: 2024, destinoMunicipio: "Parintins", beneficiario: "Prefeitura de Parintins", valorAlocado: 4000000, valorPago: 1500000, source_url: "https://portaldatransparencia.gov.br/emendas/consulta" },
    ],
    fontes: [...defaultFontes, { label: "Senado Dados Abertos", url: "https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html" }],
    alertas: [
      { level: "info", title: "Concentração geográfica moderada", detail: "Cerca de 68% das emendas concentradas em Manaus. Padrão pode ser esperado para o estado." },
    ],
    lastUpdated: "2025-06-01T10:00:00Z",
  },
];
