import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-github-token",
};

interface ProviderConfig {
  url: string;
  key: string;
  model: string;
  body: Record<string, unknown>;
}

function buildProvider(
  messages: unknown[],
  reasoning: boolean,
  maxTokens: number,
): ProviderConfig {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (OPENROUTER_API_KEY) {
    const model = reasoning ? "openai/gpt-oss-120b:exacto" : "google/gemini-2.5-flash";
    const body: Record<string, unknown> = { model, messages, max_tokens: maxTokens };
    if (reasoning) body.reasoning = { enabled: true };
    return { url: "https://openrouter.ai/api/v1/chat/completions", key: OPENROUTER_API_KEY, model, body };
  }
  if (LOVABLE_API_KEY) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      key: LOVABLE_API_KEY,
      model: "google/gemini-3-flash-preview",
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
    const { files, projectName, stack, reasoning } = await req.json();

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileList = files.map((f: { path: string; content?: string; size?: number }) => {
      const snippet = f.content ? f.content.slice(0, 1500) : "(binary or too large)";
      return `--- ${f.path} (${f.size || snippet.length} bytes) ---\n${snippet}`;
    }).join("\n\n");

    const systemPrompt = `You are a senior software architect analyzing a project. Respond in JSON format only.

Analyze the project and return a JSON object with:
{
  "stack": {
    "type": "string (e.g. react, python, java, node, etc.)",
    "framework": "string",
    "language": "string",
    "buildTool": "string",
    "packageManager": "string"
  },
  "structure": {
    "score": "number 1-10",
    "assessment": "string (2-3 sentences)"
  },
  "security": {
    "score": "number 1-10",
    "risks": ["string array of specific risks found"],
    "critical": ["string array of critical issues"]
  },
  "quality": {
    "score": "number 1-10",
    "issues": ["string array of code quality issues"],
    "strengths": ["string array of good practices found"]
  },
  "dependencies": {
    "outdated": ["string array"],
    "vulnerable": ["string array"],
    "unnecessary": ["string array"]
  },
  "improvements": [
    {
      "title": "string",
      "priority": "critical | high | medium | low",
      "effort": "small | medium | large",
      "description": "string (1-2 sentences)",
      "files": ["affected file paths"]
    }
  ],
  "summary": "string (3-4 sentence overall assessment)"
}`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Analyze this project "${projectName || "unknown"}" (detected stack: ${stack || "unknown"}):\n\n${fileList}`,
      },
    ];

    const provider = buildProvider(messages, !!reasoning, 4096);

    const response = await fetch(provider.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(provider.body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: `AI error: ${response.status} - ${errText.slice(0, 200)}` }), {
        status: response.status >= 400 && response.status < 500 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let analysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      analysis = { raw: content, error: "Failed to parse structured analysis" };
    }

    // Attach reasoning if present
    const reasoningContent = data.choices?.[0]?.message?.reasoning_content;
    if (reasoningContent) {
      analysis._reasoning = reasoningContent;
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Analyze error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
