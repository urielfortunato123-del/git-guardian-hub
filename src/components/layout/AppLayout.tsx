import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { GitBranch, Plus, Rocket, LayoutDashboard, Sparkles, Stethoscope, Workflow, Cpu, Wrench, BookOpen, Puzzle, FileArchive } from "lucide-react";
import { GlobalModelSelector } from "@/components/GlobalModelSelector";
import { APIKeysSettings } from "@/components/APIKeysSettings";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <GitBranch className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg text-foreground tracking-tight">LovHub</span>
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

        {/* Global Model Selector + Settings */}
        <div className="px-3 pt-3 pb-3">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Modelo AI</p>
            <APIKeysSettings />
          </div>
          <GlobalModelSelector />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
