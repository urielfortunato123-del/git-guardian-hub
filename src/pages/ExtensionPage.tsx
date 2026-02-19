import { useState, useEffect, useCallback, useRef } from "react";
import { Download, FileCode, Image, FileText, Package, Eye, ChevronRight, ChevronDown, File, Archive, Pencil, RotateCcw, Save } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface ExtensionFile {
  name: string;
  path: string;
  type: "js" | "html" | "json" | "image" | "other";
}

const extensionFiles: ExtensionFile[] = [
  { name: "manifest.json", path: "/extension/manifest.json", type: "json" },
  { name: "background.js", path: "/extension/background.js", type: "js" },
  { name: "content.js", path: "/extension/content.js", type: "js" },
  { name: "crypto-utils.js", path: "/extension/crypto-utils.js", type: "js" },
  { name: "security.js", path: "/extension/security.js", type: "js" },
  { name: "shield-inject.js", path: "/extension/shield-inject.js", type: "js" },
  { name: "supabase-config.js", path: "/extension/supabase-config.js", type: "js" },
  { name: "license.js", path: "/extension/license.js", type: "js" },
  { name: "popup.js", path: "/extension/popup.js", type: "js" },
  { name: "permission.js", path: "/extension/permission.js", type: "js" },
  { name: "footer.js", path: "/extension/footer.js", type: "js" },
  { name: "footer-override.js", path: "/extension/footer-override.js", type: "js" },
  { name: "jszip.min.js", path: "/extension/jszip.min.js", type: "js" },
  { name: "jszip.min-2.js", path: "/extension/jszip.min-2.js", type: "js" },
  { name: "sweetalert2.min.js", path: "/extension/sweetalert2.min.js", type: "js" },
  { name: "popup.html", path: "/extension/popup.html", type: "html" },
  { name: "permission.html", path: "/extension/permission.html", type: "html" },
  { name: "icon.png", path: "/extension/icon.png", type: "image" },
  { name: "logo.png", path: "/extension/logo.png", type: "image" },
  { name: "clapperboard.png", path: "/extension/clapperboard.png", type: "image" },
  { name: "google-docs.png", path: "/extension/google-docs.png", type: "image" },
  { name: "mic.png", path: "/extension/mic.png", type: "image" },
];

const fileTypeConfig: Record<string, { icon: typeof FileCode; color: string; label: string; lang: string }> = {
  js: { icon: FileCode, color: "text-yellow-500", label: "JavaScript", lang: "javascript" },
  html: { icon: FileText, color: "text-orange-500", label: "HTML", lang: "html" },
  json: { icon: FileText, color: "text-green-500", label: "JSON", lang: "json" },
  image: { icon: Image, color: "text-blue-500", label: "Imagem", lang: "" },
  other: { icon: File, color: "text-muted-foreground", label: "Outro", lang: "plaintext" },
};

function ManifestInfo() {
  const [manifest, setManifest] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/extension/manifest.json")
      .then((r) => r.json())
      .then(setManifest)
      .catch(() => setManifest(null));
  }, []);

  if (!manifest) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Informações da Extensão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="text-sm font-medium">{manifest.name as string}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Versão</p>
            <p className="text-sm font-medium">{manifest.version as string}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Manifest</p>
            <p className="text-sm font-medium">v{manifest.manifest_version as number}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Permissões</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(manifest.permissions as string[] || []).map((p) => (
                <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {manifest.description && (
          <p className="text-xs text-muted-foreground mt-3 whitespace-pre-line">
            {manifest.description as string}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Inline Editor ───
function InlineEditor({
  file,
  editedFiles,
  onSave,
  onReset,
}: {
  file: ExtensionFile;
  editedFiles: Record<string, string>;
  onSave: (name: string, content: string) => void;
  onReset: (name: string) => void;
}) {
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const editorValueRef = useRef<string>("");

  const loadContent = useCallback(async () => {
    if (originalContent !== null) return;
    setLoading(true);
    try {
      const res = await fetch(file.path);
      const text = await res.text();
      setOriginalContent(text);
      editorValueRef.current = editedFiles[file.name] ?? text;
    } catch {
      setOriginalContent("// Erro ao carregar arquivo");
    }
    setLoading(false);
  }, [file.path, file.name, originalContent, editedFiles]);

  if (file.type === "image") {
    return (
      <div className="p-4 flex items-center justify-center bg-muted/30 rounded-lg">
        <img src={file.path} alt={file.name} className="max-w-[200px] max-h-[200px] object-contain" />
      </div>
    );
  }

  const isEdited = file.name in editedFiles;
  const config = fileTypeConfig[file.type];
  const displayContent = editedFiles[file.name] ?? originalContent;

  if (originalContent === null) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={loadContent} disabled={loading}>
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          {loading ? "Carregando..." : "Visualizar"}
        </Button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(file.name, editorValueRef.current);
              setEditing(false);
              toast.success(`${file.name} salvo (em memória)`);
            }}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Salvar
          </Button>
        </div>
        <div className="border border-border rounded-md overflow-hidden">
          <Editor
            height="400px"
            defaultLanguage={config.lang}
            defaultValue={displayContent ?? ""}
            theme="vs-dark"
            onChange={(value) => {
              editorValueRef.current = value ?? "";
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 justify-end">
        {isEdited && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              onReset(file.name);
              editorValueRef.current = originalContent;
              toast.info(`${file.name} restaurado ao original`);
            }}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Restaurar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            editorValueRef.current = displayContent ?? "";
            setEditing(true);
          }}
        >
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Editar
        </Button>
      </div>
      <ScrollArea className="h-[300px] rounded-md border bg-muted/30">
        <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all text-foreground">
          {displayContent}
        </pre>
      </ScrollArea>
    </div>
  );
}

