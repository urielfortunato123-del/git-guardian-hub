import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AI_MODELS, DEFAULT_MODEL, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";

interface ModelContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<AIModel>(() => {
    const saved = localStorage.getItem("lovhub_global_model");
    if (saved) {
      const found = AI_MODELS.find((m) => m.id === saved);
      if (found) return found;
    }
    return DEFAULT_MODEL;
  });

  const setSelectedModel = useCallback((model: AIModel) => {
    setSelectedModelState(model);
    localStorage.setItem("lovhub_global_model", model.id);
  }, []);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
