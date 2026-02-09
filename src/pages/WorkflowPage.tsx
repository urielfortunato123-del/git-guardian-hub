import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Loader2, Shield, Zap, AlertTriangle,
  CheckCircle2, FileCode, GitBranch, Play, RotateCcw,
  ChevronDown, ChevronRight, Upload, Search, Github,
  BarChart3, Lock, Bug, Sparkles, Package, Download, Brain
} from "lucide-react";
import { FolderUpload } from "@/components/FolderUpload";
import { useAgentWorkflow, type Improvement, type PlanStep } from "@/hooks/useAgentWorkflow";
import type { UploadedFile } from "@/lib/fileUtils";
import { getLanguageFromPath } from "@/lib/fileUtils";
import { useGitHub } from "@/hooks/useGitHub";
import ReactMarkdown from "react-markdown";

const PRIORITY_COLORS = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const TYPE_ICONS: Record<string, typeof Bug> = {
  security: Shield,
  fix: Bug,
  refactor: Zap,
  performance: BarChart3,
  feature: Sparkles,
  docs: FileCode,
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold text-foreground">{score}/10</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );
}

function WorkflowReasoningBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-primary hover:bg-primary/10 transition-colors"
      >
        <Brain className="w-3.5 h-3.5" />
        <span className="font-medium">Raciocínio do modelo (Chain of Thought)</span>
        {expanded ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>
      {expanded && (
        <div className="px-4 pb-3 text-xs text-muted-foreground max-h-60 overflow-auto whitespace-pre-wrap border-t border-primary/10">
          {content}
        </div>
      )}
    </div>
  );
}

