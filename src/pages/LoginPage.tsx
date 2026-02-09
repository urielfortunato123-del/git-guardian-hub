import { useState, useEffect } from "react";
import { Key, ArrowRight, Code2, Rocket, Stethoscope, Smartphone, AlertCircle, Shield, Mail, Lock, Zap, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginPageProps {
  onLogin: (licenseKey: string, email: string) => void;
  isLoading: boolean;
  error?: string | null;
}

const features = [
  { icon: Code2, title: "Editor com Monaco + IA", desc: "Edite código com assistente de IA integrado em tempo real" },
  { icon: Stethoscope, title: "Repo Doctor", desc: "Diagnóstico completo, patches automáticos e PRs inteligentes" },
  { icon: Smartphone, title: "Multi-plataforma", desc: "Android, iOS, Desktop, Web — tudo em um só lugar" },
  { icon: Rocket, title: "Deploy em 1 clique", desc: "Publique para qualquer plataforma instantaneamente" },
];

const stats = [
  { label: "Modelos IA", value: "20+" },
  { label: "Linguagens", value: "12+" },
  { label: "Uptime", value: "99.9%" },
];

function FloatingParticle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-primary/30"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [0, -30, 0],
        opacity: [0, 0.6, 0],
        scale: [0.5, 1.2, 0.5],
      }}
      transition={{
        duration: 4 + Math.random() * 3,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

export function LoginPage({ onLogin, isLoading, error }: LoginPageProps) {
  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseKey.trim() && email.trim()) {
      onLogin(licenseKey.trim(), email.trim().toLowerCase());
    }
  };

  const isValid = licenseKey.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: i * 0.4,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px]" />
      </div>

      {/* Left panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-4 mb-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-primary/10">
              <GitBranch className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Lov<span className="text-primary">Hub</span>
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">
                AI Dev Platform
              </p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-10 text-base leading-relaxed"
          >
            Plataforma completa de desenvolvimento com IA. Edite, analise e publique projetos multi-plataforma.
          </motion.p>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-2xl shadow-black/20"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Ativar Licença</h2>
                <p className="text-[11px] text-muted-foreground">Vinculada ao email + hardware</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Email
                </label>
                <div className={`relative rounded-xl border transition-all duration-300 ${
                  focusedField === "email" 
                    ? "border-primary/50 shadow-md shadow-primary/10 bg-background" 
                    : "border-border/60 bg-secondary/30"
                }`}>
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    focusedField === "email" ? "text-primary" : "text-muted-foreground/50"
                  }`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Chave de Licença
                </label>
                <div className={`relative rounded-xl border transition-all duration-300 ${
                  focusedField === "key" 
                    ? "border-primary/50 shadow-md shadow-primary/10 bg-background" 
                    : "border-border/60 bg-secondary/30"
                }`}>
                  <Key className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    focusedField === "key" ? "text-primary" : "text-muted-foreground/50"
                  }`} />
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                    onFocus={() => setFocusedField("key")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="LH-XXXXX-XXXXX-XXXXX-XXXXX"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent text-foreground font-mono text-sm tracking-wider placeholder:text-muted-foreground/40 focus:outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="flex items-center gap-2.5 text-sm text-destructive bg-destructive/8 border border-destructive/15 rounded-xl px-4 py-3"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={isLoading || !isValid}
                whileHover={{ scale: isValid && !isLoading ? 1.01 : 1 }}
                whileTap={{ scale: isValid && !isLoading ? 0.98 : 1 }}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3.5 px-6 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-4 h-4" />
                    </motion.div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Ativar Licença
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-border/30">
              {[
                { icon: Shield, label: "Criptografado" },
                { icon: Lock, label: "Bind Hardware" },
                { icon: Mail, label: "Vinculado ao Email" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Developer credit */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 text-center"
          >
            <p className="text-[11px] text-muted-foreground/50">Desenvolvido por</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Uriel da Fonseca Fortunato</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5 font-mono">
              © {new Date().getFullYear()} · Todos os direitos reservados
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel - features showcase */}
      <div className="hidden lg:flex flex-1 relative">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-primary/5 border-l border-border/40" />
        
        {/* Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <FloatingParticle key={p.id} {...p} />
          ))}
        </div>

        <div className="relative z-10 flex items-center justify-center px-16 w-full">
          <div className="max-w-sm w-full space-y-6">
            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-3 mb-8"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex-1 bg-background/40 backdrop-blur-sm border border-border/30 rounded-xl p-3 text-center"
                >
                  <p className="text-lg font-bold text-primary">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Features */}
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                whileHover={{ x: 4 }}
                className="flex gap-4 p-4 rounded-xl bg-background/30 backdrop-blur-sm border border-border/20 hover:border-primary/20 hover:bg-background/50 transition-all duration-300 group cursor-default"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}

            {/* Terminal-like footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="pt-4 mt-6 border-t border-border/20"
            >
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-border/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-destructive/60" />
                  <div className="w-2 h-2 rounded-full bg-warning/60" />
                  <div className="w-2 h-2 rounded-full bg-accent/60" />
                  <span className="text-[9px] text-muted-foreground/40 ml-2 font-mono">terminal</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 font-mono">
                  <span className="text-accent/70">$</span> lovhub activate --email <span className="text-primary/70">you@mail.com</span> ✨
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
