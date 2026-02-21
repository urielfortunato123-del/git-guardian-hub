import { useRef, useEffect, useState, forwardRef } from "react";
import { Bot, User, Loader2, FileText, Brain, ChevronDown, Image } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "./types";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  modelName: string;
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(function ChatMessages({ messages, isLoading, modelName }, ref) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
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
            {msg.role === "user" && msg.attachments && msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {msg.attachments.map(a => (
                  <div key={a.id} className="rounded-lg border border-border bg-card overflow-hidden">
                    {a.type === "image" && a.preview ? (
                      <img src={a.preview} alt={a.name} className="max-w-[200px] max-h-[150px] object-cover" />
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <FileText className={`w-4 h-4 ${a.type === "pdf" ? "text-destructive" : "text-accent"}`} />
                        <span className="text-xs text-muted-foreground truncate max-w-[150px]">{a.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

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
            <span className="text-sm text-muted-foreground">Pensando com {modelName}...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
});

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
