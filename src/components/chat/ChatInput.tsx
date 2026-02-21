import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, X, Image, FileText, FolderUp, Archive } from "lucide-react";
import JSZip from "jszip";
import type { Attachment } from "./types";

const IMAGE_EXTS = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;
const TEXT_EXTS = /\.(tsx?|jsx?|py|rb|go|rs|java|kt|swift|c|cpp|h|cs|php|html|css|scss|less|json|ya?ml|toml|xml|md|txt|sh|bash|zsh|dockerfile|makefile|gradle|env|gitignore|lock|log|sql|graphql|proto|ini|cfg|conf)$/i;

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsText(file);
  });
}

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function ChatInput({ onSend, isLoading, isDragging, onDragEnter, onDragLeave, onDragOver, onDrop }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const processZipFile = useCallback(async (file: File) => {
    const zip = await JSZip.loadAsync(file);
    const newAttachments: Attachment[] = [];
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      if (/node_modules|\.git|dist|build|\.next|vendor/.test(path)) continue;
      if (IMAGE_EXTS.test(path)) {
        const blob = await zipEntry.async("blob");
        const dataUrl = await readFileAsDataURL(new File([blob], path.split("/").pop() || path));
        newAttachments.push({ id: crypto.randomUUID(), name: path, type: "image", data: dataUrl, preview: dataUrl });
      } else if (!(/\.(exe|dll|so|dylib|bin|iso|img|dmg|class|o|a|woff2?|ttf|eot|ico|mp[34]|wav|avi|mov|zip|rar|7z|tar|gz)$/i.test(path))) {
        try {
          const text = await zipEntry.async("string");
          if (text && !text.includes("\0") && text.length < 200_000) {
            newAttachments.push({ id: crypto.randomUUID(), name: path, type: "text", data: text });
          }
        } catch { /* skip binary */ }
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const processFiles = useCallback(async (fileList: FileList) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(fileList)) {
      if (file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
        await processZipFile(file);
        continue;
      }
      const id = crypto.randomUUID();
      if (IMAGE_EXTS.test(file.name) || file.type.startsWith("image/")) {
        const dataUrl = await readFileAsDataURL(file);
        newAttachments.push({ id, name: file.name, type: "image", data: dataUrl, preview: dataUrl });
      } else if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
        const dataUrl = await readFileAsDataURL(file);
        newAttachments.push({ id, name: file.name, type: "pdf", data: dataUrl });
      } else {
        try {
          const text = await readFileAsText(file);
          if (text && !text.includes("\0")) {
            newAttachments.push({ id, name: file.name, type: "text", data: text });
          }
        } catch { /* skip binary */ }
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  }, [processZipFile]);

  const processFolderFiles = useCallback(async (fileList: FileList) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(fileList)) {
      const path = (file as any).webkitRelativePath || file.name;
      if (/node_modules|\.git|dist|build|\.next|vendor/.test(path)) continue;
      if (IMAGE_EXTS.test(file.name)) continue;
      if (file.size > 200_000) continue;
      try {
        const text = await readFileAsText(file);
        if (text && !text.includes("\0")) {
          newAttachments.push({ id: crypto.randomUUID(), name: path, type: "text", data: text });
        }
      } catch { /* skip */ }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    onSend(input, attachments);
    setInput("");
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDrop2 = (e: React.DragEvent) => {
    onDrop(e);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <>
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Archive className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-primary">Solte arquivos aqui</p>
            <p className="text-xs text-muted-foreground mt-1">Imagens, código, ZIP, PDF...</p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.zip,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.html,.css,.xml,.yaml,.yml,.toml,.sh,.sql,.go,.rs,.java,.kt,.swift,.c,.cpp,.h,.cs,.php,.rb,.scss,.less,.graphql,.proto" className="hidden" onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }} />
      <input ref={folderInputRef} type="file" multiple {...{ webkitdirectory: "", directory: "" } as any} className="hidden" onChange={e => { if (e.target.files) processFolderFiles(e.target.files); e.target.value = ""; }} />

      {/* Attachments preview bar */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-secondary/20 flex gap-2 flex-wrap">
          {attachments.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-1 text-xs text-foreground">
              {a.type === "image" ? <Image className="w-3 h-3 text-primary" /> : <FileText className="w-3 h-3 text-accent" />}
              <span className="truncate max-w-[120px]">{a.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))} className="text-muted-foreground hover:text-foreground ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <div className="relative" ref={attachMenuRef}>
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="px-3 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title="Anexar arquivos"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            {showAttachMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-52 bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <Image className="w-4 h-4 text-primary" />
                  Imagens / Arquivos
                </button>
                <button
                  onClick={() => { folderInputRef.current?.click(); setShowAttachMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <FolderUp className="w-4 h-4 text-accent" />
                  Pasta de Projeto
                </button>
              </div>
            )}
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o que quer construir, envie imagens de referência..."
            rows={1}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
