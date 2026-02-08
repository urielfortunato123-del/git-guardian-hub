import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { GitBranch, FolderGit2, Plus, Rocket, LayoutDashboard, LogOut, Settings, Sparkles } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  user: { login: string; name: string; avatar: string };
  onLogout: () => void;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/local-editor", label: "AI Editor", icon: Sparkles },
  { path: "/new", label: "Novo Projeto", icon: Plus },
  { path: "/deploy", label: "Deploy", icon: Rocket },
];

export function AppLayout({ children, user, onLogout }: AppLayoutProps) {
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

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-secondary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">@{user.login}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 mt-1 w-full text-sm text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
