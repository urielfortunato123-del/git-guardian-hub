import { useState } from "react";
import { Search, Check, Cpu, Monitor, Cloud, Key, Eye, EyeOff, ExternalLink, Copy, CheckCheck, Info } from "lucide-react";
import { motion } from "framer-motion";
import { AI_MODELS, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";
import { useModel } from "@/contexts/ModelContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function ApiKeySection() {
  const { openRouterApiKey, setOpenRouterApiKey } = useModel();
  const [showKey, setShowKey] = useState(false);
  const [inputKey, setInputKey] = useState(openRouterApiKey);

  const save = () => {
    setOpenRouterApiKey(inputKey.trim());
  };

  const clear = () => {
    setInputKey("");
    setOpenRouterApiKey("");
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">OpenRouter API Key</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Insira sua chave da <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">OpenRouter <ExternalLink className="w-3 h-3" /></a> para usar todos os modelos. Modelos gratuitos funcionam sem key.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="h-9 text-xs font-mono pr-8"
          />
          <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <Button variant="default" size="sm" className="h-9" onClick={save}>
          Salvar
        </Button>
        {openRouterApiKey && (
          <Button variant="outline" size="sm" className="h-9" onClick={clear}>
            Limpar
          </Button>
        )}
      </div>
      {openRouterApiKey && (
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-primary">
          <Check className="w-3 h-3" />
          <span>API key salva localmente</span>
        </div>
      )}
    </div>
  );
}

function LocalSetupGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">IA Local</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Rode modelos de IA no seu próprio computador, sem depender de nuvem.
      </p>
      <Accordion type="multiple" className="space-y-2">
        <AccordionItem value="lmstudio" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">🖥️ LM Studio</span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-3 pb-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Baixe em <a href="https://lmstudio.ai" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">lmstudio.ai <ExternalLink className="w-3 h-3" /></a></li>
              <li>Abra o app e baixe um modelo (ex: <code className="bg-secondary px-1 rounded text-foreground">Qwen 2.5 Coder 7B</code>)</li>
              <li>Ative <strong className="text-foreground">Developer Mode</strong> em Settings</li>
              <li>Inicie o servidor local — endpoint: <code className="bg-secondary px-1 rounded text-foreground">http://localhost:1234/v1</code></li>
            </ol>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="ollama" className="border border-border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">🦙 Ollama</span>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-3 pb-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Instale em <a href="https://ollama.com" target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">ollama.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>Baixe um modelo: <code className="bg-secondary px-1 rounded text-foreground">ollama pull qwen2.5-coder:7b</code></li>
            </ol>
            <p>3. Inicie com CORS:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-secondary px-3 py-1.5 rounded text-foreground text-xs font-mono">OLLAMA_ORIGINS=* ollama serve</code>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyText("OLLAMA_ORIGINS=* ollama serve", "oll2")}>
                {copied === "oll2" ? <CheckCheck className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function ModelsPage() {
  const [query, setQuery] = useState("");
  const { selectedModel, setSelectedModel, openRouterApiKey } = useModel();

  const filtered = AI_MODELS.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
  });

  const categories = ["cloud-free", "cloud-premium", "local"] as const;

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

      <ApiKeySection />
      <LocalSetupGuide />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar modelos..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
        />
      </div>

      {/* Models by category */}
      {categories.map((cat) => {
        const catModels = filtered.filter((m) => m.category === cat);
        if (catModels.length === 0) return null;
        const catInfo = MODEL_CATEGORIES[cat];

        return (
          <div key={cat} className="mb-8">
            <h2 className="text-sm font-semibold text-foreground mb-1">{catInfo.label}</h2>
            <p className="text-xs text-muted-foreground mb-3">{catInfo.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              {catModels.map((model, i) => {
                const isActive = selectedModel.id === model.id;
                const needsKey = cat === "cloud-premium" && !openRouterApiKey;

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
                        <span className="font-semibold text-sm text-foreground truncate block">{model.name}</span>
                        <p className="text-xs text-muted-foreground">{model.provider}</p>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            {model.isLocal ? <Monitor className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
                            {model.isLocal ? "Local" : cat === "cloud-free" ? "Free" : "Premium"}
                          </Badge>
                          {needsKey && (
                            <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30">
                              <Key className="w-3 h-3" />
                              Requer API key
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground mt-2 font-mono truncate opacity-60">{model.openRouterModel || model.id}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhum modelo encontrado</p>
        </div>
      )}
    </div>
  );
}
