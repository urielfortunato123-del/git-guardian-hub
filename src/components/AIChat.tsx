import { useState, useRef, useCallback, useEffect } from "react";
import type { UploadedFile } from "@/lib/fileUtils";
import type { Message, Attachment } from "@/components/chat/types";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ProjectAnalysis } from "@/components/ProjectAnalysis";
import { callAIStream, processSSEStream } from "@/services/ai";
import { useModel } from "@/contexts/ModelContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Trash2, Plus, MessageSquare, X, Loader2 } from "lucide-react";
import type { PlatformTarget } from "@/components/PlatformConverter";

interface AIChatProps {
  files: UploadedFile[];
  onFileUpdate: (path: string, content: string) => void;
  conversionTarget?: PlatformTarget | null;
  onConversionDone?: () => void;
}

export function AIChat({ files, onFileUpdate, conversionTarget, onConversionDone }: AIChatProps) {
  const {
    messages, setMessages, addMessage, updateLastMessage, saveLastAssistantMessage,
    clearHistory, conversations, activeConversationId,
    newConversation, switchConversation, deleteConversation, loading,
  } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const { selectedModel } = useModel();
  const [isDragging, setIsDragging] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const dragCounterRef = useRef(0);

  const buildSystemPrompt = useCallback((filesObj: Record<string, string>, platform?: PlatformTarget | null) => {
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

FORMAT FOR FILE EDITS:
\`\`\`filepath:src/example.ts
// complete file content here
\`\`\``;

    if (platform) {
      systemPrompt += `

PLATFORM CONVERSION MODE:
You are converting the current project to ${platform.name} (${platform.language}).
${platform.description}

CONVERSION RULES:
- Recreate ALL functionality from the original project for the target platform
- Generate the COMPLETE project structure including build files, configs, manifests
- Use idiomatic patterns and best practices for ${platform.language} and ${platform.name}
- Preserve all business logic, UI flows, and data structures
- Generate ALL files needed to build and run the project
- Use the filepath format for EVERY file: \`\`\`filepath:path/to/file.ext
- Include README.md with build instructions for the target platform
- Do NOT skip any file — generate the COMPLETE project`;
    }

    systemPrompt += "\n\nCURRENT PROJECT FILES:";

    if (Object.keys(filesObj).length > 0) {
      for (const [path, content] of Object.entries(filesObj)) {
        systemPrompt += `\n\n--- ${path} ---\n${content.slice(0, 3000)}${content.length > 3000 ? "\n... (truncated)" : ""}`;
      }
    } else {
      systemPrompt += "\n\n(No files uploaded yet)";
    }
    return systemPrompt;
  }, []);

  const parseFileEdits = (content: string) => {
    const regex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      onFileUpdate(match[1].trim(), match[2]);
    }
  };

  // Handle platform conversion trigger
  useEffect(() => {
    if (conversionTarget && !isLoading) {
      const prompt = `Converta TODO o projeto atual para ${conversionTarget.name} (${conversionTarget.language}). ${conversionTarget.description}. Recrie cada arquivo com a estrutura completa do projeto para a plataforma alvo. Inclua todos os arquivos de configuração, build, manifesto e código fonte necessários.`;
      handleSend(prompt, []);
      onConversionDone?.();
    }
  }, [conversionTarget]);

  const handleSend = useCallback(async (input: string, attachments: Attachment[]) => {
    const filesObj: Record<string, string> = {};
    files.forEach(f => { filesObj[f.path] = f.content; });
    attachments.filter(a => a.type === "text").forEach(a => { filesObj[a.name] = a.data; });

    const userMessage: Message = {
      role: "user",
      content: input,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    await addMessage(userMessage);
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(filesObj, conversionTarget);
      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: input },
      ];

      const response = await callAIStream(chatMessages, { model: selectedModel });

      // Add empty assistant message locally for streaming (NOT saved to DB yet)
      setMessages(prev => [...prev, { role: "assistant" as const, content: "" }]);

      let assistantContent = "";
      let reasoningContent = "";

      await processSSEStream(
        response,
        (content, reasoning) => {
          if (content) assistantContent += content;
          if (reasoning) reasoningContent += reasoning;
          updateLastMessage(() => ({
            role: "assistant",
            content: assistantContent,
            reasoning_content: reasoningContent || undefined,
          }));
        },
        () => {
          parseFileEdits(assistantContent);
        }
      );

      // Save final assistant message to DB
      await saveLastAssistantMessage();
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro ao enviar mensagem";
      await addMessage({ role: "assistant", content: `❌ ${errorMsg}` });
    } finally {
      setIsLoading(false);
    }
  }, [files, messages, selectedModel, conversionTarget, addMessage, updateLastMessage, saveLastAssistantMessage, buildSystemPrompt]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounterRef.current = 0;
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ChatHeader
        onToggleHistory={() => setShowSidebar(!showSidebar)}
        hasHistory={conversations.length > 0}
      />

      {/* Conversation sidebar */}
      {showSidebar && (
        <div className="absolute left-0 top-12 bottom-0 w-64 bg-card border-r border-border z-40 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-foreground">Conversas</span>
            <div className="flex items-center gap-1">
              <button
                onClick={async () => { await newConversation(); setShowSidebar(false); }}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Nova conversa"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowSidebar(false)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma conversa</p>
            )}
            {conversations.map(c => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/60 transition-colors ${
                  c.id === activeConversationId ? "bg-primary/10" : ""
                }`}
                onClick={() => { switchConversation(c.id); setShowSidebar(false); }}
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{c.title}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info bar */}
      {messages.length > 0 && (
        <div className="px-4 py-1 border-b border-border bg-secondary/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {files.length} arquivos • {messages.length} mensagens
          </span>
          <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" />
            Limpar
          </button>
        </div>
      )}

      <ProjectAnalysis files={files} />

      {messages.length === 0 && !loading && (
        <div className="px-4 py-1.5 border-b border-border bg-secondary/30">
          <span className="text-xs text-muted-foreground">{files.length} arquivos no projeto</span>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <ChatMessages messages={messages} isLoading={isLoading} modelName={selectedModel.name} />
      )}

      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        isDragging={isDragging}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
    </div>
  );
}
