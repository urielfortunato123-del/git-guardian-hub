export interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  isLocal: true;
  baseUrl: string;
  category: "local";
}

export const AI_MODELS: AIModel[] = [
  { id: "local/lm-studio", name: "LM Studio", provider: "Local", icon: "🖥️", isLocal: true, baseUrl: "http://localhost:1234/v1", category: "local" },
  { id: "local/ollama", name: "Ollama", provider: "Local", icon: "🦙", isLocal: true, baseUrl: "http://localhost:11434/v1", category: "local" },
];

export const MODEL_CATEGORIES = {
  local: { label: "Local", description: "Rodam no seu PC" },
};

export const DEFAULT_MODEL = AI_MODELS[0];
