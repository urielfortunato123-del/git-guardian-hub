import { useState, useCallback } from "react";

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

export function useAgentWorkflow() {
  const [step, setStep] = useState<WorkflowStep>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [selectedImprovements, setSelectedImprovements] = useState<Improvement[]>([]);
  const [patchContent, setPatchContent] = useState<string>("");
  const [patchedFiles, setPatchedFiles] = useState<Record<string, string>>({});

  const apiUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const callFunction = useCallback(async (fn: string, body: unknown) => {
    const resp = await fetch(`${apiUrl}/functions/v1/${fn}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(data.error || `Error ${resp.status}`);
    }

    return resp.json();
  }, [apiUrl, apiKey]);

  const analyze = useCallback(async (files: FileData[], projectName?: string, stack?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await callFunction("agent-analyze", {
        files: files.map(f => ({ path: f.path, content: f.content, size: f.content.length })),
        projectName,
        stack,
      });
      setAnalysis(result);
      setStep("analyze");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [callFunction]);

  const generatePlan = useCallback(async (files: FileData[], improvements?: Improvement[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const selected = improvements || selectedImprovements;
      const result = await callFunction("agent-plan", {
        analysis,
        files: files.map(f => ({ path: f.path, content: f.content })),
        selectedImprovements: selected.length > 0 ? selected : undefined,
      });
      setPlan(result);
      setStep("plan");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Plan generation failed");
    } finally {
      setIsLoading(false);
    }
  }, [callFunction, analysis, selectedImprovements]);

  const generatePatch = useCallback(async (planStep: PlanStep, files: FileData[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${apiUrl}/functions/v1/agent-patch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          step: planStep,
          files: files.map(f => ({ path: f.path, content: f.content })),
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Error ${resp.status}`);
      }

      // Stream the response
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

      // Parse file edits from the response
      const regex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
      let match;
      const newPatched: Record<string, string> = { ...patchedFiles };
      while ((match = regex.exec(fullContent)) !== null) {
        newPatched[match[1].trim()] = match[2];
      }
      setPatchedFiles(newPatched);
      setStep("patch");

    } catch (e) {
      setError(e instanceof Error ? e.message : "Patch generation failed");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, apiKey, patchedFiles]);

  const reset = useCallback(() => {
    setStep("select");
    setAnalysis(null);
    setPlan(null);
    setSelectedImprovements([]);
    setPatchContent("");
    setPatchedFiles({});
    setError(null);
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
    analyze,
    generatePlan,
    generatePatch,
    reset,
  };
}
