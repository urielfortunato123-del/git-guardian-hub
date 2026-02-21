import { useState, useRef, useCallback } from "react";
import type { UploadedFile } from "@/lib/fileUtils";
import type { Message, Attachment } from "@/components/chat/types";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { ProjectAnalysis } from "@/components/ProjectAnalysis";
import { callAIStream, processSSEStream } from "@/services/ai";
import { useModel } from "@/contexts/ModelContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Trash2 } from "lucide-react";

interface AIChatProps {
  files: UploadedFile[];
  onFileUpdate: (path: string, content: string) => void;
}

export function AIChat({ files, onFileUpdate }: AIChatProps) {
  const { messages, addMessage, updateLastMessage, clearHistory } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const { selectedModel, openRouterApiKey } = useModel();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const buildSystemPrompt = useCallback((filesObj: Record<string, string>) => {
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
  }, []);

  const parseFileEdits = (content: string) => {
    const regex = /```filepath:([^\n]+)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      onFileUpdate(match[1].trim(), match[2]);
    }
  };

  const handleSend = useCallback(async (input: string, attachments: Attachment[]) => {
    const filesObj: Record<string, string> = {};
    files.forEach(f => { filesObj[f.path] = f.content; });
    attachments.filter(a => a.type === "text").forEach(a => { filesObj[a.name] = a.data; });

    const userMessage: Message = {
      role: "user",
      content: input,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    addMessage(userMessage);
    setIsLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(filesObj);
      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: input },
      ];

      const response = await callAIStream(chatMessages, { model: selectedModel });

      addMessage({ role: "assistant", content: "" });

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
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro ao enviar mensagem";
      addMessage({ role: "assistant", content: `❌ ${errorMsg}` });
    } finally {
      setIsLoading(false);
    }
  }, [files, messages, selectedModel, addMessage, updateLastMessage, buildSystemPrompt]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ChatHeader />

      {/* Clear history button */}
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

      {messages.length === 0 && (
        <div className="px-4 py-1.5 border-b border-border bg-secondary/30">
          <span className="text-xs text-muted-foreground">{files.length} arquivos no projeto</span>
        </div>
      )}

      <ChatMessages messages={messages} isLoading={isLoading} modelName={selectedModel.name} />

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
