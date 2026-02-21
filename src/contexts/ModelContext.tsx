import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AI_MODELS, DEFAULT_MODEL, type AIModel } from "@/lib/aiModels";

const OPENROUTER_KEY_STORAGE = "lovhub_openrouter_api_key";

interface ModelContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  openRouterApiKey: string;
  setOpenRouterApiKey: (key: string) => void;
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

  const [openRouterApiKey, setOpenRouterApiKeyState] = useState<string>(
    () => localStorage.getItem(OPENROUTER_KEY_STORAGE) || ""
  );

  const setSelectedModel = useCallback((model: AIModel) => {
    setSelectedModelState(model);
    localStorage.setItem("lovhub_global_model", model.id);
  }, []);

  const setOpenRouterApiKey = useCallback((key: string) => {
    setOpenRouterApiKeyState(key);
    if (key) {
      localStorage.setItem(OPENROUTER_KEY_STORAGE, key);
    } else {
      localStorage.removeItem(OPENROUTER_KEY_STORAGE);
    }
  }, []);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel, openRouterApiKey, setOpenRouterApiKey }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
