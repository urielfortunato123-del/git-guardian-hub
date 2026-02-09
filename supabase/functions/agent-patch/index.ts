import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!OPENROUTER_API_KEY && !LOVABLE_API_KEY) throw new Error("No AI API key configured");

    const { step, files } = await req.json();

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

    let response: Response;
    if (OPENROUTER_API_KEY) {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, stream: true, max_tokens: 8192 }),
      });
    } else {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, stream: true }),
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: response.status >= 400 && response.status < 500 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream response back
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
