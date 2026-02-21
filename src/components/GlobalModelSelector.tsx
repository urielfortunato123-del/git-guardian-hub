import { useModel } from "@/contexts/ModelContext";
import { AI_MODELS, MODEL_CATEGORIES } from "@/lib/aiModels";
import { Check, Cloud, Monitor } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GlobalModelSelector() {
  const { selectedModel, setSelectedModel } = useModel();

  const categories = ["cloud-free", "cloud-premium", "local"] as const;

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
        <SelectContent className="w-64 max-h-80">
          {categories.map((cat) => {
            const catModels = AI_MODELS.filter((m) => m.category === cat);
            if (catModels.length === 0) return null;
            return (
              <SelectGroup key={cat}>
                <SelectLabel className="text-[10px] text-muted-foreground">{MODEL_CATEGORIES[cat].label}</SelectLabel>
                {catModels.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    <span className="flex items-center gap-1.5 w-full">
                      <span>{m.icon}</span>
                      <span className="truncate">{m.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
        {selectedModel.isLocal ? <Monitor className="w-3 h-3 text-primary flex-shrink-0" /> : <Cloud className="w-3 h-3 text-primary flex-shrink-0" />}
        <span className="truncate">{selectedModel.isLocal ? `Local — ${selectedModel.baseUrl}` : `Cloud — ${selectedModel.provider}`}</span>
      </div>
    </div>
  );
}
