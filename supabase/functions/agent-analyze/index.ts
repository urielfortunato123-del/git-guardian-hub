import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-github-token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { files, projectName, stack } = await req.json();

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this project "${projectName || "unknown"}" (detected stack: ${stack || "unknown"}):\n\n${fileList}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let analysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      analysis = { raw: content, error: "Failed to parse structured analysis" };
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
