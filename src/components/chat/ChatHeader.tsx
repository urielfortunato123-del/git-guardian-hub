import { Sparkles, History } from "lucide-react";
import { ModelPicker } from "./ModelPicker";

interface ChatHeaderProps {
  onToggleHistory?: () => void;
  hasHistory?: boolean;
}

export function ChatHeader({ onToggleHistory, hasHistory }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">AI Agent</span>
        {hasHistory && onToggleHistory && (
          <button
            onClick={onToggleHistory}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Histórico de conversas"
          >
            <History className="w-4 h-4" />
          </button>
        )}
      </div>
      <ModelPicker />
    </div>
  );
}
