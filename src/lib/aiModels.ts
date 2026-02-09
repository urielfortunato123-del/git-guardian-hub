export interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  isLocal?: boolean;
  baseUrl?: string;
  supportsReasoning?: boolean;
  providerBackend?: "lovable" | "openrouter";
  category: "cloud-premium" | "cloud-free" | "local";
}

export const AI_MODELS: AIModel[] = [
  // === Lovable AI (built-in, no extra key needed) ===
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "Google", icon: "⚡", providerBackend: "lovable", category: "cloud-premium" },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro", provider: "Google", icon: "🔵", providerBackend: "lovable", category: "cloud-premium" },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", icon: "🔵", providerBackend: "lovable", category: "cloud-premium" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", icon: "⚡", providerBackend: "lovable", category: "cloud-premium" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Lite", provider: "Google", icon: "💨", providerBackend: "lovable", category: "cloud-premium" },
  { id: "openai/gpt-5", name: "GPT-5", provider: "OpenAI", icon: "🟢", providerBackend: "lovable", category: "cloud-premium" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", icon: "🟢", providerBackend: "lovable", category: "cloud-premium" },
  { id: "openai/gpt-5-nano", name: "GPT-5 Nano", provider: "OpenAI", icon: "🟢", providerBackend: "lovable", category: "cloud-premium" },
  { id: "openai/gpt-5.2", name: "GPT-5.2", provider: "OpenAI", icon: "🟢", supportsReasoning: true, providerBackend: "lovable", category: "cloud-premium" },

  // === OpenRouter (needs OPENROUTER_API_KEY) ===
  { id: "openai/gpt-oss-20b:free", name: "GPT-OSS 20B (Free)", provider: "OpenAI", icon: "🆓", supportsReasoning: true, providerBackend: "openrouter", category: "cloud-free" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", icon: "🟠", providerBackend: "openrouter", category: "cloud-premium" },
  { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", provider: "Anthropic", icon: "🟠", providerBackend: "openrouter", category: "cloud-premium" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", provider: "Meta", icon: "🟣", providerBackend: "openrouter", category: "cloud-free" },
  { id: "deepseek/deepseek-coder", name: "DeepSeek Coder", provider: "DeepSeek", icon: "⚫", providerBackend: "openrouter", category: "cloud-free" },

  // === Local models ===
  { id: "local/lm-studio", name: "LM Studio", provider: "Local", icon: "🖥️", isLocal: true, baseUrl: "http://localhost:1234/v1", category: "local" },
  { id: "local/ollama", name: "Ollama", provider: "Local", icon: "🦙", isLocal: true, baseUrl: "http://localhost:11434/v1", category: "local" },
];

export const MODEL_CATEGORIES = {
  "cloud-premium": { label: "Cloud Premium", description: "Modelos de alta qualidade" },
  "cloud-free": { label: "Cloud Gratuito", description: "Modelos gratuitos / open-source" },
  "local": { label: "Local", description: "Rodam no seu PC" },
};

export const DEFAULT_MODEL = AI_MODELS[0]; // Gemini 3 Flash
