import { useState } from "react";
import { FileCode, Download, Smartphone, X, Copy, Check, CheckCheck } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface LiveCodePreviewProps {
  files: Record<string, string>;
  onApplyAll?: (files: Record<string, string>) => void;
}

export function LiveCodePreview({ files, onApplyAll }: LiveCodePreviewProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filePaths = Object.keys(files);

  // Auto-select first file if none selected
  const currentFile = activeFile && files[activeFile] ? activeFile : filePaths[0] || null;

  const copyContent = async () => {
    if (!currentFile) return;
    await navigator.clipboard.writeText(files[currentFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsAndroidZip = async () => {
    const zip = new JSZip();

    // Add all generated files
    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }

    // Add Capacitor config if not present
    if (!files["capacitor.config.ts"] && !files["capacitor.config.json"]) {
      const appName = filePaths.find(f => f.includes("package.json"))
        ? JSON.parse(files[filePaths.find(f => f.includes("package.json"))!] || "{}").name || "my-app"
        : "my-app";

      zip.file("capacitor.config.json", JSON.stringify({
        appId: "com.lovhub.app",
        appName,
        webDir: "dist",
        bundledWebRuntime: false,
        android: { buildOptions: { keystorePath: undefined, keystoreAlias: undefined } },
      }, null, 2));
    }

    // Add README with build instructions
    zip.file("BUILD_ANDROID.md", `# Build Android APK

## Pré-requisitos
- Node.js 18+
- Android Studio com SDK configurado
- Java JDK 17+

## Passos

\`\`\`bash
# 1. Instalar dependências
npm install

# 2. Adicionar Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init

# 3. Build do projeto
npm run build

# 4. Adicionar plataforma Android
npx cap add android

# 5. Sincronizar
npx cap sync android

# 6. Abrir no Android Studio
npx cap open android

# 7. No Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
\`\`\`

## Gerar APK via CLI
\`\`\`bash
cd android
./gradlew assembleDebug
# APK em: android/app/build/outputs/apk/debug/app-debug.apk
\`\`\`
`);

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "project-android.zip");
  };

  if (filePaths.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <FileCode className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Os arquivos gerados pelo agente aparecerão aqui</p>
        <p className="text-xs mt-1 opacity-60">Converse com o agente para começar a construir</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with export */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/30">
        <span className="text-xs font-semibold text-foreground">{filePaths.length} arquivo(s) gerado(s)</span>
        <div className="flex items-center gap-1.5">
          {onApplyAll && (
            <button
              onClick={() => onApplyAll(files)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Aplicar Tudo
            </button>
          )}
          <button
            onClick={exportAsAndroidZip}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Exportar Android
          </button>
        </div>
      </div>

      {/* File tabs */}
      <div className="flex overflow-x-auto border-b border-border bg-secondary/20">
        {filePaths.map(path => {
          const fileName = path.split("/").pop() || path;
          return (
            <button
              key={path}
              onClick={() => setActiveFile(path)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-r border-border transition-colors ${
                currentFile === path
                  ? "bg-background text-foreground border-b-2 border-b-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <FileCode className="w-3 h-3" />
              {fileName}
            </button>
          );
        })}
      </div>

      {/* Code content */}
      {currentFile && (
        <div className="flex-1 overflow-auto relative">
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <button
              onClick={copyContent}
              className="p-1.5 bg-secondary/80 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
              title="Copiar"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap break-words">
            <code>{files[currentFile]}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
