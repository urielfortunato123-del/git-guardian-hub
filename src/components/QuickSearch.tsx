import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  LayoutDashboard, Workflow, Sparkles, Cpu, Wrench, Stethoscope,
  Plus, FileArchive, Rocket, Puzzle, BookOpen, Search,
} from "lucide-react";

const pages = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: ["home", "repos", "repositórios"] },
  { path: "/workflow", label: "Agente / Workflow", icon: Workflow, keywords: ["agent", "análise", "patch"] },
  { path: "/local-editor", label: "AI Editor", icon: Sparkles, keywords: ["chat", "editor", "ia"] },
  { path: "/models", label: "Modelos IA", icon: Cpu, keywords: ["model", "openrouter", "llm", "api key"] },
  { path: "/self-improve", label: "Melhorias", icon: Wrench, keywords: ["improve", "daemon", "alterações"] },
  { path: "/repo-doctor", label: "Repo Doctor", icon: Stethoscope, keywords: ["doctor", "github", "importar repo"] },
  { path: "/new", label: "Novo Projeto", icon: Plus, keywords: ["create", "novo", "project"] },
  { path: "/import", label: "Importar Projeto", icon: FileArchive, keywords: ["import", "zip", "upload"] },
  { path: "/deploy", label: "Deploy", icon: Rocket, keywords: ["publicar", "deploy", "vercel"] },
  { path: "/extension", label: "Extensão", icon: Puzzle, keywords: ["chrome", "extension", "plugin"] },
  { path: "/guide", label: "Como Usar", icon: BookOpen, keywords: ["help", "ajuda", "guia", "docs"] },
];

interface QuickSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickSearch({ open, onOpenChange }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? pages.filter(p => {
        const q = query.toLowerCase();
        return (
          p.label.toLowerCase().includes(q) ||
          p.path.toLowerCase().includes(q) ||
          p.keywords.some(k => k.includes(q))
        );
      })
    : pages;

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const go = useCallback((path: string) => {
    navigate(path);
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      go(filtered[selectedIndex].path);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar página... (ex: models, deploy)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded border border-border font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-auto py-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma página encontrada</p>
          )}
          {filtered.map((page, idx) => (
            <button
              key={page.path}
              onClick={() => go(page.path)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                idx === selectedIndex
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <page.icon className={`w-4 h-4 flex-shrink-0 ${idx === selectedIndex ? "text-primary" : ""}`} />
              <span className="flex-1 text-left">{page.label}</span>
              <span className="text-xs text-muted-foreground/60 font-mono">{page.path}</span>
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>
            <kbd className="px-1 py-0.5 bg-secondary rounded border border-border font-mono mr-1">↑↓</kbd>
            navegar
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-secondary rounded border border-border font-mono mr-1">↵</kbd>
            abrir
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-secondary rounded border border-border font-mono mr-1">Ctrl+K</kbd>
            buscar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
