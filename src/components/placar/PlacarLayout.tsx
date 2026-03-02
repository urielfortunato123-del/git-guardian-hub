import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Home, GitCompare, BookOpen, ExternalLink } from "lucide-react";

const navLinks = [
  { path: "/", label: "Início", icon: Home },
  { path: "/comparar", label: "Comparar", icon: GitCompare },
  { path: "/metodologia", label: "Metodologia", icon: BookOpen },
  { path: "/fontes", label: "Fontes", icon: ExternalLink },
];

export function PlacarLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">Placar Público</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-1">Político em Dados</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Este aplicativo organiza informações públicas e não substitui órgãos de controle.
            Os dados podem ter defasagem. Sempre verifique na fonte oficial.
          </p>
        </div>
      </footer>
    </div>
  );
}
