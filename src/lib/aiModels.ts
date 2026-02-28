export interface AIModel {
  id: string;
  name: string;
  provider: string;
  icon: string;
  isLocal: boolean;
  baseUrl: string;
  category: "cloud-lovable" | "cloud-free" | "cloud-premium" | "local";
  openRouterModel?: string;
  /** When set, route through lovable-ai-proxy instead of openrouter-proxy */
  gateway?: "lovable" | "openrouter";
}

export const AI_MODELS: AIModel[] = [
  // ── Lovable AI (Google Gemini — sem API key) ──
  { id: "lov/gemini-3-flash", name: "Gemini 3 Flash Preview", provider: "Google", icon: "✨", isLocal: false, baseUrl: "", category: "cloud-lovable", openRouterModel: "google/gemini-3-flash-preview", gateway: "lovable" },
  { id: "lov/gemini-3-pro", name: "Gemini 3 Pro Preview", provider: "Google", icon: "✨", isLocal: false, baseUrl: "", category: "cloud-lovable", openRouterModel: "google/gemini-3-pro-preview", gateway: "lovable" },
  { id: "lov/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", icon: "✨", isLocal: false, baseUrl: "", category: "cloud-lovable", openRouterModel: "google/gemini-2.5-pro", gateway: "lovable" },
  { id: "lov/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", icon: "✨", isLocal: false, baseUrl: "", category: "cloud-lovable", openRouterModel: "google/gemini-2.5-flash", gateway: "lovable" },
  { id: "lov/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", icon: "✨", isLocal: false, baseUrl: "", category: "cloud-lovable", openRouterModel: "google/gemini-2.5-flash-lite", gateway: "lovable" },
  { id: "lov/gpt-5", name: "GPT-5", provider: "OpenAI", icon: "✨", isLocal: false, baseUrl: "", category: "cloud-lovable", openRouterModel: "openai/gpt-5", gateway: "lovable" },
  { id: "lov/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", icon: "✨", isLocal: false, baseUrl: "", category: "cloud-lovable", openRouterModel: "openai/gpt-5-mini", gateway: "lovable" },

  // ── Cloud Free (OpenRouter) ──
  { id: "or-free/gemma-3n-4b", name: "Gemma 3n 4B", provider: "Google (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "google/gemma-3n-e4b-it:free", gateway: "openrouter" },
  { id: "or-free/gemma-3-1b", name: "Gemma 3 1B", provider: "Google (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "google/gemma-3-1b-it:free", gateway: "openrouter" },
  { id: "or-free/gemma-3-4b", name: "Gemma 3 4B", provider: "Google (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "google/gemma-3-4b-it:free", gateway: "openrouter" },
  { id: "or-free/gemma-3-12b", name: "Gemma 3 12B", provider: "Google (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "google/gemma-3-12b-it:free", gateway: "openrouter" },
  { id: "or-free/gemma-3-27b", name: "Gemma 3 27B", provider: "Google (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "google/gemma-3-27b-it:free", gateway: "openrouter" },
  { id: "or-free/qwen3-8b", name: "Qwen3 8B", provider: "Qwen (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "qwen/qwen3-8b:free", gateway: "openrouter" },
  { id: "or-free/qwen3-4b", name: "Qwen3 4B", provider: "Qwen (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "qwen/qwen3-4b:free", gateway: "openrouter" },
  { id: "or-free/qwen3-30b-a3b", name: "Qwen3 30B-A3B", provider: "Qwen (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "qwen/qwen3-30b-a3b:free", gateway: "openrouter" },
  { id: "or-free/deepseek-v3", name: "DeepSeek V3", provider: "DeepSeek (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "deepseek/deepseek-chat-v3-0324:free", gateway: "openrouter" },
  { id: "or-free/deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "deepseek/deepseek-r1:free", gateway: "openrouter" },
  { id: "or-free/llama4-scout", name: "Llama 4 Scout", provider: "Meta (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "meta-llama/llama-4-scout:free", gateway: "openrouter" },
  { id: "or-free/llama4-maverick", name: "Llama 4 Maverick", provider: "Meta (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "meta-llama/llama-4-maverick:free", gateway: "openrouter" },
  { id: "or-free/llama-3.3-70b", name: "Llama 3.3 70B", provider: "Meta (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "meta-llama/llama-3.3-70b-instruct:free", gateway: "openrouter" },
  { id: "or-free/phi-4-14b", name: "Phi-4 14B", provider: "Microsoft (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "microsoft/phi-4:free", gateway: "openrouter" },
  { id: "or-free/mistral-small", name: "Mistral Small 3.1", provider: "Mistral (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "mistralai/mistral-small-3.1-24b-instruct:free", gateway: "openrouter" },
  { id: "or-free/devstral-small", name: "Devstral Small", provider: "Mistral (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "mistralai/devstral-small:free", gateway: "openrouter" },
  { id: "or-free/command-r", name: "Command R", provider: "Cohere (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "cohere/command-r:free", gateway: "openrouter" },
  { id: "or-free/command-r-plus", name: "Command R+", provider: "Cohere (Free)", icon: "🌐", isLocal: false, baseUrl: "", category: "cloud-free", openRouterModel: "cohere/command-r-plus:free", gateway: "openrouter" },

  // ── Cloud Premium (OpenRouter) ──
  { id: "or/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "anthropic/claude-sonnet-4", gateway: "openrouter" },
  { id: "or/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "anthropic/claude-3.5-sonnet", gateway: "openrouter" },
  { id: "or/claude-3.5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "anthropic/claude-3.5-haiku", gateway: "openrouter" },
  { id: "or/claude-opus-4", name: "Claude Opus 4", provider: "Anthropic", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "anthropic/claude-opus-4", gateway: "openrouter" },
  { id: "or/gpt-4.1", name: "GPT-4.1", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/gpt-4.1", gateway: "openrouter" },
  { id: "or/gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/gpt-4.1-mini", gateway: "openrouter" },
  { id: "or/gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/gpt-4.1-nano", gateway: "openrouter" },
  { id: "or/gpt-4o", name: "GPT-4o", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/gpt-4o", gateway: "openrouter" },
  { id: "or/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/gpt-4o-mini", gateway: "openrouter" },
  { id: "or/o3", name: "o3", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/o3", gateway: "openrouter" },
  { id: "or/o3-mini", name: "o3 Mini", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/o3-mini", gateway: "openrouter" },
  { id: "or/o4-mini", name: "o4 Mini", provider: "OpenAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "openai/o4-mini", gateway: "openrouter" },
  { id: "or/gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "google/gemini-2.5-pro-preview-06-05", gateway: "openrouter" },
  { id: "or/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "google/gemini-2.5-flash-preview-05-20", gateway: "openrouter" },
  { id: "or/gemini-2.0-flash", name: "Gemini 2.0 Flash", provider: "Google", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "google/gemini-2.0-flash-001", gateway: "openrouter" },
  { id: "or/deepseek-v3-paid", name: "DeepSeek V3", provider: "DeepSeek", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "deepseek/deepseek-chat-v3-0324", gateway: "openrouter" },
  { id: "or/deepseek-r1-paid", name: "DeepSeek R1", provider: "DeepSeek", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "deepseek/deepseek-r1", gateway: "openrouter" },
  { id: "or/mistral-large", name: "Mistral Large", provider: "Mistral", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "mistralai/mistral-large", gateway: "openrouter" },
  { id: "or/codestral", name: "Codestral", provider: "Mistral", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "mistralai/codestral", gateway: "openrouter" },
  { id: "or/qwen3-235b", name: "Qwen3 235B-A22B", provider: "Qwen", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "qwen/qwen3-235b-a22b", gateway: "openrouter" },
  { id: "or/qwen-max", name: "Qwen Max", provider: "Qwen", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "qwen/qwen-max", gateway: "openrouter" },
  { id: "or/grok-3", name: "Grok 3", provider: "xAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "x-ai/grok-3", gateway: "openrouter" },
  { id: "or/grok-3-mini", name: "Grok 3 Mini", provider: "xAI", icon: "🧠", isLocal: false, baseUrl: "", category: "cloud-premium", openRouterModel: "x-ai/grok-3-mini", gateway: "openrouter" },

  // ── Local ──
  { id: "local/lm-studio", name: "LM Studio", provider: "Local", icon: "🖥️", isLocal: true, baseUrl: "http://localhost:1234/v1", category: "local" },
  { id: "local/ollama", name: "Ollama", provider: "Local", icon: "🦙", isLocal: true, baseUrl: "http://localhost:11434/v1", category: "local" },
];

export const MODEL_CATEGORIES = {
  "cloud-lovable": { label: "✨ Lovable AI", description: "Gemini & GPT-5 sem API key" },
  "cloud-free": { label: "☁️ Cloud Free", description: "OpenRouter gratuitos" },
  "cloud-premium": { label: "🧠 Cloud Premium", description: "OpenRouter pagos (requer API key)" },
  local: { label: "🖥️ Local", description: "Rodam no seu PC" },
};

export const DEFAULT_MODEL = AI_MODELS[0];
