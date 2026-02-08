import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Lock, Globe, Star, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { mockRepos, languageColors } from "@/data/mockData";

export function DashboardPage() {
  const [query, setQuery] = useState("");

  const filtered = mockRepos.filter(
    (r) =>
      r.full_name.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repositórios</h1>
          <p className="text-sm text-muted-foreground mt-1">{mockRepos.length} repos encontrados</p>
        </div>
        <Link
          to="/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Novo Projeto
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar repositórios..."
          className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
        />
      </div>

      {/* Repos grid */}
      <div className="grid gap-3">
        {filtered.map((repo, i) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
          >
            <Link
              to={`/repo/${repo.owner}/${repo.name}`}
              className="group flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-secondary/50 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {repo.full_name}
                  </span>
                  {repo.private ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{repo.description}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: languageColors[repo.language] || "hsl(var(--muted-foreground))" }}
                    />
                    {repo.language}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3" /> {repo.stars}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {new Date(repo.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
