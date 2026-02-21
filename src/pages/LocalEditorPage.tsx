import { useState, useCallback } from "react";
import { ArrowLeft, FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, Upload, Trash2, Download, Loader2, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FolderUpload } from "@/components/FolderUpload";
import { AIChat } from "@/components/AIChat";
import { buildFileTree, type UploadedFile, type FileTreeNode } from "@/lib/fileUtils";
import { PlatformConverter, type PlatformTarget } from "@/components/PlatformConverter";

function MiniTree({ node, depth = 0, selectedPath, onSelect }: { 
  node: FileTreeNode; 
  depth?: number; 
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);

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
          <span className="truncate">{node.name}</span>
        </button>
        {open && node.children?.map((c) => (
          <MiniTree key={c.path} node={c} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  const active = node.path === selectedPath;
  return (
    <button
      onClick={() => onSelect(node.path)}
      className={`flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded transition-colors ${
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      }`}
      style={{ paddingLeft: `${depth * 12 + 22}px` }}
    >
      <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function LocalEditorPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [showUpload, setShowUpload] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [conversionTarget, setConversionTarget] = useState<PlatformTarget | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const fileTree = buildFileTree(files);
  const selectedFile = files.find(f => f.path === selectedPath);

  const handleFilesLoaded = useCallback((loadedFiles: UploadedFile[]) => {
    setFiles(loadedFiles);
    setShowUpload(false);
    if (loadedFiles.length > 0) {
      setSelectedPath(loadedFiles[0].path);
    }
  }, []);

  const handleFileUpdate = useCallback((path: string, content: string) => {
    setFiles(prev => {
      const existing = prev.find(f => f.path === path);
      if (existing) {
        return prev.map(f => f.path === path ? { ...f, content } : f);
      }
      return [...prev, { path, content, language: path.split('.').pop() || 'plaintext' }];
    });
    setSelectedPath(path);
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (selectedPath && value !== undefined) {
      setFiles(prev => prev.map(f => 
        f.path === selectedPath ? { ...f, content: value } : f
      ));
    }
  }, [selectedPath]);

  const clearFiles = () => {
    setFiles([]);
    setSelectedPath("");
    setShowUpload(true);
  };

  const downloadAsZip = useCallback(async () => {
    if (files.length === 0) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const firstPath = files[0].path;
      const rootFolder = firstPath.includes('/') ? firstPath.split('/')[0] : 'project';
      for (const file of files) {
        zip.file(file.path, file.content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${rootFolder}-edited.zip`);
    } catch (error) {
      console.error("Error creating zip:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [files]);

  const handleConvert = useCallback((platform: PlatformTarget) => {
    setIsConverting(true);
    setConversionTarget(platform);
    setShowConverter(false);
  }, []);

  const handleConversionDone = useCallback(() => {
    setIsConverting(false);
    setConversionTarget(null);
  }, []);

  const loadExampleProject = useCallback(() => {
    const exampleFiles: UploadedFile[] = [
      { path: "src/App.tsx", content: `import { useState } from "react";\nimport "./App.css";\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="app">\n      <h1>Hello World</h1>\n      <p>Welcome to my React app!</p>\n      <div className="card">\n        <button onClick={() => setCount(c => c + 1)}>\n          Count: {count}\n        </button>\n      </div>\n    </div>\n  );\n}\n\nexport default App;`, language: "typescript" },
      { path: "src/main.tsx", content: `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`, language: "typescript" },
      { path: "src/App.css", content: `.app {\n  text-align: center;\n  padding: 2rem;\n}\n\n.card {\n  margin-top: 1rem;\n}\n\nbutton {\n  padding: 0.5rem 1rem;\n  font-size: 1rem;\n  border-radius: 8px;\n  border: 1px solid #646cff;\n  background: #1a1a2e;\n  color: #fff;\n  cursor: pointer;\n}\n\nbutton:hover {\n  background: #646cff;\n}`, language: "css" },
      { path: "src/index.css", content: `body {\n  margin: 0;\n  font-family: -apple-system, sans-serif;\n  background: #0f0f1a;\n  color: #fff;\n}`, language: "css" },
      { path: "package.json", content: `{\n  "name": "hello-react",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-react": "^4.0.0",\n    "vite": "^5.0.0"\n  }\n}`, language: "json" },
      { path: "index.html", content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Hello React</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>`, language: "html" },
      { path: "vite.config.ts", content: `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()],\n});`, language: "typescript" },
    ];
    handleFilesLoaded(exampleFiles);
  }, [handleFilesLoaded]);

  if (showUpload) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Editor Local + AI</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Faça upload de uma pasta e use AI para editar seus arquivos
            </p>
          </div>
          <FolderUpload onFilesLoaded={handleFilesLoaded} />
          <button
            onClick={loadExampleProject}
            className="w-full mt-3 py-2.5 px-4 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-sm text-foreground font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FileCode className="w-4 h-4 text-primary" />
            Criar projeto de exemplo (Hello React)
          </button>
          <Link to="/dashboard" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Platform Converter Dialog */}
      <PlatformConverter
        open={showConverter}
        onOpenChange={setShowConverter}
        onConvert={handleConvert}
        isConverting={isConverting}
        hasFiles={files.length > 0}
      />

      {/* File tree sidebar */}
      <div className="w-56 border-r border-border bg-sidebar flex flex-col">
        <div className="h-10 flex items-center justify-between px-3 border-b border-sidebar-border">
          <span className="text-xs font-semibold text-foreground truncate">
            {files.length} arquivos
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowConverter(true)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Converter para outra plataforma"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={downloadAsZip}
              disabled={isDownloading}
              className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              title="Download como ZIP"
            >
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
            <button 
              onClick={clearFiles}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Limpar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto py-1">
          {fileTree.map((n) => (
            <MiniTree 
              key={n.path} 
              node={n} 
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col">
        {selectedFile && (
          <div className="h-9 flex items-center border-b border-border bg-card px-3">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <FileCode className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono">{selectedFile.path}</span>
            </div>
          </div>
        )}

        <div className="flex-1">
          {selectedFile ? (
            <Editor
              height="100%"
              language={selectedFile.language}
              theme="vs-dark"
              value={selectedFile.content}
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: true },
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                renderLineHighlight: "gutter",
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Selecione um arquivo</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat panel */}
      <div className="w-96 border-l border-border bg-card flex flex-col">
        <AIChat
          files={files}
          onFileUpdate={handleFileUpdate}
          conversionTarget={conversionTarget}
          onConversionDone={handleConversionDone}
        />
      </div>
    </div>
  );
}
