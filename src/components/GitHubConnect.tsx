import { useState } from "react";
import { Github, Key, ExternalLink, Loader2, Check, X } from "lucide-react";

interface GitHubConnectProps {
  onConnect: (token: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function GitHubConnect({ onConnect, isLoading, error }: GitHubConnectProps) {
  const [pat, setPat] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pat.trim()) {
      onConnect(pat.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
          <Github className="w-8 h-8 text-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Conectar ao GitHub</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Use um Personal Access Token (PAT) para conectar seus repositórios.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">
            Personal Access Token
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!pat.trim() || isLoading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Conectar
        </button>
      </form>

      <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Como criar um PAT:</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Acesse GitHub → Settings → Developer settings</li>
          <li>Clique em "Personal access tokens" → "Fine-grained tokens"</li>
          <li>Crie um novo token com acesso aos seus repos</li>
          <li>Permissões: Contents (Read & Write), Pull Requests (Read & Write)</li>
        </ol>
        <a
          href="https://github.com/settings/tokens?type=beta"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary mt-3 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Criar token no GitHub
        </a>
      </div>
    </div>
  );
}
