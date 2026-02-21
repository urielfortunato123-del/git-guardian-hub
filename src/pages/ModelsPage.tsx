import { useState, useMemo } from "react";
import { Check, Cpu, Monitor, Cloud, Key, Eye, EyeOff, ExternalLink, Copy, CheckCheck, Search } from "lucide-react";
import { AI_MODELS, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";
import { useModel } from "@/contexts/ModelContext";
import { useLocalModelStatus } from "@/hooks/useLocalModelStatus";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { selectedModel, setSelectedModel, openRouterApiKey } = useModel();

  const localEndpoints = useMemo(() => AI_MODELS.filter((m) => m.isLocal).map((m) => m.baseUrl), []);
  const localStatuses = useLocalModelStatus(localEndpoints);

  const categories = ["cloud-free", "cloud-premium", "local"] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary" />
          Modelos de IA
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {AI_MODELS.length} modelos disponíveis
        </p>
      </div>

      <ApiKeySection />

      {/* Model selector dropdown */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Selecionar Modelo</h2>
        </div>

        <Select
          value={selectedModel.id}
          onValueChange={(id) => {
            const m = AI_MODELS.find((m) => m.id === id);
            if (m) setSelectedModel(m);
          }}
        >
          <SelectTrigger className="w-full h-11 text-sm">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span>{selectedModel.icon}</span>
                <span className="font-medium">{selectedModel.name}</span>
                <span className="text-muted-foreground text-xs">— {selectedModel.provider}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {categories.map((cat) => {
              const catModels = AI_MODELS.filter((m) => m.category === cat);
              if (catModels.length === 0) return null;
              return (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-xs text-muted-foreground font-semibold">
                    {MODEL_CATEGORIES[cat].label} — {MODEL_CATEGORIES[cat].description}
                  </SelectLabel>
                  {catModels.map((m) => {
                    const isOnline = m.isLocal ? localStatuses[m.baseUrl] : undefined;
                    return (
                      <SelectItem key={m.id} value={m.id} className="text-sm py-2">
                        <span className="flex items-center gap-2 w-full">
                          <span>{m.icon}</span>
                          <span className="font-medium">{m.name}</span>
                          {m.isLocal && (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? "bg-green-500" : "bg-muted-foreground/40"}`} title={isOnline ? "Online" : "Offline"} />
                          )}
                          <span className="text-muted-foreground text-xs ml-auto">{m.provider}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>

        {/* Selected model info */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-xs gap-1.5">
            {selectedModel.isLocal ? <Monitor className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
            {selectedModel.isLocal ? "Local" : selectedModel.category === "cloud-free" ? "Free" : "Premium"}
          </Badge>
          {selectedModel.isLocal && (
            <Badge variant={localStatuses[selectedModel.baseUrl] ? "secondary" : "outline"} className="text-xs gap-1.5">
              <span className={`w-2 h-2 rounded-full ${localStatuses[selectedModel.baseUrl] ? "bg-green-500" : "bg-destructive"}`} />
              {localStatuses[selectedModel.baseUrl] ? "Online" : "Offline"}
            </Badge>
          )}
          {selectedModel.category === "cloud-premium" && !openRouterApiKey && (
            <Badge variant="outline" className="text-xs gap-1.5 text-destructive border-destructive/30">
              <Key className="w-3.5 h-3.5" />
              Requer API key
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground font-mono">
            {selectedModel.openRouterModel || selectedModel.baseUrl || selectedModel.id}
          </span>
        </div>
      </div>

      <LocalSetupGuide />
    </div>
  );
}
