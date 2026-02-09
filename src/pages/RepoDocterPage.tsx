import { useState, useCallback } from "react";
import { GitBranch, Upload, FolderGit2, Loader2, FileCode, ChevronRight, ChevronDown, Folder, FolderOpen, Play, TestTube, Rocket, Download, ExternalLink } from "lucide-react";
import { AgentConnector, useAgentUrl } from "@/components/AgentConnector";

interface ProjectInfo {
  project_id: string;
  files_count: number;
  stack: { type: string; signals: string[] };
}

interface FileTreeItem {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileTreeItem[];
}

function buildTree(paths: string[]): FileTreeItem[] {
  const root: FileTreeItem[] = [];
  for (const p of paths) {
    const parts = p.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');
      let node = current.find(n => n.name === name);
      if (!node) {
        node = { name, path, type: isFile ? 'file' : 'dir', children: isFile ? undefined : [] };
        current.push(node);
      }
      if (!isFile && node.children) current = node.children;
    }
  }
  return root;
}

function TreeNode({ node, onSelect, selectedPath, depth = 0 }: { node: FileTreeItem; onSelect: (p: string) => void; selectedPath: string; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === "dir") {
    return (
      <div>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-secondary/60 rounded transition-colors text-foreground" style={{ paddingLeft: `${depth * 12 + 8}px` }}>
          {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          {open ? <FolderOpen className="w-3.5 h-3.5 text-primary" /> : <Folder className="w-3.5 h-3.5 text-primary" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children?.map(c => <TreeNode key={c.path} node={c} onSelect={onSelect} selectedPath={selectedPath} depth={depth + 1} />)}
      </div>
    );
  }

  return (
    <button onClick={() => onSelect(node.path)} className={`flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded transition-colors ${node.path === selectedPath ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`} style={{ paddingLeft: `${depth * 12 + 22}px` }}>
      <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function RepoDocterPage() {
  const agentUrl = useAgentUrl();
  const [agentConnected, setAgentConnected] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"import" | "files" | "logs">("import");

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const importGitHub = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    addLog(`Clonando ${repoUrl} (branch: ${branch})...`);
    try {
      const r = await fetch(`${agentUrl}/v1/import/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl, branch, token: token || undefined }),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setProject(data);
      addLog(`✅ Projeto importado: ${data.project_id} (${data.files_count} arquivos, stack: ${data.stack.type})`);
      // Load tree
      await loadTree(data.project_id);
      setActiveTab("files");
    } catch (e: any) {
      addLog(`❌ Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTree = async (pid: string) => {
    try {
      const r = await fetch(`${agentUrl}/v1/project/tree?project_id=${pid}`);
      const data = await r.json();
      setFiles(data.files);
      addLog(`📂 ${data.files.length} arquivos indexados`);
    } catch (e: any) {
      addLog(`❌ Erro ao listar: ${e.message}`);
    }
  };

  const loadFile = async (path: string) => {
    if (!project) return;
    setSelectedPath(path);
    try {
      const r = await fetch(`${agentUrl}/v1/project/file?project_id=${project.project_id}&path=${encodeURIComponent(path)}`);
      const data = await r.json();
      setFileContent(data.content);
    } catch (e: any) {
      setFileContent(`// Erro ao ler: ${e.message}`);
    }
  };

  const runTests = async () => {
    if (!project) return;
    setLoading(true);
    addLog("🧪 Rodando testes...");
    try {
      const r = await fetch(`${agentUrl}/v1/tests/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: project.project_id }),
      });
      const data = await r.json();
      if (data.ok) {
        addLog(`✅ Testes passaram (${data.stack})`);
      } else {
        addLog(`❌ Testes falharam: ${data.error}`);
      }
      if (data.logs) addLog(data.logs.slice(-2000));
    } catch (e: any) {
      addLog(`❌ Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pushGitHub = async () => {
    if (!project) return;
    setLoading(true);
    addLog("🚀 Preparando push...");
    try {
      const r = await fetch(`${agentUrl}/v1/github/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.project_id,
          branch: `infinity/${Date.now()}`,
          message: "Infinity: apply AI changes",
          token: token || undefined,
        }),
      });
      const data = await r.json();
      addLog(`✅ Push realizado: ${JSON.stringify(data)}`);
    } catch (e: any) {
      addLog(`❌ Erro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tree = buildTree(files);

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <FolderGit2 className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Repo Doctor</span>
          {project && (
            <span className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full">
              {project.stack.type} • {project.files_count} arquivos
            </span>
          )}
        </div>
        <AgentConnector onStatusChange={setAgentConnected} />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-card">
        {(["import", "files", "logs"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "import" ? "📥 Importar" : tab === "files" ? "📂 Arquivos" : "📋 Logs"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="p-6 max-w-lg mx-auto space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">URL do Repositório GitHub</label>
              <input
                type="text"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="https://github.com/user/repo"
                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-foreground block mb-1">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-foreground block mb-1">Token (opcional)</label>
                <input
                  type="password"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <button
              onClick={importGitHub}
              disabled={loading || !agentConnected || !repoUrl.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
              Importar Repositório
            </button>

            {!agentConnected && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                ⚠️ Agente local offline. Rode: <code className="bg-secondary px-1 rounded">python agent.py</code>
              </div>
            )}

            {/* Actions */}
            {project && (
              <div className="pt-4 border-t border-border space-y-2">
                <h3 className="text-xs font-semibold text-foreground mb-2">Ações do Projeto</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={runTests} disabled={loading} className="flex items-center gap-2 text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
                    <TestTube className="w-3.5 h-3.5" /> Rodar Testes
                  </button>
                  <button onClick={pushGitHub} disabled={loading} className="flex items-center gap-2 text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
                    <Rocket className="w-3.5 h-3.5" /> Push / PR
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === "files" && (
          <div className="flex h-full">
            <div className="w-56 border-r border-border overflow-auto py-1">
              {tree.map(n => <TreeNode key={n.path} node={n} onSelect={loadFile} selectedPath={selectedPath} />)}
              {files.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">Importe um projeto primeiro</p>}
            </div>
            <div className="flex-1 overflow-auto">
              {selectedPath ? (
                <div>
                  <div className="h-9 flex items-center px-3 border-b border-border bg-secondary/30">
                    <FileCode className="w-3.5 h-3.5 text-accent mr-2" />
                    <span className="text-xs font-mono text-foreground">{selectedPath}</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-foreground whitespace-pre-wrap">{fileContent}</pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-8 text-center">Selecione um arquivo</p>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div className="p-4 overflow-auto h-full">
            <div className="bg-editor-bg rounded-lg p-4 font-mono text-xs space-y-1 max-h-full overflow-auto">
              {logs.length === 0 && <p className="text-muted-foreground">Nenhum log ainda...</p>}
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes("❌") ? "text-red-400" : log.includes("✅") ? "text-green-400" : "text-foreground"}`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