export function WorkflowPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [source, setSource] = useState<"local" | "github" | null>(null);
  const [cloning, setCloning] = useState<string | null>(null);
  const [cloneProgress, setCloneProgress] = useState("");
  const workflow = useAgentWorkflow();
  const github = useGitHub();

  const handleFilesLoaded = useCallback((loaded: UploadedFile[]) => {
    setFiles(loaded);
    setSource("local");
  }, []);

  const handleAnalyze = () => {
    if (files.length === 0) return;
    const rootDir = files[0]?.path.split("/")[0] || "project";
    workflow.analyze(
      files.map(f => ({ path: f.path, content: f.content })),
      rootDir,
    );
  };

  const handleGeneratePlan = () => {
    workflow.generatePlan(files.map(f => ({ path: f.path, content: f.content })));
  };

  const handleGeneratePatch = (step: PlanStep) => {
    workflow.generatePatch(step, files.map(f => ({ path: f.path, content: f.content })));
  };

  const toggleImprovement = (imp: Improvement) => {
    const exists = workflow.selectedImprovements.find(s => s.title === imp.title);
    if (exists) {
      workflow.setSelectedImprovements(workflow.selectedImprovements.filter(s => s.title !== imp.title));
    } else {
      workflow.setSelectedImprovements([...workflow.selectedImprovements, imp]);
    }
  };

  // Step: Select source
  if (workflow.step === "select" && files.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">Workflow do Agente</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Selecione um projeto para analisar, gerar melhorias e aplicar patches.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local upload */}
          <div className="border border-border rounded-xl p-6 bg-card hover:border-primary/40 transition-colors">
            <Upload className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Upload Local</h3>
            <p className="text-xs text-muted-foreground mb-4">Faça upload de uma pasta do seu computador</p>
            <FolderUpload onFilesLoaded={handleFilesLoaded} />
          </div>

          {/* GitHub */}
          <div className="border border-border rounded-xl p-6 bg-card">
            <Github className="w-8 h-8 text-foreground mb-3" />
            <h3 className="font-semibold text-foreground mb-1">GitHub Repository</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {github.isConnected
                ? `Conectado como @${github.user?.login}`
                : "Conecte seu GitHub no Dashboard primeiro"}
            </p>
            {github.isConnected ? (
              <div className="space-y-2 max-h-48 overflow-auto">
                {github.repos.slice(0, 15).map(repo => (
                  <button
                    key={repo.id}
                    disabled={!!cloning}
                    className="w-full text-left px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm text-foreground transition-colors disabled:opacity-50 flex items-center justify-between"
                    onClick={async () => {
                      setCloning(repo.full_name);
                      setCloneProgress("Buscando árvore de arquivos...");
                      try {
                        const tree: { path: string; size: number }[] = await github.callGitHub("tree", {
                          owner: repo.owner.login, repo: repo.name, ref: repo.default_branch,
                        });
                        const skipPatterns = [
                          /node_modules\//,/\.git\//,/dist\//,/build\//,/\.next\//,/vendor\//,
                          /\.png$/i,/\.jpg$/i,/\.jpeg$/i,/\.gif$/i,/\.ico$/i,/\.svg$/i,
                          /\.woff/i,/\.ttf$/i,/\.eot$/i,/\.mp3$/i,/\.mp4$/i,
                          /\.pdf$/i,/\.zip$/i,/\.tar$/i,/\.gz$/i,/\.lock$/,/\.DS_Store/,
                        ];
                        const textFiles = tree.filter((f: { path: string; size: number }) =>
                          f.size < 200_000 && !skipPatterns.some(p => p.test(f.path))
                        );
                        const allFiles: UploadedFile[] = [];
                        const batchSize = 30;
                        for (let i = 0; i < textFiles.length; i += batchSize) {
                          const batch = textFiles.slice(i, i + batchSize);
                          setCloneProgress(`Baixando ${Math.min(i + batchSize, textFiles.length)}/${textFiles.length} arquivos...`);
                          const downloaded: { path: string; content: string }[] = await github.callGitHub("download_files", {
                            owner: repo.owner.login, repo: repo.name,
                            paths: batch.map((f: { path: string }) => f.path), ref: repo.default_branch,
                          });
                          for (const f of downloaded) {
                            allFiles.push({ path: f.path, content: f.content, language: getLanguageFromPath(f.path) });
                          }
                        }
                        setFiles(allFiles);
                        setSource("github");
                        setCloneProgress("");
                      } catch (e) {
                        setCloneProgress(`Erro: ${e instanceof Error ? e.message : "falha ao clonar"}`);
                      } finally {
                        setCloning(null);
                      }
                    }}
                  >
                    <div>
                      <span className="font-medium">{repo.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{repo.language}</span>
                    </div>
                    {cloning === repo.full_name ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                ))}
                {cloneProgress && (
                  <p className="text-xs text-primary px-1 pt-1">{cloneProgress}</p>
                )}
              </div>
            ) : (
              <Link
                to="/dashboard"
                className="text-sm text-primary hover:underline"
              >
                Ir para Dashboard para conectar GitHub →
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header with steps */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflow do Agente</h1>
          <p className="text-xs text-muted-foreground mt-1">{files.length} arquivos carregados</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => workflow.setReasoningEnabled(!workflow.reasoningEnabled)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
              workflow.reasoningEnabled
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
            title="Ativa reasoning (Chain of Thought) com GPT-OSS 120B"
          >
            <Brain className="w-3.5 h-3.5" />
            Reasoning {workflow.reasoningEnabled ? "ON" : "OFF"}
          </button>
          <button onClick={() => { workflow.reset(); setFiles([]); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="w-4 h-4" /> Recomeçar
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {(["select", "analyze", "plan", "patch", "done"] as const).map((s, i) => {
          const labels = { select: "Selecionar", analyze: "Analisar", plan: "Planejar", patch: "Patch", done: "Concluído" };
          const isActive = s === workflow.step;
          const isPast = ["select", "analyze", "plan", "patch", "done"].indexOf(workflow.step) > i;
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                isPast ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 text-primary border-2 border-primary" : "bg-secondary text-muted-foreground"
              }`}>
                {isPast ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{labels[s]}</span>
              {i < 4 && <div className={`flex-1 h-0.5 ${isPast ? "bg-primary" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {workflow.error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {workflow.error}
        </div>
      )}

      {/* Step: Files loaded, ready to analyze */}
      {workflow.step === "select" && files.length > 0 && (
        <div className="text-center py-12">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-foreground font-medium mb-2">{files.length} arquivos carregados</p>
          <p className="text-sm text-muted-foreground mb-6">Clique para iniciar a análise do projeto</p>
          <button
            onClick={handleAnalyze}
            disabled={workflow.isLoading}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {workflow.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Analisar Projeto
          </button>
        </div>
      )}

      {/* Step: Analysis results */}
      {workflow.step === "analyze" && workflow.analysis && (
        <div className="space-y-6">
          {/* Reasoning block */}
          {workflow.reasoningContent && <WorkflowReasoningBlock content={workflow.reasoningContent} />}
          {/* Summary */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-foreground mb-3">📊 Resumo da Análise</h2>
            <p className="text-sm text-muted-foreground">{workflow.analysis.summary}</p>

            {workflow.analysis.stack && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">{workflow.analysis.stack.type}</span>
                {workflow.analysis.stack.framework && <span className="text-xs px-2 py-1 bg-secondary text-muted-foreground rounded-md">{workflow.analysis.stack.framework}</span>}
                {workflow.analysis.stack.language && <span className="text-xs px-2 py-1 bg-secondary text-muted-foreground rounded-md">{workflow.analysis.stack.language}</span>}
              </div>
            )}
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 gap-4">
            {workflow.analysis.structure && <div className="bg-card border border-border rounded-xl p-4"><ScoreBar score={workflow.analysis.structure.score} label="Estrutura" /></div>}
            {workflow.analysis.security && <div className="bg-card border border-border rounded-xl p-4"><ScoreBar score={workflow.analysis.security.score} label="Segurança" /></div>}
            {workflow.analysis.quality && <div className="bg-card border border-border rounded-xl p-4"><ScoreBar score={workflow.analysis.quality.score} label="Qualidade" /></div>}
          </div>

          {/* Security risks */}
          {workflow.analysis.security?.critical && workflow.analysis.security.critical.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-2"><Lock className="w-4 h-4" /> Riscos Críticos</h3>
              <ul className="space-y-1">
                {workflow.analysis.security.critical.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements (selectable) */}
          {workflow.analysis.improvements && workflow.analysis.improvements.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-bold text-foreground mb-3">🔧 Melhorias Sugeridas</h3>
              <p className="text-xs text-muted-foreground mb-4">Selecione as melhorias que deseja aplicar:</p>
              <div className="space-y-2">
                {workflow.analysis.improvements.map((imp, i) => {
                  const selected = workflow.selectedImprovements.some(s => s.title === imp.title);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleImprovement(imp)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{imp.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[imp.priority]}`}>
                              {imp.priority}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {imp.effort}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{imp.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleGeneratePlan}
                disabled={workflow.isLoading || workflow.selectedImprovements.length === 0}
                className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {workflow.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Gerar Plano ({workflow.selectedImprovements.length} selecionadas)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Action Plan */}
      {workflow.step === "plan" && workflow.plan && (
        <div className="space-y-4">
          {workflow.reasoningContent && <WorkflowReasoningBlock content={workflow.reasoningContent} />}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-foreground mb-1">📋 Plano de Ação</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {workflow.plan.steps?.length || 0} passos • ~{workflow.plan.totalEstimatedChanges || "?"} linhas de mudança
            </p>

            <div className="space-y-3">
              {workflow.plan.steps?.map((s) => {
                const Icon = TYPE_ICONS[s.type] || Zap;
                return (
                  <div key={s.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground text-sm">Passo {s.id}: {s.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          s.risk === "high" ? "bg-red-500/15 text-red-400" : s.risk === "medium" ? "bg-yellow-500/15 text-yellow-400" : "bg-green-500/15 text-green-400"
                        }`}>
                          risco {s.risk}
                        </span>
                        <button
                          onClick={() => handleGeneratePatch(s)}
                          disabled={workflow.isLoading}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
                        >
                          {workflow.isLoading ? "Gerando..." : "Gerar Patch"}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.files?.map(f => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded font-mono">{f}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {workflow.plan.rollbackStrategy && (
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Rollback: {workflow.plan.rollbackStrategy}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step: Patch preview */}
      {workflow.step === "patch" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold text-foreground mb-3">🔧 Patch Gerado</h2>

            {Object.keys(workflow.patchedFiles).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(workflow.patchedFiles).map(([path, content]) => (
                  <div key={path} className="border border-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 border-b border-border">
                      <span className="text-xs font-mono text-foreground flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-primary" />
                        {path}
                      </span>
                      <button
                        onClick={() => {
                          setFiles(prev => {
                            const existing = prev.find(f => f.path === path);
                            if (existing) {
                              return prev.map(f => f.path === path ? { ...f, content } : f);
                            }
                            return [...prev, { path, content, language: path.split(".").pop() || "plaintext" }];
                          });
                        }}
                        className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90"
                      >
                        Aplicar
                      </button>
                    </div>
                    <pre className="p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-64 bg-card">
                      {content.slice(0, 2000)}{content.length > 2000 ? "\n... (truncated)" : ""}
                    </pre>
                  </div>
                ))}
              </div>
            ) : workflow.patchContent ? (
              <div className="prose prose-sm prose-invert max-w-none text-foreground">
                <ReactMarkdown>{workflow.patchContent}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum patch gerado ainda.</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => workflow.setStep("plan")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Plano
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {workflow.isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Processando...</p>
            <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
          </div>
        </div>
      )}
    </div>
  );
}
