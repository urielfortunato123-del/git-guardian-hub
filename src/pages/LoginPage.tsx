import { useState } from "react";
import { Key, ArrowRight, Code2, Rocket, Sparkles, Stethoscope, Smartphone, AlertCircle, Shield, Mail } from "lucide-react";
import { motion } from "framer-motion";

interface LoginPageProps {
  onLogin: (licenseKey: string, email: string) => void;
  isLoading: boolean;
  error?: string | null;
}

const features = [
  { icon: Code2, title: "Editor com Monaco + IA", desc: "Edite código com assistente de IA integrado" },
  { icon: Stethoscope, title: "Repo Doctor", desc: "Analise projetos, gere patches e abra PRs" },
  { icon: Smartphone, title: "Multi-plataforma", desc: "Crie apps para Android, iOS, Desktop, Web e mais" },
  { icon: Rocket, title: "Deploy em 1 clique", desc: "Publique para qualquer plataforma instantaneamente" },
];

export function LoginPage({ onLogin, isLoading, error }: LoginPageProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseKey.trim() && email.trim()) {
      onLogin(licenseKey.trim(), email.trim().toLowerCase());
    }
  };

  const isValid = licenseKey.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

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
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">LovHub</h1>
              <p className="text-sm text-muted-foreground">Dev Platform by Uriel Fortunato</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Plataforma completa de desenvolvimento: edite código com IA, analise repositórios e crie projetos multi-plataforma.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Chave de Licença
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder="LH-XXXXX-XXXXX-XXXXX-XXXXX"
                  className="w-full pl-10 pr-4 py-3.5 rounded-lg border border-input bg-background text-foreground font-mono text-sm tracking-wider placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full flex items-center justify-center gap-3 bg-foreground text-background py-3.5 px-6 rounded-lg font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Key className="w-5 h-5" />
              {isLoading ? "Verificando..." : "Ativar Licença"}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Licença vinculada ao email + hardware · Verificação online segura
          </p>

          {/* Developer credit */}
          <div className="mt-12 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">Desenvolvido por</p>
            <p className="text-sm font-semibold text-foreground mt-1">Uriel da Fonseca Fortunato</p>
            <p className="text-[10px] text-muted-foreground mt-1 font-mono">
              © {new Date().getFullYear()} · Todos os direitos reservados
            </p>
          </div>
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
              $ lovhub activate --email you@mail.com --key LH-***** ✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
