import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, GitBranch, FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, X, Save, Check, AlertCircle } from "lucide-react";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { mockFileTree, mockFileContents, type FileNode } from "@/data/mockData";

function MiniTree({ node, depth = 0, currentPath }: { node: FileNode; depth?: number; currentPath: string }) {
  const [open, setOpen] = useState(depth < 1);
  const { owner, name } = useParams();

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-secondary/60 rounded transition-colors text-foreground"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          {open ? <FolderOpen className="w-3.5 h-3.5 text-primary" /> : <Folder className="w-3.5 h-3.5 text-primary" />}
          <span>{node.name}</span>
        </button>
        {open && node.children?.map((c) => (
          <MiniTree key={c.path} node={c} depth={depth + 1} currentPath={currentPath} />
        ))}
      </div>
    );
  }

  const active = node.path === currentPath;
  return (
    <Link
      to={`/editor/${owner}/${name}?path=${encodeURIComponent(node.path)}`}
      className={`flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded transition-colors ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      }`}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
    >
      <FileCode className="w-3.5 h-3.5" />
      <span>{node.name}</span>
    </Link>
  );
}

function getLanguage(path: string): string {
  if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".jsx") || path.endsWith(".js")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".py")) return "python";
  return "plaintext";
}

export function EditorPage() {
  const { owner, name } = useParams();
  const [searchParams] = useSearchParams();
  const filePath = searchParams.get("path") || "";

  const [tabs, setTabs] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [commitMsg, setCommitMsg] = useState("Update via LovHub");
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    if (!filePath) return;
    const c = mockFileContents[filePath] || `// ${filePath}\n// No content loaded (mock)`;
    setContent(c);
    setOriginalContent(c);
    setCommitted(false);
    if (!tabs.includes(filePath)) {
      setTabs((t) => [...t, filePath]);
    }
  }, [filePath]);

  const modified = content !== originalContent;
  const fileName = filePath.split("/").pop() || "";
  const language = getLanguage(filePath);

  const handleCommit = () => {
    setOriginalContent(content);
    setCommitted(true);
    setTimeout(() => setCommitted(false), 2500);
  };

  const closeTab = (tab: string) => {
    setTabs((t) => t.filter((x) => x !== tab));
  };

  return (
    <div className="flex h-full">
      {/* Mini sidebar */}
      <div className="w-56 border-r border-border bg-sidebar flex flex-col">
        <div className="h-10 flex items-center gap-2 px-3 border-b border-sidebar-border">
          <Link to={`/repo/${owner}/${name}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <span className="text-xs font-semibold text-foreground truncate">{name}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch className="w-3 h-3" /> main
          </span>
        </div>
        <div className="flex-1 overflow-auto py-1">
          {mockFileTree.map((n) => (
            <MiniTree key={n.path} node={n} currentPath={filePath} />
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs bar */}
        <div className="h-9 flex items-center border-b border-border bg-card overflow-x-auto">
          {tabs.map((tab) => {
            const active = tab === filePath;
            const tabName = tab.split("/").pop() || tab;
            return (
              <Link
                key={tab}
                to={`/editor/${owner}/${name}?path=${encodeURIComponent(tab)}`}
                className={`flex items-center gap-2 px-3 h-full text-xs border-r border-border transition-colors ${
                  active
                    ? "bg-editor-bg text-foreground border-t-2 border-t-primary"
                    : "text-muted-foreground hover:text-foreground bg-card"
                }`}
              >
                <FileCode className="w-3 h-3" />
                {tabName}
                {tab === filePath && modified && <span className="w-2 h-2 rounded-full bg-warning" />}
                <button
                  onClick={(e) => { e.preventDefault(); closeTab(tab); }}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </Link>
            );
          })}
        </div>

        {/* Monaco Editor */}
        {filePath ? (
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={content}
              onChange={(v) => setContent(v || "")}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: true },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                renderLineHighlight: "gutter",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Selecione um arquivo</p>
          </div>
        )}

        {/* Commit bar */}
        {filePath && (
          <div className="h-14 flex items-center gap-3 px-4 border-t border-border bg-card">
            <input
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Mensagem do commit..."
              className="flex-1 bg-input border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleCommit}
              disabled={!modified && !committed}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                committed
                  ? "bg-accent text-accent-foreground"
                  : modified
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
            >
              {committed ? (
                <>
                  <Check className="w-4 h-4" /> Committed!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Commit & Push
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
