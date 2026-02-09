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
    const body: Record<string, unknown> = { model, messages, max_tokens: maxTokens };
    if (reasoning) body.reasoning = { enabled: true };
    return { url: "https://openrouter.ai/api/v1/chat/completions", key: OPENROUTER_API_KEY, body };
  }
  if (LOVABLE_API_KEY) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: LOVABLE_API_KEY,
      body: { model: "google/gemini-3-flash-preview", messages },
    };
  }
  throw new Error("No AI API key configured");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysis, files, selectedImprovements, reasoning } = await req.json();

    if (!analysis || !files) {
      return new Response(JSON.stringify({ error: "Analysis and files are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const affectedPaths = new Set<string>();
    (selectedImprovements || analysis.improvements || []).forEach((imp: { files?: string[] }) => {
      imp.files?.forEach((f: string) => affectedPaths.add(f));
    });

    const fileContext = files
      .filter((f: { path: string }) => affectedPaths.size === 0 || affectedPaths.has(f.path))
      .slice(0, 20)
      .map((f: { path: string; content: string }) => `--- ${f.path} ---\n${f.content.slice(0, 4000)}`)
      .join("\n\n");

    const systemPrompt = `You are a senior developer creating a step-by-step action plan to improve a codebase.
Return ONLY valid JSON with this structure:

{
  "steps": [
    {
      "id": 1,
      "title": "string",
      "description": "string (what to do and why)",
      "files": ["file paths to modify"],
      "type": "refactor | fix | security | performance | feature | docs",
      "risk": "low | medium | high",
      "estimatedLines": number
    }
  ],
  "totalEstimatedChanges": number,
  "rollbackStrategy": "string"
}

Be specific about what exactly needs to change in each file. Order steps by dependency (do prerequisites first).`;

    const improvements = selectedImprovements || analysis.improvements || [];
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Create an action plan for these improvements:\n${JSON.stringify(improvements, null, 2)}\n\nProject files:\n${fileContext}`,
      },
    ];

    const provider = buildProvider(messages, !!reasoning, 4096);

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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let plan;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      plan = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      plan = { raw: content, error: "Failed to parse plan" };
    }

    const reasoningContent = data.choices?.[0]?.message?.reasoning_content;
    if (reasoningContent) {
      plan._reasoning = reasoningContent;
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Plan error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
