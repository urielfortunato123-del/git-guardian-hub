import { Sparkles } from "lucide-react";
import { ModelPicker } from "./ModelPicker";

export function ChatHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">AI Agent</span>
      </div>
      <ModelPicker />
    </div>
  );
}
