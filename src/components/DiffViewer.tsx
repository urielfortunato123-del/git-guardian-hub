import { useState } from "react";
import { Check, X, FileCode, ArrowRight } from "lucide-react";

interface DiffViewerProps {
  originalContent: string;
  newContent: string;
  filePath: string;
  onAccept: () => void;
  onReject: () => void;
}

interface DiffLine {
  type: "add" | "remove" | "same";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const result: DiffLine[] = [];
  
  // Simple LCS-based diff
  const m = origLines.length;
  const n = modLines.length;
  
  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = origLines[i-1] === modLines[j-1] 
        ? dp[i-1][j-1] + 1 
        : Math.max(dp[i-1][j], dp[i][j-1]);
    }
  }
  
  // Backtrack
  let i = m, j = n;
  const ops: DiffLine[] = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i-1] === modLines[j-1]) {
      ops.unshift({ type: "same", content: origLines[i-1], oldLineNum: i, newLineNum: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      ops.unshift({ type: "add", content: modLines[j-1], newLineNum: j });
      j--;
    } else {
      ops.unshift({ type: "remove", content: origLines[i-1], oldLineNum: i });
      i--;
    }
  }
  
  return ops;
}

export function DiffViewer({ originalContent, newContent, filePath, onAccept, onReject }: DiffViewerProps) {
  const diff = computeDiff(originalContent, newContent);
  const additions = diff.filter(d => d.type === "add").length;
  const deletions = diff.filter(d => d.type === "remove").length;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono text-foreground">{filePath}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">+{additions}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">-{deletions}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors"
          >
            <Check className="w-3 h-3" /> Aplicar
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
          >
            <X className="w-3 h-3" /> Rejeitar
          </button>
        </div>
      </div>

      {/* Diff lines */}
      <div className="overflow-auto max-h-80 text-xs font-mono">
        {diff.map((line, idx) => (
          <div
            key={idx}
            className={`flex ${
              line.type === "add" ? "bg-green-500/10" :
              line.type === "remove" ? "bg-red-500/10" : ""
            }`}
          >
            <span className="w-10 text-right pr-2 py-0.5 text-muted-foreground/50 select-none border-r border-border flex-shrink-0">
              {line.oldLineNum || ""}
            </span>
            <span className="w-10 text-right pr-2 py-0.5 text-muted-foreground/50 select-none border-r border-border flex-shrink-0">
              {line.newLineNum || ""}
            </span>
            <span className={`w-5 text-center py-0.5 select-none flex-shrink-0 ${
              line.type === "add" ? "text-green-400" :
              line.type === "remove" ? "text-red-400" : "text-muted-foreground/30"
            }`}>
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            <span className={`flex-1 py-0.5 pr-3 whitespace-pre ${
              line.type === "add" ? "text-green-300" :
              line.type === "remove" ? "text-red-300" : "text-foreground"
            }`}>
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
