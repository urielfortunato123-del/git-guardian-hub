import { useState } from "react";
import { Search, Check, AlertTriangle, Cpu, Cloud, Monitor, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { AI_MODELS, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";
import { useModel } from "@/contexts/ModelContext";
import { getAllUserKeys } from "@/components/APIKeysSettings";
import { Badge } from "@/components/ui/badge";

type CategoryKey = AIModel["category"];

const categoryIcons: Record<CategoryKey, typeof Cloud> = {
  "cloud-premium": Cloud,
  "cloud-free": Zap,
  "local": Monitor,
};

function getModelReady(model: AIModel): { ok: boolean; reason: string } {
  if (model.isLocal) return { ok: true, reason: "Requer servidor local rodando" };
  if (model.providerBackend === "lovable") return { ok: true, reason: "Pronto — sem chave necessária" };
  if (model.providerBackend === "openrouter") {
    const keys = getAllUserKeys();
    return keys["openrouter"]
      ? { ok: true, reason: "OpenRouter key configurada" }
      : { ok: true, reason: "Via servidor (key backend)" };
  }
  if (model.providerBackend === "huggingface") {
    const keys = getAllUserKeys();
    return keys["huggingface"]
      ? { ok: true, reason: "Hugging Face key configurada" }
      : { ok: true, reason: "Via servidor (key backend)" };
  }
  return { ok: false, reason: "Provedor desconhecido" };
}

export function ModelsPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey | "all">("all");
  const { selectedModel, setSelectedModel } = useModel();

  const filtered = AI_MODELS.filter((m) => {
    if (activeCategory !== "all" && m.category !== activeCategory) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories: { key: CategoryKey | "all"; label: string }[] = [
    { key: "all", label: "Todos" },
    ...Object.entries(MODEL_CATEGORIES).map(([k, v]) => ({ key: k as CategoryKey, label: v.label })),
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary" />
          Modelos de IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {AI_MODELS.length} modelos disponíveis • Clique para selecionar
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar modelos..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
            <span className="ml-1 opacity-70">
              ({cat.key === "all" ? AI_MODELS.length : AI_MODELS.filter((m) => m.category === cat.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* Models grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((model, i) => {
          const status = getModelReady(model);
          const isActive = selectedModel.id === model.id;
          const CatIcon = categoryIcons[model.category] || Cloud;

          return (
            <motion.button
              key={model.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: i * 0.02 }}
              onClick={() => setSelectedModel(model)}
              className={`group relative text-left p-4 rounded-lg border transition-all ${
                isActive
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary/50"
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-3 right-3">
                  <Check className="w-4 h-4 text-primary" />
                </span>
              )}

              <div className="flex items-start gap-3">
                <span className="text-2xl">{model.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm text-foreground truncate">{model.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{model.provider}</p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <CatIcon className="w-3 h-3" />
                      {MODEL_CATEGORIES[model.category].label}
                    </Badge>
                    {model.supportsReasoning && (
                      <Badge variant="outline" className="text-[10px]">Reasoning</Badge>
                    )}
                    {model.isLocal && (
                      <Badge variant="outline" className="text-[10px]">Local</Badge>
                    )}
                  </div>

                  <div className={`flex items-center gap-1 mt-2 text-[10px] ${status.ok ? "text-muted-foreground" : "text-destructive"}`}>
                    {status.ok ? <Check className="w-3 h-3 text-primary" /> : <AlertTriangle className="w-3 h-3" />}
                    <span>{status.reason}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground mt-2 font-mono truncate opacity-60">{model.id}</p>
            </motion.button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum modelo encontrado</p>
        </div>
      )}
    </div>
  );
}
