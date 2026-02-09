import { useModel } from "@/contexts/ModelContext";
import { AI_MODELS, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";
import { AlertTriangle, Check, Wifi, WifiOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = Object.entries(MODEL_CATEGORIES) as [AIModel["category"], { label: string; description: string }][];

/** Human-readable requirement per backend */
const BACKEND_INFO: Record<string, { label: string; keyHint: string; ready: boolean }> = {
  lovable: { label: "Lovable AI", keyHint: "Pronto para uso", ready: true },
  openrouter: { label: "OpenRouter", keyHint: "OPENROUTER_API_KEY", ready: true },
  huggingface: { label: "Hugging Face", keyHint: "HUGGINGFACE_API_KEY", ready: true },
};

function getModelStatus(model: AIModel): { ok: boolean; message: string } {
  if (model.isLocal) {
    return { ok: true, message: `Local — ${model.baseUrl}` };
  }
  const backend = model.providerBackend;
  if (!backend) return { ok: false, message: "Provedor desconhecido" };
  const info = BACKEND_INFO[backend];
  if (!info) return { ok: false, message: "Provedor não suportado" };
  if (!info.ready) return { ok: false, message: `Requer ${info.keyHint}` };
  return { ok: true, message: `via ${info.label}` };
}

export function GlobalModelSelector() {
  const { selectedModel, setSelectedModel } = useModel();
  const status = getModelStatus(selectedModel);

  return (
    <div className="space-y-1.5">
      <Select
        value={selectedModel.id}
        onValueChange={(id) => {
          const m = AI_MODELS.find((m) => m.id === id);
          if (m) setSelectedModel(m);
        }}
      >
        <SelectTrigger className="w-full h-9 text-xs bg-sidebar-accent border-sidebar-border">
          <SelectValue>
            <span className="flex items-center gap-1.5 truncate">
              <span>{selectedModel.icon}</span>
              <span className="truncate">{selectedModel.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80 w-64">
          {categories.map(([catKey, catInfo]) => {
            const models = AI_MODELS.filter((m) => m.category === catKey);
            if (models.length === 0) return null;
            return (
              <SelectGroup key={catKey}>
                <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {catInfo.label}
                </SelectLabel>
                {models.map((m) => {
                  const s = getModelStatus(m);
                  return (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <span className="flex items-center gap-1.5 w-full">
                        <span>{m.icon}</span>
                        <span className="truncate">{m.name}</span>
                        {!s.ok && (
                          <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0 ml-auto" />
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>

      {/* Status indicator */}
      <div className={`flex items-center gap-1.5 px-1 text-[10px] ${status.ok ? "text-muted-foreground" : "text-destructive"}`}>
        {status.ok ? (
          <Check className="w-3 h-3 text-primary flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
        )}
        <span className="truncate">{status.message}</span>
      </div>
    </div>
  );
}
