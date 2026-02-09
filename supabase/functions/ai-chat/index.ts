import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  reasoning_details?: unknown;
}

interface ChatRequest {
  messages: Message[];
  files?: Record<string, string>;
  model?: string;
  reasoning?: boolean;
  provider?: "lovable" | "openrouter" | "auto";
}

// Provider config
const PROVIDERS = {
  lovable: {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    getKey: () => Deno.env.get("LOVABLE_API_KEY"),
    models: [
      "google/gemini-3-flash-preview",
      "google/gemini-3-pro-preview",
      "google/gemini-2.5-pro",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite",
      "openai/gpt-5",
      "openai/gpt-5-mini",
      "openai/gpt-5-nano",
      "openai/gpt-5.2",
    ],
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    getKey: () => Deno.env.get("OPENROUTER_API_KEY"),
    models: [] as string[], // accepts any model
  },
};

function buildSystemPrompt(files?: Record<string, string>): string {
  let systemPrompt = `You are an expert AI coding assistant integrated into LovHub, a GitHub-like project manager. You help users edit their code files.

CAPABILITIES:
- You can VIEW all files the user has uploaded
- You can EDIT files by providing updated code
- You understand multiple programming languages

INSTRUCTIONS:
- When the user asks to modify a file, show the COMPLETE updated file content
- Use markdown code blocks with the file path as the language identifier
- Be concise but thorough in your explanations
- If you need to create a new file, specify the path clearly

FORMAT FOR FILE EDITS:
When editing a file, use this format:
\`\`\`filepath:src/example.ts
// complete file content here
\`\`\`

CURRENT PROJECT FILES:`;

  if (files && Object.keys(files).length > 0) {
    for (const [path, content] of Object.entries(files)) {
      systemPrompt += `\n\n--- ${path} ---\n${content.slice(0, 3000)}${content.length > 3000 ? "\n... (truncated)" : ""}`;
    }
  } else {
    systemPrompt += "\n\n(No files uploaded yet)";
  }

  return systemPrompt;
}

function resolveProvider(model: string, preferredProvider?: string): "lovable" | "openrouter" {
  if (preferredProvider === "lovable" || preferredProvider === "openrouter") {
    return preferredProvider;
  }
  // Auto: check if model is in Lovable's supported list
  if (PROVIDERS.lovable.models.includes(model)) {
    return "lovable";
  }
  return "openrouter";
}

async function callProvider(
  providerName: "lovable" | "openrouter",
  body: Record<string, unknown>
): Promise<Response> {
  const provider = PROVIDERS[providerName];
  const apiKey = provider.getKey();

  if (!apiKey) {
    throw new Error(`${providerName.toUpperCase()} API key is not configured`);
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (providerName === "openrouter") {
    headers["HTTP-Referer"] = "https://lovable.dev";
    headers["X-Title"] = "LovHub AI Editor";
  }

  return fetch(provider.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, files, model, reasoning, provider: preferredProvider }: ChatRequest = await req.json();

    const selectedModel = model || "google/gemini-3-flash-preview";
    const primaryProvider = resolveProvider(selectedModel, preferredProvider);

    const systemPrompt = buildSystemPrompt(files);

    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(m => {
        const msg: Record<string, unknown> = { role: m.role, content: m.content };
        if (m.reasoning_details) {
          msg.reasoning_details = m.reasoning_details;
        }
        return msg;
      }),
    ];

    const body: Record<string, unknown> = {
      model: selectedModel,
      messages: apiMessages,
      stream: true,
    };

    if (reasoning) {
      body.reasoning = { enabled: true };
    }

    // Try primary provider
    let response = await callProvider(primaryProvider, body);

    // Fallback: if primary fails and there's an alternative
    if (!response.ok) {
      const fallback = primaryProvider === "lovable" ? "openrouter" : "lovable";
      const fallbackKey = PROVIDERS[fallback].getKey();
      
      if (fallbackKey) {
        console.log(`Primary provider ${primaryProvider} failed (${response.status}), falling back to ${fallback}`);
        response = await callProvider(fallback, body);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Provider error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please check your account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `AI provider error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Chat function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
