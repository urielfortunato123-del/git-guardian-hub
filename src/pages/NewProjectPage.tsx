import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, Globe, Search } from "lucide-react";
import { motion } from "framer-motion";

// All project types/platforms organized by category
const projectCategories = [
  {
    category: "📱 Mobile",
    templates: [
      { id: "android-kotlin", name: "Android (Kotlin)", icon: "🤖", description: "App Android nativo com Kotlin + Jetpack Compose", language: "Kotlin" },
      { id: "android-java", name: "Android (Java)", icon: "🤖", description: "App Android nativo com Java + XML layouts", language: "Java" },
      { id: "ios-swift", name: "iOS (Swift)", icon: "🍎", description: "App iOS nativo com SwiftUI", language: "Swift" },
      { id: "react-native", name: "React Native", icon: "📱", description: "App cross-platform iOS/Android com React Native", language: "TypeScript" },
      { id: "flutter", name: "Flutter", icon: "🦋", description: "App cross-platform com Dart/Flutter", language: "Dart" },
      { id: "pwa", name: "PWA (Web App)", icon: "🌐", description: "Progressive Web App instalável no celular", language: "TypeScript" },
    ],
  },
  {
    category: "🌐 Web Frontend",
    templates: [
      { id: "react-vite", name: "React + Vite", icon: "⚛️", description: "SPA moderna com React + Vite + TypeScript", language: "TypeScript" },
      { id: "nextjs", name: "Next.js", icon: "▲", description: "Full-stack React com SSR e App Router", language: "TypeScript" },
      { id: "vue", name: "Vue.js", icon: "💚", description: "SPA com Vue 3 + Composition API", language: "TypeScript" },
      { id: "angular", name: "Angular", icon: "🅰️", description: "Enterprise app com Angular + TypeScript", language: "TypeScript" },
      { id: "svelte", name: "SvelteKit", icon: "🔥", description: "App rápido com Svelte + SvelteKit", language: "TypeScript" },
      { id: "html-css", name: "HTML/CSS/JS", icon: "📄", description: "Site estático simples sem framework", language: "HTML" },
    ],
  },
  {
    category: "⚙️ Backend / API",
    templates: [
      { id: "fastapi", name: "FastAPI (Python)", icon: "🐍", description: "API REST com FastAPI + SQLAlchemy", language: "Python" },
      { id: "django", name: "Django", icon: "🐍", description: "Full-stack Python com Django + DRF", language: "Python" },
      { id: "flask", name: "Flask", icon: "🐍", description: "Micro-framework Python leve", language: "Python" },
      { id: "node-express", name: "Node.js + Express", icon: "🟢", description: "API REST com Express + Prisma", language: "JavaScript" },
      { id: "nestjs", name: "NestJS", icon: "🟢", description: "Framework Node.js enterprise-grade", language: "TypeScript" },
      { id: "spring-boot", name: "Spring Boot", icon: "☕", description: "API Java com Spring Boot + JPA", language: "Java" },
      { id: "go-gin", name: "Go + Gin", icon: "🐹", description: "API REST rápida com Go + Gin", language: "Go" },
      { id: "rust-actix", name: "Rust + Actix", icon: "🦀", description: "API ultra-performática com Rust", language: "Rust" },
      { id: "csharp-aspnet", name: "ASP.NET Core", icon: "🟣", description: "API REST com C# + .NET", language: "C#" },
    ],
  },
  {
    category: "🖥️ Desktop",
    templates: [
      { id: "electron", name: "Electron", icon: "⚡", description: "App desktop cross-platform com Electron", language: "TypeScript" },
      { id: "tauri", name: "Tauri", icon: "🦀", description: "App desktop leve com Tauri + Rust", language: "Rust" },
      { id: "javafx", name: "JavaFX", icon: "☕", description: "App desktop Java com JavaFX", language: "Java" },
      { id: "python-tk", name: "Python + Tkinter", icon: "🐍", description: "App desktop Python simples", language: "Python" },
      { id: "python-qt", name: "Python + PyQt", icon: "🐍", description: "App desktop Python profissional com Qt", language: "Python" },
      { id: "csharp-wpf", name: "C# WPF", icon: "🟣", description: "App Windows nativo com C# WPF", language: "C#" },
      { id: "cpp-qt", name: "C++ Qt", icon: "🔵", description: "App desktop performático com C++ Qt", language: "C++" },
    ],
  },
  {
    category: "🤖 IA / Machine Learning",
    templates: [
      { id: "ai-chatbot", name: "AI Chatbot", icon: "🤖", description: "Chatbot com LLM (OpenAI/local)", language: "Python" },
      { id: "ml-pipeline", name: "ML Pipeline", icon: "🧠", description: "Pipeline de Machine Learning com scikit-learn", language: "Python" },
      { id: "langchain", name: "LangChain RAG", icon: "🦜", description: "RAG com LangChain + embeddings", language: "Python" },
      { id: "computer-vision", name: "Computer Vision", icon: "👁️", description: "Visão computacional com OpenCV + YOLO", language: "Python" },
    ],
  },
  {
    category: "🎮 Games",
    templates: [
      { id: "unity", name: "Unity", icon: "🎮", description: "Jogo 2D/3D com Unity + C#", language: "C#" },
      { id: "godot", name: "Godot", icon: "🎮", description: "Jogo 2D/3D com Godot + GDScript", language: "GDScript" },
      { id: "pygame", name: "Pygame", icon: "🐍", description: "Jogo 2D simples com Python", language: "Python" },
      { id: "phaser", name: "Phaser.js", icon: "🌐", description: "Jogo 2D web com Phaser", language: "JavaScript" },
    ],
  },
  {
    category: "🛠️ DevOps / Infra",
    templates: [
      { id: "docker", name: "Docker + Compose", icon: "🐳", description: "Container multi-serviço com Docker Compose", language: "YAML" },
      { id: "terraform", name: "Terraform", icon: "🏗️", description: "Infraestrutura como código com Terraform", language: "HCL" },
      { id: "github-actions", name: "GitHub Actions CI/CD", icon: "⚙️", description: "Pipeline CI/CD com GitHub Actions", language: "YAML" },
      { id: "k8s", name: "Kubernetes", icon: "☸️", description: "Deploy em Kubernetes com Helm", language: "YAML" },
    ],
  },
  {
    category: "📦 CLI / Scripts",
    templates: [
      { id: "python-cli", name: "Python CLI", icon: "🐍", description: "Ferramenta de linha de comando com Click/Typer", language: "Python" },
      { id: "node-cli", name: "Node CLI", icon: "🟢", description: "CLI com Node.js + Commander", language: "TypeScript" },
      { id: "rust-cli", name: "Rust CLI", icon: "🦀", description: "CLI ultra-rápida com Rust + Clap", language: "Rust" },
      { id: "go-cli", name: "Go CLI", icon: "🐹", description: "CLI com Go + Cobra", language: "Go" },
      { id: "bash-scripts", name: "Bash Scripts", icon: "🐚", description: "Automação com Shell scripts", language: "Shell" },
    ],
  },
];

