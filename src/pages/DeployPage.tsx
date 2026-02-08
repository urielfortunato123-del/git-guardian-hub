import { useState } from "react";
import { Rocket, CheckCircle2, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Deploy {
  id: number;
  repo: string;
  provider: string;
  status: "success" | "building" | "failed";
  url: string;
  date: string;
}

const mockDeploys: Deploy[] = [
  { id: 1, repo: "user/lovhub-app", provider: "Vercel", status: "success", url: "https://lovhub-app.vercel.app", date: "2026-02-08T10:30:00Z" },
  { id: 2, repo: "user/fastapi-starter", provider: "Render", status: "building", url: "", date: "2026-02-08T09:15:00Z" },
  { id: 3, repo: "user/react-dashboard", provider: "Vercel", status: "success", url: "https://react-dashboard-nine.vercel.app", date: "2026-02-07T16:00:00Z" },
  { id: 4, repo: "user/ai-chatbot", provider: "Render", status: "failed", url: "", date: "2026-02-07T14:30:00Z" },
];

const statusConfig = {
  success: { icon: CheckCircle2, label: "Deployed", cls: "text-accent" },
  building: { icon: Clock, label: "Building...", cls: "text-warning animate-pulse-glow" },
  failed: { icon: AlertCircle, label: "Failed", cls: "text-destructive" },
};

export function DeployPage() {
  const [deploying, setDeploying] = useState(false);

  const triggerDeploy = () => {
    setDeploying(true);
    setTimeout(() => setDeploying(false), 2000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deploy Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Histórico de deployments</p>
        </div>
        <button
          onClick={triggerDeploy}
          disabled={deploying}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Rocket className="w-4 h-4" />
          {deploying ? "Deploying..." : "Deploy Agora"}
        </button>
      </div>

      <div className="space-y-3">
        {mockDeploys.map((d, i) => {
          const s = statusConfig[d.status];
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
            >
              <s.icon className={`w-5 h-5 flex-shrink-0 ${s.cls}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{d.repo}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{d.provider}</span>
                </div>
                <p className={`text-xs mt-1 ${s.cls}`}>{s.label}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(d.date).toLocaleString("pt-BR")}
              </span>
              {d.url && (
                <a href={d.url} target="_blank" rel="noopener" className="text-primary hover:opacity-80 transition-opacity">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
