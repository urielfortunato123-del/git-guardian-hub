import { useModel } from "@/contexts/ModelContext";
import { AI_MODELS, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";
import { ChevronDown } from "lucide-react";
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

export function GlobalModelSelector() {
  const { selectedModel, setSelectedModel } = useModel();

  return (
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
      <SelectContent className="max-h-72">
        {categories.map(([catKey, catInfo]) => {
          const models = AI_MODELS.filter((m) => m.category === catKey);
          if (models.length === 0) return null;
          return (
            <SelectGroup key={catKey}>
              <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {catInfo.label}
              </SelectLabel>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span>{m.icon}</span>
                    <span>{m.name}</span>
                    <span className="text-muted-foreground ml-auto text-[10px]">{m.provider}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}
