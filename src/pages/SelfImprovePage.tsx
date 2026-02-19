import { useState, useCallback, useRef, useEffect } from "react";
import { 
  Send, Bot, User, Loader2, Sparkles, Brain, Archive, 
  RotateCcw, Clock, Trash2, Plus, CheckCircle2, AlertCircle,
  FolderOpen, RefreshCw, Save
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useModel } from "@/contexts/ModelContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BackupMeta {
  project_id: string;
  backup_id: string;
  label: string;
  created_at: string;
  files_count: number;
}

interface ProjectFile {
  path: string;
  content: string;
}

const DAEMON_URL = "http://127.0.0.1:8787";

export function SelfImprovePage() {
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<string[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const { selectedModel } = useModel();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Check daemon health and list projects
  const checkDaemon = useCallback(async () => {
    try {
      const resp = await fetch(`${DAEMON_URL}/health`);
      if (!resp.ok) throw new Error("Daemon not running");
      setConnected(true);
      
      // Try to discover projects from workdir
      const health = await resp.json();
      const workdir = health.workdir;
      
      // List projects via tree endpoint trial
      // We'll try a known project or scan
      setStatus("Daemon conectado ✓");
    } catch {
      setConnected(false);
      setError("Daemon local não encontrado em 127.0.0.1:8787. Rode: python agent/agent.py");
    }
  }, []);

  useEffect(() => { checkDaemon(); }, [checkDaemon]);

  const loadProject = useCallback(async (pid: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const resp = await fetch(`${DAEMON_URL}/v1/project/tree?project_id=${pid}`);
      if (!resp.ok) throw new Error(`Projeto '${pid}' não encontrado`);
      const data = await resp.json();
      
      // Load file contents in batches
      const allFiles: ProjectFile[] = [];
      const filePaths: string[] = data.files || [];
      
      // Filter to code files only
      const codeExts = /\.(tsx?|jsx?|py|rs|go|java|rb|php|css|scss|html|json|ya?ml|toml|md|sql|sh|vue|svelte)$/i;
      const codePaths = filePaths.filter(p => codeExts.test(p));
      
      // Batch read
      const batchSize = 30;
      for (let i = 0; i < codePaths.length; i += batchSize) {
        const batch = codePaths.slice(i, i + batchSize);
        const batchResp = await fetch(`${DAEMON_URL}/v1/project/files-batch?project_id=${pid}&paths=${batch.join(",")}`);
        if (batchResp.ok) {
          const batchData = await batchResp.json();
          allFiles.push(...(batchData.files || []));
        }
      }
      
      setFiles(allFiles);
      setProjectId(pid);
      setStatus(`Projeto "${pid}" carregado: ${allFiles.length} arquivos`);
      
      // Load backups
      loadBackups(pid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar projeto");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadBackups = useCallback(async (pid: string) => {
    try {
      const resp = await fetch(`${DAEMON_URL}/v1/backup/list?project_id=${pid}`);
      if (resp.ok) {
        const data = await resp.json();
        setBackups(data.backups || []);
      }
    } catch { /* ignore */ }
  }, []);

  const createBackup = useCallback(async (label?: string) => {
    if (!projectId) return;
    try {
      setStatus("Criando backup...");
      const resp = await fetch(`${DAEMON_URL}/v1/backup/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, label: label || "manual" }),
      });
      if (!resp.ok) throw new Error("Falha ao criar backup");
      const meta = await resp.json();
      setBackups(prev => [meta, ...prev]);
      setStatus(`Backup criado: ${meta.backup_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no backup");
    }
  }, [projectId]);

  const restoreBackup = useCallback(async (backupId: string) => {
    if (!projectId) return;
    if (!confirm("Restaurar este backup? Um backup automático será criado antes.")) return;
    try {
      setStatus("Restaurando backup...");
      const resp = await fetch(`${DAEMON_URL}/v1/backup/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, backup_id: backupId }),
      });
      if (!resp.ok) throw new Error("Falha ao restaurar");
      const data = await resp.json();
      setStatus(`Restaurado! ${data.files_restored} arquivos`);
      // Reload project
      loadProject(projectId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao restaurar");
    }
  }, [projectId, loadProject]);

  const deleteBackup = useCallback(async (backupId: string) => {
    if (!confirm("Deletar este backup permanentemente?")) return;
    try {
      await fetch(`${DAEMON_URL}/v1/backup/delete?backup_id=${backupId}`, { method: "DELETE" });
      setBackups(prev => prev.filter(b => b.backup_id !== backupId));
    } catch { /* ignore */ }
  }, []);

  const applyFileEdits = useCallback(async (content: string) => {
    const regex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
    let match;
    const edits: { path: string; content: string }[] = [];
    while ((match = regex.exec(content)) !== null) {
      edits.push({ path: match[1].trim(), content: match[2] });
    }
    if (edits.length === 0) return;

    // Auto backup before applying
    await createBackup("pre-ai-edit");

    // Write files via daemon
    try {
      const resp = await fetch(`${DAEMON_URL}/v1/project/write-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, files: edits }),
      });
      if (!resp.ok) throw new Error("Falha ao escrever arquivos");
      const data = await resp.json();
      setStatus(`✅ ${data.written?.length || 0} arquivos modificados`);

      // Update local file state
      setFiles(prev => {
        const updated = [...prev];
        for (const edit of edits) {
          const idx = updated.findIndex(f => f.path === edit.path);
          if (idx >= 0) {
            updated[idx] = { path: edit.path, content: edit.content };
          } else {
            updated.push({ path: edit.path, content: edit.content });
          }
        }
        return updated;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao aplicar alterações");
    }
  }, [projectId, createBackup]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !projectId) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Build context with project files
    const filesContext: Record<string, string> = {};
    files.forEach(f => { filesContext[f.path] = f.content; });

    try {
      let response: Response;

      {
        const systemPrompt = buildSystemPrompt(filesContext);
        response = await fetch(`${selectedModel.baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "local-model",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: input },
            ],
            stream: true,
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error: ${response.status}`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: "assistant", content: assistantContent };
                return newMsgs;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Auto-apply file edits from the AI response
      if (assistantContent.includes("```filepath:")) {
        await applyFileEdits(assistantContent);
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${e instanceof Error ? e.message : "Erro"}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, projectId, files, messages, selectedModel, applyFileEdits]);

  const buildSystemPrompt = (filesObj: Record<string, string>) => {
    let prompt = `You are a senior developer that IMPROVES and MODIFIES existing projects.
You have FULL ACCESS to write files directly to the project on disk.

CRITICAL RULES:
- ALWAYS generate COMPLETE, PRODUCTION-READY file content
- NEVER use mock data or placeholders
- When modifying a file, output the COMPLETE updated content
- Preserve existing functionality unless explicitly changing it
- Follow existing code style and conventions

FORMAT FOR FILE EDITS (these will be written to disk automatically):
\`\`\`filepath:path/to/file.ext
// complete file content here
\`\`\`

WORKFLOW:
1. Analyze the user's request
2. Identify which files need changes
3. Output the complete updated file(s) using the filepath format
4. Explain what you changed and why

CURRENT PROJECT FILES:`;

    const entries = Object.entries(filesObj);
    // Send only first ~50 files to avoid token limits
    const limited = entries.slice(0, 50);
    for (const [path, content] of limited) {
      prompt += `\n\n--- ${path} ---\n${content.slice(0, 2000)}${content.length > 2000 ? "\n... (truncated)" : ""}`;
    }
    if (entries.length > 50) {
      prompt += `\n\n... and ${entries.length - 50} more files`;
    }
    return prompt;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Project ID input
  if (!projectId) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Melhorias & Alterações</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Conecte a um projeto no Daemon local para a IA fazer alterações diretas nos arquivos
            </p>
          </div>

          {!connected && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Daemon local não encontrado. Rode: <code className="bg-destructive/20 px-1 rounded">python agent/agent.py</code>
            </div>
          )}

          {connected && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">ID do Projeto (pasta em ~/.infinity_agent/projects/)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="nome-do-projeto"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      loadProject((e.target as HTMLInputElement).value.trim());
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const el = document.querySelector<HTMLInputElement>('input[placeholder="nome-do-projeto"]');
                    if (el?.value.trim()) loadProject(el.value.trim());
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use o mesmo ID do projeto importado via GitHub ou ZIP no Daemon
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Melhorias & Alterações</span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {projectId} • {files.length} arquivos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => createBackup()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Criar Backup
            </button>
            <button
              onClick={() => setShowBackups(!showBackups)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors ${
                showBackups ? "bg-primary/15 text-primary" : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Backups ({backups.length})
            </button>
            <button
              onClick={() => loadProject(projectId)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Recarregar projeto"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status/Error bar */}
        {(status || error) && (
          <div className={`px-4 py-2 text-xs flex items-center gap-2 ${
            error ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}>
            {error ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {error || status}
            <button onClick={() => { setError(null); setStatus(null); }} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Pronto para melhorar seu projeto</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Peça melhorias, refatorações, novos recursos, correções de bugs...
                A IA vai gerar o código e aplicar diretamente nos arquivos do projeto.
                Backups são criados automaticamente antes de cada alteração.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2 max-w-lg mx-auto">
                {[
                  "Refatore o código para melhor organização",
                  "Adicione tratamento de erros nos endpoints",
                  "Crie testes unitários para os componentes",
                  "Otimize a performance do projeto",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left text-xs p-3 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-accent" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="bg-secondary/50 rounded-lg px-4 py-3 text-sm text-muted-foreground">
                Pensando...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva a melhoria ou alteração..."
              rows={2}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            ⚡ Usando: {selectedModel.name} • Backups automáticos antes de cada alteração
          </p>
        </div>
      </div>

      {/* Backups Panel */}
      {showBackups && (
        <div className="w-80 border-l border-border bg-card flex flex-col">
          <div className="h-12 flex items-center justify-between px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Backups</span>
            </div>
            <button onClick={() => createBackup()} className="text-primary hover:text-primary/80">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {backups.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum backup ainda</p>
            ) : (
              backups.map((b) => (
                <div key={b.backup_id} className="rounded-lg bg-secondary/40 p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-foreground">{b.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(b.created_at).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{b.files_count} arquivos</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => restoreBackup(b.backup_id)}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restaurar
                    </button>
                    <button
                      onClick={() => deleteBackup(b.backup_id)}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