const allTemplates = projectCategories.flatMap(c => c.templates);

export function NewProjectPage() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCategories = projectCategories
    .map(cat => ({
      ...cat,
      templates: cat.templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.language.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(cat => cat.templates.length > 0);

  const selectedInfo = allTemplates.find(t => t.id === selectedTemplate);

  const handleCreate = () => {
    if (!repoName || !selectedTemplate) return;
    setCreating(true);
    setTimeout(() => {
      navigate(`/repo/user/${repoName}`);
    }, 1200);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-1">Novo Projeto</h1>
      <p className="text-sm text-muted-foreground mb-6">Escolha a plataforma e linguagem para seu novo projeto.</p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar: Python, Android, React, Java..."
          className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Categories */}
      <div className="space-y-6 mb-8 max-h-[45vh] overflow-auto pr-2">
        {filteredCategories.map(cat => (
          <div key={cat.category}>
            <h2 className="text-sm font-semibold text-foreground mb-2">{cat.category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {cat.templates.map(t => (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedTemplate === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">{t.language}</span>
                  </div>
                  <p className="font-semibold text-xs text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                  {selectedTemplate === t.id && <Check className="w-3.5 h-3.5 text-primary mt-1" />}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected info */}
      {selectedInfo && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedInfo.icon}</span>
            <span className="font-semibold text-sm text-foreground">{selectedInfo.name}</span>
            <span className="text-xs font-mono px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">{selectedInfo.language}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{selectedInfo.description}</p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Nome do repositório</label>
          <input
            value={repoName}
            onChange={(e) => setRepoName(e.target.value.replace(/\s/g, "-"))}
            placeholder="meu-projeto"
            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Descrição</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do projeto..."
            className="w-full bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Visibilidade</label>
          <div className="flex gap-3">
            <button
              onClick={() => setIsPrivate(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${
                isPrivate ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <Lock className="w-4 h-4" /> Private
            </button>
            <button
              onClick={() => setIsPrivate(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all ${
                !isPrivate ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <Globe className="w-4 h-4" /> Public
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleCreate}
        disabled={!repoName || !selectedTemplate || creating}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {creating ? "Criando repositório..." : "Criar Repositório & Abrir Editor"}
      </button>

      {/* Developer credit */}
      <p className="text-[10px] text-muted-foreground text-center mt-6 font-mono">
        Desenvolvido por Uriel da Fonseca Fortunato · © {new Date().getFullYear()}
      </p>
    </div>
  );
}
