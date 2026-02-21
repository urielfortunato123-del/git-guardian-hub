import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { AI_MODELS, type AIModel } from "@/lib/aiModels";
import { useModel } from "@/contexts/ModelContext";

export function ChatHeader() {
  const { selectedModel, setSelectedModel } = useModel();
  const [showModelPicker, setShowModelPicker] = useState(false);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) setShowModelPicker(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">AI Agent</span>
      </div>

      <div className="relative" ref={modelPickerRef}>
        <button
          onClick={() => setShowModelPicker(!showModelPicker)}
          className="flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/80 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <span>{selectedModel.icon}</span>
          <span className="text-foreground font-medium max-w-[100px] truncate">{selectedModel.name}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {showModelPicker && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-auto">
            {AI_MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => { setSelectedModel(model); setShowModelPicker(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/60 transition-colors ${
                  selectedModel.id === model.id ? "bg-primary/10" : ""
                }`}
              >
                <span className="text-sm">{model.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{model.name}</p>
                  <p className="text-xs text-muted-foreground">{model.provider}</p>
                </div>
                {selectedModel.id === model.id && <span className="text-primary text-xs">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
