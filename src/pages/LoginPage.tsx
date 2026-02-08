import { GitBranch, Github, ArrowRight, Code2, FolderGit2, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface LoginPageProps {
  onLogin: () => void;
  isLoading: boolean;
}

const features = [
  { icon: FolderGit2, title: "Navegue seus repos", desc: "Explore arquivos e pastas direto no browser" },
  { icon: Code2, title: "Edite com Monaco", desc: "Editor profissional estilo VS Code" },
  { icon: Rocket, title: "Deploy em 1 clique", desc: "Publique para Vercel ou Render instantaneamente" },
];

export function LoginPage({ onLogin, isLoading }: LoginPageProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GitBranch className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">LovHub</h1>
              <p className="text-sm text-muted-foreground">GitHub Project Manager</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Gerencie repos, edite código e faça deploy — tudo no browser.
          </p>

          <button
            onClick={onLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-foreground text-background py-3.5 px-6 rounded-lg font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Github className="w-5 h-5" />
            {isLoading ? "Conectando..." : "Entrar com GitHub"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Permissões: leitura/escrita em repos · OAuth seguro
          </p>
        </motion.div>
      </div>

      {/* Right panel - features */}
      <div className="hidden lg:flex flex-1 bg-card border-l border-border items-center justify-center px-12">
        <div className="max-w-sm space-y-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            </motion.div>
          ))}

          <div className="pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">
              $ lovhub deploy --prod ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