// ─── File List ───
function FileList({
  files,
  filter,
  editedFiles,
  onSave,
  onReset,
}: {
  files: ExtensionFile[];
  filter?: string;
  editedFiles: Record<string, string>;
  onSave: (name: string, content: string) => void;
  onReset: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = filter ? files.filter((f) => f.type === filter) : files;

  return (
    <div className="space-y-1">
      {filtered.map((file) => {
        const config = fileTypeConfig[file.type];
        const Icon = config.icon;
        const isOpen = expanded === file.name;
        const isEdited = file.name in editedFiles;

        return (
          <div key={file.name} className="border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : file.name)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className="text-sm font-medium flex-1">{file.name}</span>
              {isEdited && (
                <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                  Editado
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                {config.label}
              </Badge>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 border-t border-border pt-2">
                <InlineEditor
                  file={file}
                  editedFiles={editedFiles}
                  onSave={onSave}
                  onReset={onReset}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ───
export function ExtensionPage() {
  const jsFiles = extensionFiles.filter((f) => f.type === "js");
  const htmlFiles = extensionFiles.filter((f) => f.type === "html");
  const jsonFiles = extensionFiles.filter((f) => f.type === "json");
  const imageFiles = extensionFiles.filter((f) => f.type === "image");

  const [zipping, setZipping] = useState(false);
  const [editedFiles, setEditedFiles] = useState<Record<string, string>>({});

  const handleSaveFile = useCallback((name: string, content: string) => {
    setEditedFiles((prev) => ({ ...prev, [name]: content }));
  }, []);

  const handleResetFile = useCallback((name: string) => {
    setEditedFiles((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const editedCount = Object.keys(editedFiles).length;

  const handleDownloadAll = () => {
    extensionFiles.forEach((file) => {
      if (file.name in editedFiles) {
        // Download edited version
        const blob = new Blob([editedFiles[file.name]], { type: "text/plain" });
        saveAs(blob, file.name);
      } else {
        const a = document.createElement("a");
        a.href = file.path;
        a.download = file.name;
        a.click();
      }
    });
  };

  const handleDownloadZip = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        extensionFiles.map(async (file) => {
          if (file.name in editedFiles) {
            // Use edited content
            zip.file(file.name, editedFiles[file.name]);
          } else {
            const res = await fetch(file.path);
            const blob = await res.blob();
            zip.file(file.name, blob);
          }
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "v8-app-extension.zip");
      toast.success("ZIP gerado com sucesso!" + (editedCount > 0 ? ` (${editedCount} arquivo(s) editado(s))` : ""));
    } catch (e) {
      console.error("Erro ao gerar ZIP:", e);
      toast.error("Erro ao gerar ZIP");
    }
    setZipping(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Extensão V8 App</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerenciamento dos arquivos da extensão Chrome
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editedCount > 0 && (
            <Badge className="bg-primary/20 text-primary border-primary/30 mr-1">
              {editedCount} editado(s)
            </Badge>
          )}
          <Button onClick={handleDownloadZip} size="sm" disabled={zipping}>
            <Archive className="w-4 h-4 mr-1.5" />
            {zipping ? "Gerando..." : "Baixar ZIP"}
          </Button>
          <Button onClick={handleDownloadAll} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1.5" />
            Baixar Individual
          </Button>
        </div>
      </div>

      <ManifestInfo />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{jsFiles.length}</p>
            <p className="text-xs text-muted-foreground">JavaScript</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{htmlFiles.length}</p>
            <p className="text-xs text-muted-foreground">HTML</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{jsonFiles.length}</p>
            <p className="text-xs text-muted-foreground">JSON</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{imageFiles.length}</p>
            <p className="text-xs text-muted-foreground">Imagens</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos ({extensionFiles.length})</TabsTrigger>
          <TabsTrigger value="js">JS ({jsFiles.length})</TabsTrigger>
          <TabsTrigger value="html">HTML ({htmlFiles.length})</TabsTrigger>
          <TabsTrigger value="image">Imagens ({imageFiles.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <FileList files={extensionFiles} editedFiles={editedFiles} onSave={handleSaveFile} onReset={handleResetFile} />
        </TabsContent>
        <TabsContent value="js" className="mt-4">
          <FileList files={extensionFiles} filter="js" editedFiles={editedFiles} onSave={handleSaveFile} onReset={handleResetFile} />
        </TabsContent>
        <TabsContent value="html" className="mt-4">
          <FileList files={extensionFiles} filter="html" editedFiles={editedFiles} onSave={handleSaveFile} onReset={handleResetFile} />
        </TabsContent>
        <TabsContent value="image" className="mt-4">
          <FileList files={extensionFiles} filter="image" editedFiles={editedFiles} onSave={handleSaveFile} onReset={handleResetFile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
