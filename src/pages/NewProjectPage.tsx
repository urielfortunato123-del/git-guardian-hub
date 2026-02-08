import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Lock, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { templates } from "@/data/mockData";

export function NewProjectPage() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [creating, setCreating] = useState(false);

  const handleCreate = () => {
    if (!repoName || !selectedTemplate) return;
    setCreating(true);
    setTimeout(() => {
      navigate(`/repo/user/${repoName}`);
    }, 1200);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-2">Novo Projeto</h1>
      <p className="text-sm text-muted-foreground mb-8">Escolha um template e crie um novo repositório no GitHub.</p>

      {/* Templates */}
      <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Template</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {templates.map((t) => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedTemplate(t.id)}
            className={`text-left p-4 rounded-lg border transition-all ${
              selectedTemplate === t.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-muted-foreground"
            }`}
          >
            <div className="text-2xl mb-2">{t.icon}</div>
            <p className="font-semibold text-sm text-foreground">{t.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
            {selectedTemplate === t.id && (
              <Check className="w-4 h-4 text-primary mt-2" />
            )}
          </motion.button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4 mb-8">
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
    </div>
  );
}
