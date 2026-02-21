import { useState, useCallback, forwardRef } from "react";
import { Send } from "lucide-react";
import type { Attachment } from "./types";
import { AttachButton, AttachmentPreview, DragOverlay, useAttachmentProcessing } from "./AttachmentManager";

interface ChatInputProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const ChatInput = forwardRef<HTMLDivElement, ChatInputProps>(function ChatInput({ onSend, isLoading, isDragging, onDragEnter, onDragLeave, onDragOver, onDrop }, ref) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const addItems = useCallback((items: Attachment[]) => {
    setAttachments(prev => [...prev, ...items]);
  }, []);

  const { processFiles, processFolderFiles } = useAttachmentProcessing(addItems);

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
    // Ctrl+Enter also sends
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <DragOverlay isDragging={isDragging} />

      <AttachmentPreview
        attachments={attachments}
        onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
      />

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <AttachButton
            onFilesSelected={processFiles}
            onFolderSelected={processFolderFiles}
          />

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
});
