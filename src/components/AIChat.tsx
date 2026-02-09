import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, ChevronDown, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { UploadedFile } from "@/lib/fileUtils";
import { ProjectAnalysis } from "@/components/ProjectAnalysis";
import { AI_MODELS, DEFAULT_MODEL, MODEL_CATEGORIES, type AIModel } from "@/lib/aiModels";

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning_details?: unknown;
  reasoning_content?: string;
}

interface AIChatProps {
  files: UploadedFile[];
  onFileUpdate: (path: string, content: string) => void;
}

export function AIChat({ files, onFileUpdate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [reasoningEnabled, setReasoningEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseFileEdits = (content: string) => {
    const regex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const path = match[1].trim();
      const fileContent = match[2];
      onFileUpdate(path, fileContent);
    }
  };

  const buildSystemPrompt = (filesObj: Record<string, string>) => {
    let systemPrompt = `You are an expert AI coding assistant. You help users edit their code files.

CAPABILITIES:
- You can VIEW all files the user has uploaded
- You can EDIT files by providing updated code
- You understand multiple programming languages

INSTRUCTIONS:
- When the user asks to modify a file, show the COMPLETE updated file content
- Use markdown code blocks with the file path as the language identifier
- Be concise but thorough in your explanations

FORMAT FOR FILE EDITS:
When editing a file, use this format:
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

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const filesObj: Record<string, string> = {};
    files.forEach((f) => {
      filesObj[f.path] = f.content;
    });

    try {
      let response: Response;

      if (selectedModel.isLocal && selectedModel.baseUrl) {
        response = await fetch(`${selectedModel.baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "local-model",
            messages: [
              { role: "system", content: buildSystemPrompt(filesObj) },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: input },
            ],
            stream: true,
          }),
        });
      } else {
        // Cloud model via edge function — pass reasoning_details for multi-turn reasoning
        const apiMessages = [...messages, userMessage].map(m => {
          const msg: Record<string, unknown> = { role: m.role, content: m.content };
          if (m.reasoning_details) {
            msg.reasoning_details = m.reasoning_details;
          }
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
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
            
            if (delta?.content) {
              assistantContent += delta.content;
            }

            // Capture reasoning content from streaming
            if (delta?.reasoning_content) {
              reasoningContent += delta.reasoning_content;
            }

            // Capture reasoning_details (non-streaming, from final message)
            if (parsed.choices?.[0]?.message?.reasoning_details) {
              reasoningDetails = parsed.choices[0].message.reasoning_details;
            }

            setMessages((prev) => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1] = {
                role: "assistant",
                content: assistantContent,
                reasoning_content: reasoningContent || undefined,
                reasoning_details: reasoningDetails,
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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${errorMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">AI Editor</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Reasoning toggle */}
          {selectedModel.supportsReasoning && (
            <button
              onClick={() => setReasoningEnabled(!reasoningEnabled)}
              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors ${
                reasoningEnabled
                  ? "bg-accent/20 text-accent"
                  : "bg-secondary text-muted-foreground"
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
                          onClick={() => {
                            setSelectedModel(model);
                            setShowModelPicker(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-secondary/60 transition-colors ${
                            selectedModel.id === model.id ? "bg-primary/10" : ""
                          }`}
                        >
                          <span className="text-sm">{model.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">{model.name}</p>
                              {model.isLocal && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-accent text-accent-foreground rounded">LOCAL</span>
                              )}
                              {model.supportsReasoning && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">🧠</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{model.provider}</p>
                          </div>
                          {selectedModel.id === model.id && (
                            <span className="text-primary text-xs">✓</span>
                          )}
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
          {files.length} arquivos carregados
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Faça upload de uma pasta e peça ao AI para editar seus arquivos
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Ex: "Adicione um botão de logout no Header.tsx"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] space-y-2`}>
              {/* Reasoning content (collapsible) */}
              {msg.role === "assistant" && msg.reasoning_content && (
                <ReasoningBlock content={msg.reasoning_content} />
              )}

              <div
                className={`rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none text-foreground">
                    <ReactMarkdown
                      components={{
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-secondary px-1 py-0.5 rounded text-sm font-mono" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-editor-bg p-3 rounded-md overflow-x-auto">
                              <code className="text-sm font-mono" {...props}>
                                {children}
                              </code>
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

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Peça ao AI para editar seus arquivos..."
            rows={1}
            className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
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
