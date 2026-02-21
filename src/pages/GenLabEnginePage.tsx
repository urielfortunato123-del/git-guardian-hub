import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FlaskConical, Play, Download, RefreshCw, Loader2, CheckCircle2,
  XCircle, FolderOpen, FileCode, Cpu, ArrowRight, Terminal, Zap,
  Package, Wrench, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import {
  analyzeProject, recreateProject, listGeneratedProjects, runProject,
  buildInstaller, autoFixProject, checkAgentHealth, setLLMConfig,
  type ProjectAnalysis, type GeneratedProject
} from "@/services/genlab-api";

type PipelineStep = "idle" | "analyzing" | "recreating" | "done" | "error";

export function GenLabEnginePage() {
  const [projectId, setProjectId] = useState("");
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [step, setStep] = useState<PipelineStep>("idle");
  const [generatedProjects, setGeneratedProjects] = useState<GeneratedProject[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [runningProject, setRunningProject] = useState<string | null>(null);
  const [buildingProject, setBuildingProject] = useState<string | null>(null);
  const [fixingProject, setFixingProject] = useState<string | null>(null);
  const [agentOnline, setAgentOnline] = useState<boolean | null>(null);

  // LLM config state
  const [llmProvider, setLlmProvider] = useState("ollama");
  const [llmModel, setLlmModel] = useState("gemma3");
  const [llmUrl, setLlmUrl] = useState("http://127.0.0.1:11434/v1");

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Check agent on mount
  useEffect(() => {
    checkAgentHealth().then(setAgentOnline);
    listGeneratedProjects().then(setGeneratedProjects).catch(() => {});
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const projects = await listGeneratedProjects();
      setGeneratedProjects(projects);
    } catch {
      // offline
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!projectId.trim()) { toast.error("Informe o ID do projeto"); return; }
    setStep("analyzing");
    setAnalysis(null);
    addLog(`Analisando projeto: ${projectId}`);
    try {
      const data = await analyzeProject(projectId);
      setAnalysis(data);
      setStep("idle");
      addLog(`✅ Tipo: ${data.project_type} | Frameworks: ${data.frameworks.join(", ")}`);
      toast.success(`Classificado: ${data.project_type}`);
    } catch (e: any) {
      setStep("error");
      addLog(`❌ ${e.message}`);
      toast.error("Falha. Verifique se o agent está rodando.");
    }
  }, [projectId, addLog]);

  const handleRecreate = useCallback(async () => {
    if (!projectId.trim()) return;
    setStep("recreating");
    addLog(`🧬 Recriando: ${projectId}`);
    try {
      const data = await recreateProject(projectId);
      if (data.ok) {
        setStep("done");
        addLog(`✅ Recriado: ${data.count} arquivos`);
        toast.success(`${data.count} arquivos gerados!`);
        fetchProjects();
      } else { throw new Error(data.error || "Falha"); }
    } catch (e: any) {
      setStep("error");
      addLog(`❌ ${e.message}`);
      toast.error("Falha na recriação.");
    }
  }, [projectId, addLog, fetchProjects]);

  const handleRun = useCallback(async (name: string) => {
    setRunningProject(name);
    addLog(`▶️ Executando: ${name}`);
    try {
      const data = await runProject(name);
      if (data.ok) {
        addLog(`✅ Rodando (${data.mode})`);
        toast.success(`Iniciado: ${data.mode}`);
      } else {
        addLog(`❌ ${data.error}`);
        toast.error(data.error || "Falha");
      }
    } catch (e: any) { addLog(`❌ ${e.message}`); toast.error("Erro"); }
    finally { setRunningProject(null); }
  }, [addLog]);

  const handleBuild = useCallback(async (name: string) => {
    setBuildingProject(name);
    addLog(`📦 Gerando instalador: ${name}`);
    try {
      const data = await buildInstaller(name);
      if (data.ok) {
        addLog(`✅ Instalador gerado (${data.target})`);
        toast.success(`Instalador criado: ${data.target}`);
      } else {
        addLog(`❌ ${data.error}`);
        toast.error(data.error || "Falha no build");
      }
    } catch (e: any) { addLog(`❌ ${e.message}`); toast.error("Erro no build"); }
    finally { setBuildingProject(null); }
  }, [addLog]);

  const handleAutoFix = useCallback(async (name: string) => {
    setFixingProject(name);
    addLog(`🔧 Auto-fix: ${name}`);
    try {
      const data = await autoFixProject(name);
      if (data.ok) {
        addLog(`✅ ${data.fixes_applied} correções aplicadas`);
        if (data.errors_found && data.errors_found.length > 0) {
          addLog(`Erros encontrados: ${data.errors_found.join("; ").slice(0, 200)}`);
        }
        toast.success(`${data.fixes_applied} correções!`);
      } else {
        addLog(`❌ ${data.error}`);
        toast.error(data.error || "Falha no auto-fix");
      }
    } catch (e: any) { addLog(`❌ ${e.message}`); toast.error("Erro"); }
    finally { setFixingProject(null); }
  }, [addLog]);

  const handleSaveLLMConfig = useCallback(async () => {
    try {
      await setLLMConfig({ provider: llmProvider, model: llmModel, base_url: llmUrl });
      toast.success("Configuração salva!");
      addLog(`⚙️ LLM: ${llmProvider}/${llmModel}`);
    } catch { toast.error("Falha ao salvar config"); }
  }, [llmProvider, llmModel, llmUrl, addLog]);

  const typeColors: Record<string, string> = {
    "react-app": "text-blue-400 bg-blue-400/10",
    "vue-app": "text-green-400 bg-green-400/10",
    "angular-app": "text-red-400 bg-red-400/10",
    "node-backend": "text-emerald-400 bg-emerald-400/10",
    "python-backend": "text-yellow-400 bg-yellow-400/10",
    "chrome-extension": "text-orange-400 bg-orange-400/10",
    "docker-project": "text-cyan-400 bg-cyan-400/10",
    "unknown": "text-muted-foreground bg-muted",
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <FlaskConical className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">GenLab Engine</h1>
            <p className="text-sm text-muted-foreground">Software nasce aqui — Importar, Analisar, Recriar, Rodar</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${agentOnline ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${agentOnline ? "bg-accent" : "bg-destructive"}`} />
            Agent {agentOnline ? "Online" : "Offline"}
          </span>
          <Link to="/templates" className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Templates
          </Link>
        </div>
      </div>

      {/* Pipeline Card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Pipeline de Recriação
        </h2>
        <div className="flex gap-3">
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="ID do projeto (ex: meu-projeto)"
            className="flex-1 bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleAnalyze}
            disabled={step === "analyzing" || step === "recreating"}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {step === "analyzing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            Analisar
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StepBadge label="Importar" active={!!projectId} done={!!analysis} />
          <ArrowRight className="w-3 h-3" />
          <StepBadge label="Analisar" active={step === "analyzing"} done={!!analysis} />
          <ArrowRight className="w-3 h-3" />
          <StepBadge label="Classificar" active={false} done={!!analysis} />
          <ArrowRight className="w-3 h-3" />
          <StepBadge label="Recriar" active={step === "recreating"} done={step === "done"} />
          <ArrowRight className="w-3 h-3" />
          <StepBadge label="Rodar" active={false} done={false} />
        </div>

        {/* Analysis */}
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[analysis.project_type] || typeColors.unknown}`}>
                  {analysis.project_type}
                </span>
                <span className="text-xs text-muted-foreground">{analysis.file_count} arquivos</span>
              </div>
              <div className="flex items-center gap-1.5">
                {analysis.has_frontend && <span className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 rounded">Frontend</span>}
                {analysis.has_backend && <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 rounded">Backend</span>}
                {analysis.has_docker && <span className="px-2 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 rounded">Docker</span>}
                {analysis.has_tests && <span className="px-2 py-0.5 text-[10px] bg-purple-500/10 text-purple-400 rounded">Tests</span>}
              </div>
            </div>
            {analysis.frameworks.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">Frameworks:</span> {analysis.frameworks.join(", ")}
              </p>
            )}
            <button
              onClick={handleRecreate}
              disabled={step === "recreating"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {step === "recreating" ? <><Loader2 className="w-4 h-4 animate-spin" /> Recriando...</> : <><RefreshCw className="w-4 h-4" /> Recriar Projeto Local</>}
            </button>
          </motion.div>
        )}
        {step === "done" && <div className="flex items-center gap-2 text-sm text-accent"><CheckCircle2 className="w-4 h-4" /> Projeto recriado!</div>}
        {step === "error" && <div className="flex items-center gap-2 text-sm text-destructive"><XCircle className="w-4 h-4" /> Erro. Verifique logs.</div>}
      </div>

      {/* Generated Projects */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" /> Projetos Gerados
          </h2>
          <button onClick={fetchProjects} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Atualizar
          </button>
        </div>
        {generatedProjects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum projeto gerado ainda.</p>
        ) : (
          <div className="space-y-2">
            {generatedProjects.map((proj) => (
              <div key={proj.name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{proj.name}</p>
                    <p className="text-xs text-muted-foreground">{proj.file_count} arquivos</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAutoFix(proj.name)}
                    disabled={fixingProject === proj.name}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500/10 text-yellow-400 rounded-md text-xs font-medium hover:bg-yellow-500/20 disabled:opacity-50"
                  >
                    {fixingProject === proj.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                    Fix
                  </button>
                  <button
                    onClick={() => handleRun(proj.name)}
                    disabled={runningProject === proj.name}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-accent/10 text-accent rounded-md text-xs font-medium hover:bg-accent/20 disabled:opacity-50"
                  >
                    {runningProject === proj.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Rodar
                  </button>
                  <button
                    onClick={() => handleBuild(proj.name)}
                    disabled={buildingProject === proj.name}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary rounded-md text-xs font-medium hover:bg-primary/20 disabled:opacity-50"
                  >
                    {buildingProject === proj.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                    Instalador
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary text-foreground rounded-md text-xs font-medium hover:bg-secondary/80">
                    <Download className="w-3 h-3" /> ZIP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LLM Config */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" /> Configuração IA Local
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Provider</label>
            <select value={llmProvider} onChange={e => setLlmProvider(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="ollama">Ollama</option>
              <option value="lmstudio">LM Studio</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Modelo</label>
            <input value={llmModel} onChange={e => setLlmModel(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Base URL</label>
            <input value={llmUrl} onChange={e => setLlmUrl(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
        </div>
        <button onClick={handleSaveLLMConfig} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90">
          Salvar Configuração
        </button>
      </div>

      {/* Logs */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" /> Logs
        </h2>
        <div className="bg-secondary/50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-0.5">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">Aguardando ações...</p>
          ) : (
            logs.map((log, i) => <p key={i} className="text-muted-foreground">{log}</p>)
          )}
        </div>
      </div>
    </div>
  );
}


function StepBadge({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <span className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
      done ? "bg-accent/20 text-accent" : active ? "bg-primary/20 text-primary animate-pulse" : "bg-secondary text-muted-foreground"
    }`}>
      {done && <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" />}
      {label}
    </span>
  );
}
