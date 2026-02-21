import { ReactNode, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { FlaskConical, Plus, Rocket, LayoutDashboard, Sparkles, Stethoscope, Workflow, Cpu, Wrench, BookOpen, Puzzle, FileArchive } from "lucide-react";
import { GlobalModelSelector } from "@/components/GlobalModelSelector";
import { QuickSearch } from "@/components/QuickSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/genlab", label: "GenLab Engine", icon: FlaskConical },
  { path: "/workflow", label: "Agente", icon: Workflow },
  { path: "/local-editor", label: "AI Editor", icon: Sparkles },
  { path: "/models", label: "Modelos IA", icon: Cpu },
  { path: "/self-improve", label: "Melhorias", icon: Wrench },
  { path: "/repo-doctor", label: "Repo Doctor", icon: Stethoscope },
  { path: "/new", label: "Novo Projeto", icon: Plus },
  { path: "/import", label: "Importar", icon: FileArchive },
  { path: "/deploy", label: "Deploy", icon: Rocket },
  { path: "/extension", label: "Extensão", icon: Puzzle },
  { path: "/guide", label: "Como Usar", icon: BookOpen },
];

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const shortcuts = useMemo(() => [
    { key: "k", ctrl: true, handler: () => setSearchOpen(true) },
  ], []);

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-screen overflow-hidden">
      <QuickSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <FlaskConical className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-foreground tracking-tight">GenLab</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
              >
                <item.icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search hint */}
        <button
          onClick={() => setSearchOpen(true)}
          className="mx-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors border border-border/50"
        >
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="text-[10px] px-1.5 py-0.5 bg-secondary rounded border border-border font-mono">⌘K</kbd>
        </button>

        {/* Global Model Selector + Settings */}
        <div className="px-3 pt-3 pb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Modelo AI</p>
          <GlobalModelSelector />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
