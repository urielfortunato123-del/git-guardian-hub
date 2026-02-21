import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Rocket, ShoppingBag, Wrench, Brain, Globe, Smartphone,
  Building2, ArrowRight, Loader2, CheckCircle2, FlaskConical
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  stack: string[];
}

const TEMPLATES: Template[] = [
  {
    id: "saas-starter",
    name: "SaaS Starter",
    description: "App SaaS completo com autenticação, dashboard, billing e API REST.",
    category: "startup",
    icon: <Rocket className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "Tailwind", "FastAPI", "SQLite", "Stripe"],
  },
  {
    id: "cleaning-app",
    name: "App de Limpeza",
    description: "Aplicativo para agendar e gerenciar serviços de limpeza residencial.",
    category: "negócio",
    icon: <ShoppingBag className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "FastAPI", "SQLite", "PWA"],
  },
  {
    id: "mova-app",
    name: "App MOVA",
    description: "App de mobilidade urbana: solicitar corridas, rastrear motoristas, pagamentos.",
    category: "negócio",
    icon: <Smartphone className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "FastAPI", "WebSocket", "Maps API"],
  },
  {
    id: "engineering-dashboard",
    name: "Dashboard Engenharia",
    description: "Painel de controle para projetos de engenharia com gráficos, relatórios e export.",
    category: "engenharia",
    icon: <Wrench className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "Recharts", "FastAPI", "PDF Export"],
  },
  {
    id: "ai-assistant",
    name: "Assistente IA",
    description: "Chatbot inteligente com memória, RAG, e integração com modelos locais.",
    category: "ia",
    icon: <Brain className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "FastAPI", "Ollama", "ChromaDB"],
  },
  {
    id: "portfolio-pro",
    name: "Portfólio Pro",
    description: "Site portfólio profissional com blog, projetos, contato e analytics.",
    category: "website",
    icon: <Globe className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "Tailwind", "MDX", "PWA"],
  },
  {
    id: "startup-kit",
    name: "Kit Criar Startup",
    description: "Pacote completo: Landing Page + App + Backend + Pitch Deck + README.",
    category: "startup",
    icon: <Building2 className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "FastAPI", "SQLite", "PDF"],
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Loja online com catálogo, carrinho, checkout e painel admin.",
    category: "negócio",
    icon: <ShoppingBag className="w-5 h-5" />,
    stack: ["React", "Vite", "TypeScript", "FastAPI", "SQLite", "Stripe"],
  },
];

const CATEGORIES = ["todos", "startup", "negócio", "engenharia", "ia", "website"];

export function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [generating, setGenerating] = useState<string | null>(null);

  const filtered = selectedCategory === "todos"
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory);

  const handleGenerate = useCallback(async (template: Template) => {
    setGenerating(template.id);
    toast.info(`Gerando projeto "${template.name}"...`);

    try {
      const resp = await fetch("http://127.0.0.1:8787/v1/genlab/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: template.id, name: template.name }),
      });
      if (resp.ok) {
        const data = await resp.json();
        toast.success(`Projeto "${template.name}" gerado com ${data.count || 0} arquivos!`);
      } else {
        toast.error("Agent offline. Rode o agent localmente para gerar templates.");
      }
    } catch {
      toast.error("Agent offline. Rode: python agent.py");
    } finally {
      setGenerating(null);
    }
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketplace de Templates</h1>
            <p className="text-sm text-muted-foreground">Gere projetos completos com 1 clique usando IA local</p>
          </div>
        </div>
        <Link
          to="/genlab"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <FlaskConical className="w-4 h-4" /> GenLab Engine
        </Link>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                <span className="text-[10px] text-muted-foreground capitalize bg-secondary px-1.5 py-0.5 rounded">
                  {template.category}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{template.description}</p>

            <div className="flex flex-wrap gap-1">
              {template.stack.map(tech => (
                <span key={tech} className="px-1.5 py-0.5 text-[10px] bg-secondary text-foreground rounded">
                  {tech}
                </span>
              ))}
            </div>

            <button
              onClick={() => handleGenerate(template)}
              disabled={generating === template.id}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {generating === template.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <ArrowRight className="w-3.5 h-3.5" />
                  Gerar Projeto
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
