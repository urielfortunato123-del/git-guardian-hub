export interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  isLocal: boolean;
  baseUrl: string;
  category: "cloud-free" | "cloud-premium" | "local";
  openRouterModel?: string;
}

export const AI_MODELS: AIModel[] = [
  // Cloud Free (OpenRouter)
  { id: "openrouter/gemma-3n-4b", name: "Gemma 3n 4B", provider: "OpenRouter", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "google/gemma-3n-e4b-it:free" },
  { id: "openrouter/gemma-3-1b", name: "Gemma 3 1B", provider: "OpenRouter", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "google/gemma-3-1b-it:free" },
  { id: "openrouter/qwen3-8b", name: "Qwen3 8B", provider: "OpenRouter", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "qwen/qwen3-8b:free" },
  { id: "openrouter/deepseek-v3", name: "DeepSeek V3", provider: "OpenRouter", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "deepseek/deepseek-chat-v3-0324:free" },
  { id: "openrouter/llama4-scout", name: "Llama 4 Scout", provider: "OpenRouter", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "meta-llama/llama-4-scout:free" },
  // Cloud Premium (OpenRouter)
  { id: "openrouter/claude-sonnet-4", name: "Claude Sonnet 4", provider: "OpenRouter", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "anthropic/claude-sonnet-4" },
  { id: "openrouter/gpt-4.1", name: "GPT-4.1", provider: "OpenRouter", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/gpt-4.1" },
  { id: "openrouter/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "OpenRouter", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "google/gemini-2.5-pro-preview-06-05" },
  // Local
  { id: "local/lm-studio", name: "LM Studio", provider: "Local", icon: "🖥️", isLocal: true, baseUrl: "http://localhost:1234/v1", category: "local" },
  { id: "local/ollama", name: "Ollama", provider: "Local", icon: "🦙", isLocal: true, baseUrl: "http://localhost:11434/v1", category: "local" },
];

export const MODEL_CATEGORIES = {
  "cloud-free": { label: "Cloud Free", description: "OpenRouter gratuitos" },
  "cloud-premium": { label: "Cloud Premium", description: "OpenRouter pagos" },
  local: { label: "Local", description: "Rodam no seu PC" },
};

export const DEFAULT_MODEL = AI_MODELS[0];
