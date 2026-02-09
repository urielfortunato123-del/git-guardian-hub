import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, ChevronDown, Brain, Paperclip, X, Image, FileText, FolderUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { UploadedFile } from "@/lib/fileUtils";
import { getLanguageFromPath } from "@/lib/fileUtils";
import { ProjectAnalysis } from "@/components/ProjectAnalysis";
import { AI_MODELS, DEFAULT_MODEL, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";

interface Attachment {
  id: string;
  name: string;
  type: "image" | "text" | "pdf";
  /** base64 data URL for images, text content for text files */
  data: string;
  /** preview thumbnail for images */
  preview?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning_details?: unknown;
  reasoning_content?: string;
  attachments?: Attachment[];
  images?: string[]; // base64 image URLs from AI response
}

interface AIChatProps {
  files: UploadedFile[];
  onFileUpdate: (path: string, content: string) => void;
}

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

export function AIChat({ files, onFileUpdate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) setShowModelPicker(false);
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) setShowAttachMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processFiles = useCallback(async (fileList: FileList) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(fileList)) {
      const id = crypto.randomUUID();
      if (IMAGE_EXTS.test(file.name) || file.type.startsWith("image/")) {
        const dataUrl = await readFileAsDataURL(file);
        newAttachments.push({ id, name: file.name, type: "image", data: dataUrl, preview: dataUrl });
      } else if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
        const dataUrl = await readFileAsDataURL(file);
        newAttachments.push({ id, name: file.name, type: "pdf", data: dataUrl });
      } else if (TEXT_EXTS.test(file.name) || file.type.startsWith("text/")) {
        const text = await readFileAsText(file);
        newAttachments.push({ id, name: file.name, type: "text", data: text });
      } else {
        // Try reading as text
        try {
          const text = await readFileAsText(file);
          if (text && !text.includes("\0")) {
            newAttachments.push({ id, name: file.name, type: "text", data: text });
          }
        } catch { /* skip binary */ }
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const processFolderFiles = useCallback(async (fileList: FileList) => {
    const newAttachments: Attachment[] = [];
    for (const file of Array.from(fileList)) {
      const path = (file as any).webkitRelativePath || file.name;
      // Skip heavy dirs
      if (/node_modules|\.git|dist|build|\.next|vendor/.test(path)) continue;
      if (IMAGE_EXTS.test(file.name)) continue; // skip images in folder uploads
      if (file.size > 200_000) continue;

      const id = crypto.randomUUID();
      try {
        const text = await readFileAsText(file);
        if (text && !text.includes("\0")) {
          newAttachments.push({ id, name: path, type: "text", data: text });
        }
      } catch { /* skip */ }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const parseFileEdits = (content: string) => {
    const regex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      onFileUpdate(match[1].trim(), match[2]);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMessage: Message = { role: "user", content: input, attachments: currentAttachments.length > 0 ? currentAttachments : undefined };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    // Build files context from project files + text attachments
    const filesObj: Record<string, string> = {};
    files.forEach(f => { filesObj[f.path] = f.content; });
    currentAttachments.filter(a => a.type === "text").forEach(a => { filesObj[a.name] = a.data; });

    // Build images array for multimodal
    const imageAttachments = currentAttachments.filter(a => a.type === "image").map(a => a.data);

    // Build PDF context (send as text description)
    const pdfNames = currentAttachments.filter(a => a.type === "pdf").map(a => a.name);

    try {
      let response: Response;

      if (selectedModel.isLocal && selectedModel.baseUrl) {
        const systemPrompt = buildSystemPrompt(filesObj);
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
      } else {
        const apiMessages = [...messages, userMessage].map(m => {
          const msg: Record<string, unknown> = { role: m.role, content: m.content };
          if (m.reasoning_details) msg.reasoning_details = m.reasoning_details;
          return msg;
        });

        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              messages: apiMessages,
              files: filesObj,
              model: selectedModel.id,
              reasoning: reasoningEnabled && selectedModel.supportsReasoning,
              provider: selectedModel.providerBackend || "auto",
              images: imageAttachments.length > 0 ? imageAttachments : undefined,
              pdfNames: pdfNames.length > 0 ? pdfNames : undefined,
            }),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let reasoningContent = "";
      let reasoningDetails: unknown = undefined;
      let assistantImages: string[] = [];
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
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.content) assistantContent += delta.content;
            if (delta?.reasoning_content) reasoningContent += delta.reasoning_content;
            if (parsed.choices?.[0]?.message?.reasoning_details) {
              reasoningDetails = parsed.choices[0].message.reasoning_details;
            }
            // Capture images from non-streaming response
            const msgImages = parsed.choices?.[0]?.message?.images;
            if (msgImages) {
              assistantImages = msgImages.map((img: { image_url: { url: string } }) => img.image_url.url);
            }

            setMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1] = {
                role: "assistant",
                content: assistantContent,
                reasoning_content: reasoningContent || undefined,
                reasoning_details: reasoningDetails,
                images: assistantImages.length > 0 ? assistantImages : undefined,
              };
              return newMsgs;
            });
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      parseFileEdits(assistantContent);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro ao enviar mensagem";
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildSystemPrompt = (filesObj: Record<string, string>) => {
    let systemPrompt = `You are a senior full-stack developer integrated into LovHub. You BUILD REAL, PRODUCTION-READY applications.

CRITICAL RULES:
- NEVER generate example, demo, or placeholder code
- NEVER use mock data, hardcoded arrays, or fake content
- ALWAYS generate REAL, COMPLETE, FUNCTIONAL code that can be compiled and run immediately
- Every file you generate must be a REAL implementation, not a demonstration
- Use proper state management, API calls, real routing, and production patterns
- If building a React app, use real components with proper props, hooks, and styling
- If the user asks for a feature, implement it FULLY, not a simplified version

CAPABILITIES:
- You can VIEW all files the user has uploaded
- You can EDIT files by providing updated code
- You can analyze images the user uploads as design references
- You understand multiple programming languages and frameworks

INSTRUCTIONS:
- Generate the COMPLETE file content for each file
- Use markdown code blocks with the file path as the language identifier
- If the user uploads an image, replicate that design EXACTLY in code
- Create all necessary files: components, pages, styles, config, etc.
- Include proper imports, exports, and dependencies

FORMAT FOR FILE EDITS:
\`\`\`filepath:src/example.ts
// complete file content here
\`\`\`

CURRENT PROJECT FILES:`;

    if (Object.keys(filesObj).length > 0) {
      for (const [path, content] of Object.entries(filesObj)) {
        systemPrompt += `\n\n--- ${path} ---\n${content.slice(0, 3000)}${content.length > 3000 ? "\n... (truncated)" : ""}`;
      }
    } else {
      systemPrompt += "\n\n(No files uploaded yet)";
    }
    return systemPrompt;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.html,.css,.xml,.yaml,.yml,.toml,.sh,.sql,.go,.rs,.java,.kt,.swift,.c,.cpp,.h,.cs,.php,.rb,.scss,.less,.graphql,.proto" className="hidden" onChange={e => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; }} />
      <input ref={folderInputRef} type="file" multiple {...{ webkitdirectory: "", directory: "" } as any} className="hidden" onChange={e => { if (e.target.files) processFolderFiles(e.target.files); e.target.value = ""; }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">AI Agent</span>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedModel.supportsReasoning && (
            <button
              onClick={() => setReasoningEnabled(!reasoningEnabled)}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors ${
                reasoningEnabled ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
              }`}
              title="Habilitar reasoning (cadeia de pensamento)"
            >
              <Brain className="w-3 h-3" />
              Reasoning
            </button>
          )}

          {/* Model Selector */}
          <div className="relative" ref={modelPickerRef}>
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1.5 text-xs bg-secondary hover:bg-secondary/80 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <span>{selectedModel.icon}</span>
              <span className="text-foreground font-medium max-w-[100px] truncate">{selectedModel.name}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
            
            {showModelPicker && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 max-h-80 overflow-auto">
                {(Object.entries(MODEL_CATEGORIES) as [string, { label: string; description: string }][]).map(([catKey, cat]) => {
                  const catModels = AI_MODELS.filter(m => m.category === catKey);
                  if (catModels.length === 0) return null;
                  return (
                    <div key={catKey}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                        {cat.label}
                      </div>
                      {catModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => { setSelectedModel(model); setShowModelPicker(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/60 transition-colors ${
                            selectedModel.id === model.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <span className="text-sm">{model.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">{model.name}</p>
                              {model.isLocal && <span className="text-[10px] px-1.5 py-0.5 bg-accent text-accent-foreground rounded">LOCAL</span>}
                              {model.supportsReasoning && <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">🧠</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{model.provider}</p>
                          </div>
                          {selectedModel.id === model.id && <span className="text-primary text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Analysis */}
      <ProjectAnalysis files={files} />

      {/* File count */}
      <div className="px-4 py-1.5 border-b border-border bg-secondary/30">
        <span className="text-xs text-muted-foreground">
          {files.length} arquivos no projeto
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Descreva o que deseja construir ou envie arquivos de referência
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <span className="text-[10px] px-2 py-1 bg-secondary rounded-md text-muted-foreground">📷 Imagens de design</span>
              <span className="text-[10px] px-2 py-1 bg-secondary rounded-md text-muted-foreground">📄 PDFs</span>
              <span className="text-[10px] px-2 py-1 bg-secondary rounded-md text-muted-foreground">📁 Pastas de projeto</span>
              <span className="text-[10px] px-2 py-1 bg-secondary rounded-md text-muted-foreground">💻 Arquivos de código</span>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className="max-w-[80%] space-y-2">
              {/* User attachments preview */}
              {msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {msg.attachments.map(a => (
                    <div key={a.id} className="rounded-lg border border-border bg-card overflow-hidden">
                      {a.type === "image" && a.preview ? (
                        <img src={a.preview} alt={a.name} className="max-w-[200px] max-h-[150px] object-cover" />
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2">
                          {a.type === "pdf" ? <FileText className="w-4 h-4 text-destructive" /> : <FileText className="w-4 h-4 text-accent" />}
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{a.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reasoning content */}
              {msg.role === "assistant" && msg.reasoning_content && (
                <ReasoningBlock content={msg.reasoning_content} />
              )}

              <div className={`rounded-lg px-4 py-2 ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none text-foreground">
                    <ReactMarkdown
                      components={{
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-secondary px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                          ) : (
                            <pre className="bg-editor-bg p-3 rounded-md overflow-x-auto">
                              <code className="text-sm font-mono" {...props}>{children}</code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {msg.content || "..."}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {/* AI generated images */}
              {msg.role === "assistant" && msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.images.map((src, idx) => (
                    <img key={idx} src={src} alt="Generated" className="max-w-[300px] rounded-lg border border-border" />
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
            <div className="bg-card border border-border rounded-lg px-4 py-2">
              <span className="text-sm text-muted-foreground">
                {reasoningEnabled && selectedModel.supportsReasoning
                  ? `🧠 Pensando com ${selectedModel.name}...`
                  : `Pensando com ${selectedModel.name}...`}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments preview bar */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-secondary/20 flex gap-2 flex-wrap">
          {attachments.map(a => (
            <div key={a.id} className="flex items-center gap-1.5 bg-secondary rounded-lg px-2 py-1 text-xs text-foreground">
              {a.type === "image" ? <Image className="w-3 h-3 text-primary" /> : <FileText className="w-3 h-3 text-accent" />}
              <span className="truncate max-w-[120px]">{a.name}</span>
              <button onClick={() => removeAttachment(a.id)} className="text-muted-foreground hover:text-foreground ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          {/* Attach button */}
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
            onClick={sendMessage}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Collapsible reasoning block */
function ReasoningBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 transition-colors"
      >
        <Brain className="w-3 h-3" />
        <span className="font-medium">Cadeia de Pensamento</span>
        <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-2 text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-48 overflow-auto border-t border-accent/10">
          {content}
        </div>
      )}
    </div>
  );
}
