import { useState } from "react";
import { Brain, ChevronDown, ChevronUp, FileCode, Layers, Shield } from "lucide-react";
import type { UploadedFile } from "@/lib/fileUtils";
import { detectStack, generateProjectSummary } from "@/lib/stackDetector";
import ReactMarkdown from "react-markdown";

interface ProjectAnalysisProps {
  files: UploadedFile[];
}

export function ProjectAnalysis({ files }: ProjectAnalysisProps) {
  const [expanded, setExpanded] = useState(true);
  
  if (files.length === 0) return null;

  const stack = detectStack(files);
  const summary = generateProjectSummary(files, stack);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Análise do Projeto</span>
          <span className="text-xs px-1.5 py-0.5 bg-primary/15 text-primary rounded">{stack.icon} {stack.label}</span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      
      {expanded && (
        <div className="px-4 pb-3">
          <div className="prose prose-sm prose-invert max-w-none text-xs text-muted-foreground">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
