import { useState } from "react";
import { Search, Check, AlertTriangle, Cpu, Cloud, Monitor, Zap, ExternalLink, Copy, CheckCheck, Info } from "lucide-react";
import { motion } from "framer-motion";
import { AI_MODELS, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";
import { useModel } from "@/contexts/ModelContext";
import { getAllUserKeys } from "@/components/APIKeysSettings";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const LOCAL_STORAGE_KEY = "lovhub_local_endpoints";

interface LocalEndpoint {
  id: string;
  name: string;
  url: string;
}

function getLocalEndpoints(): LocalEndpoint[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveLocalEndpoints(list: LocalEndpoint[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
}

function LocalSetupGuide() {
  const [endpoints, setEndpoints] = useState<LocalEndpoint[]>(getLocalEndpoints);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("http://localhost:");
  const [copied, setCopied] = useState<string | null>(null);

  const normalizeUrl = (url: string): string => {
    let u = url.trim().replace(/\/+$/, "");
    if (!u.endsWith("/v1")) u += "/v1";
    return u;
  };

  const addEndpoint = () => {
    if (!newName.trim() || !newUrl.trim()) return;
    const id = newName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const url = normalizeUrl(newUrl);
    const updated = [...endpoints, { id, name: newName.trim(), url }];
    setEndpoints(updated);
    saveLocalEndpoints(updated);
    setNewName("");
    setNewUrl("http://localhost:");
  };

  const removeEndpoint = (id: string) => {
    const updated = endpoints.filter((e) => e.id !== id);
    setEndpoints(updated);
    saveLocalEndpoints(updated);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">IA Local</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Rode modelos de IA no seu próprio computador, sem depender de nuvem. Totalmente gratuito e privado.
      </p>

      <Accordion type="multiple" className="space-y-2">
        {/* LM Studio */}
        <AccordionItem value="lmstudio" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">🖥️ LM Studio</span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-3 pb-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Baixe em <a href="https://lmstudio.ai" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">lmstudio.ai <ExternalLink className="w-3 h-3" /></a></li>
              <li>Abra o app e baixe um modelo (ex: <code className="bg-secondary px-1 rounded text-foreground">Qwen 2.5 Coder 7B</code>)</li>
              <li>Vá em <strong className="text-foreground">Settings → Developer</strong> e ative <strong className="text-foreground">Developer Mode → ON</strong></li>
              <li>No menu lateral, clique em <strong className="text-foreground">Runtime</strong> para verificar se o servidor local está disponível</li>
              <li>Volte à tela principal e inicie o servidor local (ícone de terminal/servidor)</li>
              <li>O servidor roda em <code className="bg-secondary px-1 rounded text-foreground">http://localhost:1234/v1</code></li>
            </ol>
            <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p><strong className="text-foreground">Developer Mode:</strong> Em <code className="text-foreground">Settings → Developer</code>, mude para <strong className="text-foreground">ON</strong>. Isso habilita controles avançados e o servidor local.</p>
                <p className="mt-1"><strong className="text-foreground">CORS:</strong> O LM Studio já aceita conexões locais por padrão com Developer Mode ativado. Se tiver problemas, verifique se nenhum firewall está bloqueando a porta 1234.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Ollama */}
        <AccordionItem value="ollama" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">🦙 Ollama</span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-3 pb-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Instale em <a href="https://ollama.com" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">ollama.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>No terminal, baixe um modelo:</li>
            </ol>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary px-3 py-1.5 rounded text-foreground text-xs font-mono">ollama pull qwen2.5-coder:7b</code>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyText("ollama pull qwen2.5-coder:7b", "oll1")}>
                {copied === "oll1" ? <CheckCheck className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p>3. Inicie o servidor com CORS habilitado:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary px-3 py-1.5 rounded text-foreground text-xs font-mono">OLLAMA_ORIGINS=* ollama serve</code>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyText("OLLAMA_ORIGINS=* ollama serve", "oll2")}>
                {copied === "oll2" ? <CheckCheck className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p>4. Endpoint padrão:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary px-3 py-1.5 rounded text-foreground text-xs font-mono">http://localhost:11434/v1</code>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyText("http://localhost:11434/v1", "oll3")}>
                {copied === "oll3" ? <CheckCheck className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p><strong className="text-foreground">Modelos recomendados para código:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li><code className="text-foreground">qwen2.5-coder:7b</code> — rápido, 4.5 GB</li>
                  <li><code className="text-foreground">codellama:13b</code> — equilibrado, 7 GB</li>
                  <li><code className="text-foreground">deepseek-coder-v2:16b</code> — poderoso, 9 GB</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Outros / Custom */}
        <AccordionItem value="custom" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">⚙️ Outro servidor compatível com OpenAI</span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-3 pb-4">
            <p>Qualquer servidor que exponha uma API compatível com <code className="bg-secondary px-1 rounded text-foreground">/v1/chat/completions</code> funciona. Exemplos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-foreground">vLLM</strong> — <code className="text-foreground">python -m vllm.entrypoints.openai.api_server</code></li>
              <li><strong className="text-foreground">text-generation-webui</strong> — com extensão OpenAI API</li>
              <li><strong className="text-foreground">LocalAI</strong> — <a href="https://localai.io" target="_blank" rel="noopener" className="text-primary hover:underline">localai.io</a></li>
              <li><strong className="text-foreground">Jan</strong> — <a href="https://jan.ai" target="_blank" rel="noopener" className="text-primary hover:underline">jan.ai</a></li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Custom endpoints */}
      <div className="mt-5 border-t border-border pt-4">
        <p className="text-xs font-medium text-foreground mb-3">Endpoints configurados</p>

        {endpoints.length > 0 && (
          <div className="space-y-2 mb-3">
            {endpoints.map((ep) => (
              <div key={ep.id} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-foreground">{ep.name}</span>
                <code className="text-[10px] text-muted-foreground font-mono flex-1 truncate">{ep.url}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeEndpoint(ep.id)}>
                  <AlertTriangle className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome (ex: Meu vLLM)"
            className="h-8 text-xs flex-1"
          />
          <Input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="http://localhost:8000/v1"
            className="h-8 text-xs font-mono flex-1"
          />
          <Button variant="outline" size="sm" className="h-8" onClick={addEndpoint}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
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

      {/* Local AI setup guide */}
      <LocalSetupGuide />

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
