import { useState, useEffect } from "react";
import { Download, FileCode, Image, FileText, Package, Eye, ChevronRight, ChevronDown, Folder, File, Archive } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExtensionFile {
  name: string;
  path: string;
  type: "js" | "html" | "json" | "image" | "other";
  size?: string;
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

const fileTypeConfig: Record<string, { icon: typeof FileCode; color: string; label: string }> = {
  js: { icon: FileCode, color: "text-yellow-500", label: "JavaScript" },
  html: { icon: FileText, color: "text-orange-500", label: "HTML" },
  json: { icon: FileText, color: "text-green-500", label: "JSON" },
  image: { icon: Image, color: "text-blue-500", label: "Imagem" },
  other: { icon: File, color: "text-muted-foreground", label: "Outro" },
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

function FileViewer({ file }: { file: ExtensionFile }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadContent = async () => {
    if (content !== null) return;
    setLoading(true);
    try {
      const res = await fetch(file.path);
      const text = await res.text();
      // Truncate very large files for display
      setContent(text.length > 50000 ? text.slice(0, 50000) + "\n\n// ... truncado ..." : text);
    } catch {
      setContent("// Erro ao carregar arquivo");
    }
    setLoading(false);
  };

  if (file.type === "image") {
    return (
      <div className="p-4 flex items-center justify-center bg-muted/30 rounded-lg">
        <img src={file.path} alt={file.name} className="max-w-[200px] max-h-[200px] object-contain" />
      </div>
    );
  }

  return (
    <div>
      {content === null ? (
        <Button variant="outline" size="sm" onClick={loadContent} disabled={loading}>
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          {loading ? "Carregando..." : "Visualizar"}
        </Button>
      ) : (
        <ScrollArea className="h-[300px] rounded-md border bg-muted/30">
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all text-foreground">
            {content}
          </pre>
        </ScrollArea>
      )}
    </div>
  );
}

function FileList({ files, filter }: { files: ExtensionFile[]; filter?: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const filtered = filter ? files.filter((f) => f.type === filter) : files;

  return (
    <div className="space-y-1">
      {filtered.map((file) => {
        const config = fileTypeConfig[file.type];
        const Icon = config.icon;
        const isOpen = expanded === file.name;

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
              <Badge variant="outline" className="text-[10px]">
                {config.label}
              </Badge>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 border-t border-border pt-2">
                <FileViewer file={file} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ExtensionPage() {
  const jsFiles = extensionFiles.filter((f) => f.type === "js");
  const htmlFiles = extensionFiles.filter((f) => f.type === "html");
  const jsonFiles = extensionFiles.filter((f) => f.type === "json");
  const imageFiles = extensionFiles.filter((f) => f.type === "image");

  const [zipping, setZipping] = useState(false);

  const handleDownloadAll = () => {
    extensionFiles.forEach((file) => {
      const a = document.createElement("a");
      a.href = file.path;
      a.download = file.name;
      a.click();
    });
  };

  const handleDownloadZip = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        extensionFiles.map(async (file) => {
          const res = await fetch(file.path);
          const blob = await res.blob();
          zip.file(file.name, blob);
        })
      );
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "v8-app-extension.zip");
    } catch (e) {
      console.error("Erro ao gerar ZIP:", e);
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
        <div className="flex gap-2">
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
          <FileList files={extensionFiles} />
        </TabsContent>
        <TabsContent value="js" className="mt-4">
          <FileList files={extensionFiles} filter="js" />
        </TabsContent>
        <TabsContent value="html" className="mt-4">
          <FileList files={extensionFiles} filter="html" />
        </TabsContent>
        <TabsContent value="image" className="mt-4">
          <FileList files={extensionFiles} filter="image" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
