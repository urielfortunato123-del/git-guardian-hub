import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpDown, GitCompare, Clock } from "lucide-react";
import { getPoliticians, getUniqueUFs, getUniquePartidos, type PoliticianFilters } from "@/services/politiciansService";
import { PoliticianCard } from "@/components/placar/PoliticianCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PlacarHomePage() {
  const [search, setSearch] = useState("");
  const [cargo, setCargo] = useState("");
  const [uf, setUf] = useState("");
  const [partido, setPartido] = useState("");
  const [sortBy, setSortBy] = useState<PoliticianFilters["sortBy"]>("score");
  const [sortDir, setSortDir] = useState<PoliticianFilters["sortDir"]>("desc");
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const cargoFilter = cargo && cargo !== "all" ? cargo : undefined;
  const ufFilter = uf && uf !== "all" ? uf : undefined;
  const partidoFilter = partido && partido !== "all" ? partido : undefined;

  const { data: politicians = [], isLoading } = useQuery({
    queryKey: ["politicians", search, cargoFilter, ufFilter, partidoFilter, sortBy, sortDir],
    queryFn: () => getPoliticians({ search, cargo: cargoFilter, uf: ufFilter, partido: partidoFilter, sortBy, sortDir }),
  });

  const ufs = getUniqueUFs();
  const partidos = getUniquePartidos();

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(0, 2));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Placar Público</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dados públicos sobre parlamentares brasileiros — atualizado em {new Date().toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, partido ou UF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={cargo} onValueChange={setCargo}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Cargo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Deputado">Deputado</SelectItem>
            <SelectItem value="Senador">Senador</SelectItem>
          </SelectContent>
        </Select>
        <Select value={uf} onValueChange={setUf}>
          <SelectTrigger className="w-full sm:w-28"><SelectValue placeholder="UF" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {ufs.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={partido} onValueChange={setPartido}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Partido" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {partidos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Sort + Compare */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as PoliticianFilters["sortBy"])}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="presenca">Presença</SelectItem>
              <SelectItem value="execucao">Execução</SelectItem>
              <SelectItem value="nome">Nome</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")} className="text-xs h-8">
            {sortDir === "desc" ? "↓ Desc" : "↑ Asc"}
          </Button>
        </div>

        {compareIds.length === 2 && (
          <Link to={`/comparar?a=${compareIds[0]}&b=${compareIds[1]}`}>
            <Button size="sm" className="gap-1.5">
              <GitCompare className="w-4 h-4" /> Comparar ({compareIds.length})
            </Button>
          </Link>
        )}
        {compareIds.length === 1 && (
          <span className="text-xs text-muted-foreground">Selecione mais 1 para comparar</span>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : politicians.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">Nenhum político encontrado</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {politicians.map((p) => (
            <PoliticianCard
              key={p.id}
              politico={p}
              selected={compareIds.includes(p.id)}
              onToggleCompare={toggleCompare}
              compareDisabled={compareIds.length >= 2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
