import { useModel } from "@/contexts/ModelContext";
import { AI_MODELS } from "@/lib/aiModels";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GlobalModelSelector() {
  const { selectedModel, setSelectedModel } = useModel();

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
        <SelectContent className="w-64">
          {AI_MODELS.map((m) => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              <span className="flex items-center gap-1.5 w-full">
                <span>{m.icon}</span>
                <span className="truncate">{m.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
        <Check className="w-3 h-3 text-primary flex-shrink-0" />
        <span className="truncate">Local — {selectedModel.baseUrl}</span>
      </div>
    </div>
  );
}
