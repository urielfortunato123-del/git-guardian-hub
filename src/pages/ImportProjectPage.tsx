import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileArchive, Lock, Globe, Loader2, Code, Palette, Database, FolderUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import { extractFilesFromZip } from "@/lib/zipImporter";
import { readFilesFromInput, type UploadedFile } from "@/lib/fileUtils";
import { detectStack, generateProjectSummary } from "@/lib/stackDetector";

export function ImportProjectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [files, setFiles] = useState<UploadedFile[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [importMode, setImportMode] = useState<"zip" | "folder">("zip");

  const stack = files ? detectStack(files) : null;
  const summary = files && stack ? generateProjectSummary(files, stack) : null;

  const processZip = useCallback(async (file: File) => {
    setProcessing(true);
    try {
      const extracted = await extractFilesFromZip(file);
      setFiles(extracted);
      setFileName(file.name);
      const baseName = file.name.replace(/\.zip$/i, "").replace(/\s/g, "-").toLowerCase();
      setRepoName(baseName);
    } catch (e) {
      console.error("Error extracting ZIP:", e);
    } finally {
      setProcessing(false);
    }
  }, []);

  const processFolder = useCallback(async (fileList: FileList) => {
    setProcessing(true);
    try {
      const extracted = await readFilesFromInput(fileList);
      setFiles(extracted);
      // Try to get folder name from first file path
      const firstPath = extracted[0]?.path || "";
      const folderName = firstPath.split("/")[0] || "projeto";
      setFileName(folderName);
      setRepoName(folderName.replace(/\s/g, "-").toLowerCase());
    } catch (e) {
      console.error("Error reading folder:", e);
    } finally {
      setProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;

    const first = droppedFiles[0];
    if (first.name.endsWith(".zip")) {
      processZip(first);
    } else {
      processFolder(droppedFiles);
    }
  }, [processZip, processFolder]);

  const handleImport = () => {
    if (!files || !repoName) return;
    // Store files in sessionStorage for the editor to pick up
    sessionStorage.setItem("imported-files", JSON.stringify(files));
    sessionStorage.setItem("imported-stack", JSON.stringify(stack));
    navigate(`/editor/local/${repoName}`);
  };

  const handleReset = () => {
    setFiles(null);
    setFileName("");
    setRepoName("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-1">Importar Projeto</h1>
      <p className="text-sm text-muted-foreground mb-6">Faça upload de um arquivo .zip ou pasta para recriar seu app no editor.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setImportMode("zip")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${
                importMode === "zip" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <FileArchive className="w-4 h-4" /> Arquivo ZIP
            </button>
            <button
              onClick={() => setImportMode("folder")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${
                importMode === "folder" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <FolderUp className="w-4 h-4" /> Pasta Local
            </button>
          </div>

          {/* Drop zone */}
          {!files ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => importMode === "zip" ? zipInputRef.current?.click() : fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                isDragging ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
              } ${processing ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={e => e.target.files?.[0] && processZip(e.target.files[0])}
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                // @ts-ignore
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={e => e.target.files && processFolder(e.target.files)}
              />

              {processing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Extraindo arquivos...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {importMode === "zip" ? "Escolha um arquivo .zip ou arraste aqui" : "Escolha uma pasta ou arraste aqui"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {importMode === "zip" ? "Comprima a pasta do seu projeto em .zip" : "Selecione a pasta raiz do projeto"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* File info */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileArchive className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{fileName}</p>
                      <p className="text-xs text-muted-foreground">{files.length} arquivos de código encontrados</p>
                    </div>
                  </div>
                  <button onClick={handleReset} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                    Trocar arquivo
                  </button>
                </div>

                {/* Stack detected */}
                {stack && stack.type !== "unknown" && (
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{stack.icon}</span>
                      <span className="font-semibold text-sm text-foreground">{stack.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {stack.signals.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Repo name */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Nome do repositório</label>
                <input
                  value={repoName}
                  onChange={e => setRepoName(e.target.value.replace(/\s/g, "-"))}
                  className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>

              {/* Privacy */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Visibilidade</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsPrivate(false)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      !isPrivate ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Public</p>
                      <p className="text-[11px] text-muted-foreground">Qualquer um pode ver e forkar</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsPrivate(true)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      isPrivate ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Private</p>
                      <p className="text-[11px] text-muted-foreground">Somente você pode ver e editar</p>
                    </div>
                  </button>
                </div>
                {isPrivate && (
                  <p className="text-xs text-primary mt-2">Somente você pode ver e editar este App.</p>
                )}
              </div>

              {/* Import button */}
              <button
                onClick={handleImport}
                disabled={!repoName}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" /> Importar e Abrir no Editor
              </button>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-foreground mb-1">
              Preparando seu arquivo <span className="font-mono text-primary">.zip</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Para começar, comprima a pasta do seu projeto em um arquivo .zip
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">O que importamos:</h3>
            <div className="space-y-2">
              {[
                { icon: Code, label: "Código" },
                { icon: Palette, label: "Design e estilos" },
                { icon: FolderUp, label: "Assets" },
                { icon: Database, label: "Configurações" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground">O que não é incluído:</h3>
            <div className="space-y-2">
              {[
                { icon: Database, label: "Conteúdo do banco de dados" },
                { icon: Lock, label: "Secrets / .env" },
                { icon: Info, label: "node_modules / build" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-8 font-mono">
        Desenvolvido por Uriel da Fonseca Fortunato · © {new Date().getFullYear()}
      </p>
    </div>
  );
}
