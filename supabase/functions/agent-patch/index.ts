import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildProvider(
  messages: unknown[],
  reasoning: boolean,
  maxTokens: number,
) {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (OPENROUTER_API_KEY) {
    const model = reasoning ? "openai/gpt-oss-120b:exacto" : "google/gemini-2.5-flash";
    const body: Record<string, unknown> = { model, messages, stream: true, max_tokens: maxTokens };
    if (reasoning) body.reasoning = { enabled: true };
    return { url: "https://openrouter.ai/api/v1/chat/completions", key: OPENROUTER_API_KEY, body };
  }
  if (LOVABLE_API_KEY) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: LOVABLE_API_KEY,
      body: { model: "google/gemini-3-flash-preview", messages, stream: true },
    };
  }
  throw new Error("No AI API key configured");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { step, files, reasoning } = await req.json();

    if (!step || !files) {
      return new Response(JSON.stringify({ error: "Step and files are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileContext = files
      .filter((f: { path: string }) => step.files?.includes(f.path))
      .map((f: { path: string; content: string }) => `--- ${f.path} ---\n${f.content}`)
      .join("\n\n");

    const systemPrompt = `You are a senior developer generating code patches.

For each file that needs changes, output the COMPLETE updated file content using this format:

\`\`\`filepath:path/to/file.ext
// complete new file content
\`\`\`

RULES:
- Show the COMPLETE file content (not just changes)
- Preserve existing functionality unless explicitly changing it
- Add comments explaining significant changes
- Follow existing code style and conventions
- If creating a new file, use the same format`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Execute this improvement step:\n\nTitle: ${step.title}\nDescription: ${step.description}\nType: ${step.type}\nFiles to modify: ${step.files?.join(", ")}\n\nCurrent file contents:\n${fileContext}`,
      },
    ];

    const provider = buildProvider(messages, !!reasoning, 8192);

    const response = await fetch(provider.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${provider.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(provider.body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: response.status >= 400 && response.status < 500 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Patch error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
