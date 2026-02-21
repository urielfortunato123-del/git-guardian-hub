/**
 * Centralized AI service layer
 * Unifies all AI calls across the app (Chat, Workflow, Repo Doctor)
 */
import { AI_MODELS, type AIModel } from "@/lib/aiModels";

export function getSelectedModel(): AIModel {
  const saved = localStorage.getItem("lovhub_global_model");
  return AI_MODELS.find(m => m.id === saved) || AI_MODELS[0];
}

export function getOpenRouterKey(): string {
  return localStorage.getItem("lovhub_openrouter_api_key") || "";
}

interface CallAIOptions {
  model?: AIModel;
  stream?: boolean;
}

/**
 * Non-streaming AI call. Returns the full response text.
 */
export async function callAI(
  prompt: string,
  systemPrompt: string,
  options?: CallAIOptions
): Promise<string> {
  const model = options?.model || getSelectedModel();

  if (model.isLocal) {
    const resp = await fetch(`${model.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "local-model",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });
    if (!resp.ok) {
      throw new Error(`Erro ao conectar com IA local (${model.baseUrl}). Verifique se o servidor está rodando.`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-proxy`;
  const openRouterKey = getOpenRouterKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };
  if (openRouterKey) headers["x-openrouter-key"] = openRouterKey;

  const resp = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model.openRouterModel || "google/gemma-3n-e4b-it:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      stream: false,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Erro na API OpenRouter: ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Streaming AI call. Returns the raw Response for SSE processing.
 */
export async function callAIStream(
  messages: Array<{ role: string; content: string }>,
  options?: CallAIOptions
): Promise<Response> {
  const model = options?.model || getSelectedModel();

  if (model.isLocal) {
    const resp = await fetch(`${model.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "local-model", messages, stream: true }),
    });
    if (!resp.ok) {
      throw new Error(`Erro ao conectar com IA local (${model.baseUrl})`);
    }
    return resp;
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openrouter-proxy`;
  const openRouterKey = getOpenRouterKey();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };
  if (openRouterKey) headers["x-openrouter-key"] = openRouterKey;

  const resp = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: model.openRouterModel || "google/gemma-3n-e4b-it:free",
      messages,
      stream: true,
    }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.error || `Erro na API OpenRouter: ${resp.status}`);
  }

  return resp;
}

/**
 * Process an SSE stream and call onDelta for each content token.
 */
export async function processSSEStream(
  response: Response,
  onDelta: (content: string, reasoning?: string) => void,
  onDone?: () => void
): Promise<string> {
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;
        if (content) {
          fullContent += content;
          onDelta(content, reasoning);
        } else if (reasoning) {
          onDelta("", reasoning);
        }
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  onDone?.();
  return fullContent;
}

/**
 * Extract JSON from AI response (handles markdown fences).
 */
export function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

/**
 * Validate an OpenRouter API key by making a lightweight request.
 */
export async function validateOpenRouterKey(key: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (resp.ok) return { valid: true };
    if (resp.status === 401) return { valid: false, error: "Chave inválida" };
    return { valid: false, error: `Erro: ${resp.status}` };
  } catch {
    return { valid: false, error: "Não foi possível validar (erro de rede)" };
  }
}
