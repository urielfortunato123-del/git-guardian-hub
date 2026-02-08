import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  files?: Record<string, string>; // path -> content
  model?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const { messages, files, model }: ChatRequest = await req.json();

    // Build system prompt with file context
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "LovHub AI Editor",
      },
      body: JSON.stringify({
        model: model || "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please check your OpenRouter account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: `OpenRouter API error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
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
