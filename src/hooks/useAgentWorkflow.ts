import { useState, useCallback } from "react";
import { AI_MODELS } from "@/lib/aiModels";

export interface AnalysisResult {
  stack?: { type: string; framework: string; language: string; buildTool: string; packageManager: string };
  structure?: { score: number; assessment: string };
  security?: { score: number; risks: string[]; critical: string[] };
  quality?: { score: number; issues: string[]; strengths: string[] };
  dependencies?: { outdated: string[]; vulnerable: string[]; unnecessary: string[] };
  improvements?: Improvement[];
  summary?: string;
  error?: string;
  raw?: string;
}

export interface Improvement {
  title: string;
  priority: "critical" | "high" | "medium" | "low";
  effort: "small" | "medium" | "large";
  description: string;
  files: string[];
}

export interface PlanStep {
  id: number;
  title: string;
  description: string;
  files: string[];
  type: string;
  risk: string;
  estimatedLines: number;
}

export interface ActionPlan {
  steps: PlanStep[];
  totalEstimatedChanges: number;
  rollbackStrategy: string;
  error?: string;
}

export interface FileData {
  path: string;
  content: string;
  size?: number;
}

type WorkflowStep = "select" | "analyze" | "plan" | "patch" | "apply" | "done";

function getLocalBaseUrl(): string {
  const saved = localStorage.getItem("lovhub_global_model");
  const model = AI_MODELS.find(m => m.id === saved) || AI_MODELS[0];
  return model.baseUrl;
}

async function callLocalAI(prompt: string, systemPrompt: string): Promise<string> {
  const baseUrl = getLocalBaseUrl();
  const resp = await fetch(`${baseUrl}/chat/completions`, {
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
    throw new Error(`Erro ao conectar com IA local (${baseUrl}). Verifique se o servidor está rodando.`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

function extractJSON(text: string): string {
  // Try to find JSON block in markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // Try raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];
  return text;
}

export function useAgentWorkflow() {
  const [step, setStep] = useState<WorkflowStep>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [selectedImprovements, setSelectedImprovements] = useState<Improvement[]>([]);
  const [patchContent, setPatchContent] = useState<string>("");
  const [patchedFiles, setPatchedFiles] = useState<Record<string, string>>({});
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [reasoningContent, setReasoningContent] = useState<string | null>(null);

  const analyze = useCallback(async (files: FileData[], projectName?: string) => {
    setIsLoading(true);
    setError(null);
    setReasoningContent(null);
    try {
      const fileList = files.map(f => `- ${f.path} (${f.content.length} chars)`).join("\n");
      const sampleFiles = files.slice(0, 10).map(f =>
        `--- ${f.path} ---\n${f.content.slice(0, 2000)}${f.content.length > 2000 ? "\n... (truncated)" : ""}`
      ).join("\n\n");

      const systemPrompt = `You are a senior code analyst. Analyze the project and return a JSON object with this exact structure:
{
  "stack": { "type": "web|mobile|api|cli", "framework": "string", "language": "string", "buildTool": "string", "packageManager": "string" },
  "structure": { "score": 1-10, "assessment": "string" },
  "security": { "score": 1-10, "risks": ["string"], "critical": ["string"] },
  "quality": { "score": 1-10, "issues": ["string"], "strengths": ["string"] },
  "dependencies": { "outdated": ["string"], "vulnerable": ["string"], "unnecessary": ["string"] },
  "improvements": [{ "title": "string", "priority": "critical|high|medium|low", "effort": "small|medium|large", "description": "string", "files": ["string"] }],
  "summary": "string"
}
Return ONLY valid JSON, no markdown or extra text.`;

      const prompt = `Project: ${projectName || "unknown"}\n\nFiles:\n${fileList}\n\nSample contents:\n${sampleFiles}`;

      const response = await callLocalAI(prompt, systemPrompt);
      const jsonStr = extractJSON(response);
      const result: AnalysisResult = JSON.parse(jsonStr);
      setAnalysis(result);
      setStep("analyze");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Análise falhou. Verifique se o servidor de IA local está rodando.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePlan = useCallback(async (files: FileData[], improvements?: Improvement[]) => {
    setIsLoading(true);
    setError(null);
    setReasoningContent(null);
    try {
      const selected = improvements || selectedImprovements;
      const systemPrompt = `You are a senior developer. Create an action plan for the given improvements. Return ONLY valid JSON:
{
  "steps": [{ "id": 1, "title": "string", "description": "string", "files": ["string"], "type": "security|fix|refactor|performance|feature|docs", "risk": "low|medium|high", "estimatedLines": number }],
  "totalEstimatedChanges": number,
  "rollbackStrategy": "string"
}`;

      const prompt = `Analysis: ${JSON.stringify(analysis)}\n\nSelected improvements: ${JSON.stringify(selected)}\n\nFiles: ${files.map(f => f.path).join(", ")}`;

      const response = await callLocalAI(prompt, systemPrompt);
      const jsonStr = extractJSON(response);
      const result: ActionPlan = JSON.parse(jsonStr);
      setPlan(result);
      setStep("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Geração de plano falhou");
    } finally {
      setIsLoading(false);
    }
  }, [analysis, selectedImprovements]);

  const generatePatch = useCallback(async (planStep: PlanStep, files: FileData[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const relevantFiles = files.filter(f => planStep.files.some(pf => f.path.includes(pf)));
      const filesContent = relevantFiles.map(f =>
        `--- ${f.path} ---\n${f.content}`
      ).join("\n\n");

      const systemPrompt = `You are a senior developer. Generate the complete updated file contents for the requested changes.
Use this format for each file:
\`\`\`filepath:path/to/file.ext
// complete file content here
\`\`\`
Generate COMPLETE file contents, not diffs.`;

      const prompt = `Task: ${planStep.title}\nDescription: ${planStep.description}\n\nCurrent files:\n${filesContent}`;

      const baseUrl = getLocalBaseUrl();
      const resp = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "local-model",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          stream: true,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Erro ao conectar com IA local (${baseUrl})`);
      }

      const reader = resp.body!.getReader();
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
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setPatchContent(fullContent);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const regex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
      let match;
      const newPatched: Record<string, string> = { ...patchedFiles };
      while ((match = regex.exec(fullContent)) !== null) {
        newPatched[match[1].trim()] = match[2];
      }
      setPatchedFiles(newPatched);
      setStep("patch");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Geração de patch falhou");
    } finally {
      setIsLoading(false);
    }
  }, [patchedFiles]);

  const reset = useCallback(() => {
    setStep("select");
    setAnalysis(null);
    setPlan(null);
    setSelectedImprovements([]);
    setPatchContent("");
    setPatchedFiles({});
    setError(null);
    setReasoningContent(null);
  }, []);

  return {
    step,
    setStep,
    isLoading,
    error,
    analysis,
    plan,
    selectedImprovements,
    setSelectedImprovements,
    patchContent,
    patchedFiles,
    reasoningEnabled,
    setReasoningEnabled,
    reasoningContent,
    analyze,
    generatePlan,
    generatePatch,
    reset,
  };
}
