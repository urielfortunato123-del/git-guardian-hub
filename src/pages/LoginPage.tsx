import { useState } from "react";
import { Key, ArrowRight, Code2, Rocket, Stethoscope, Smartphone, AlertCircle, Shield, Mail, Lock, Zap, GitBranch, UserPlus, LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type AuthStep = "login" | "activate" | "register";

interface LoginPageProps {
  step: AuthStep;
  isLoading: boolean;
  error?: string | null;
  pendingActivation?: { email: string; licenseKey: string; expiresAt: string | null } | null;
  onActivate: (licenseKey: string, email: string) => void;
  onRegister: (password: string, displayName: string) => void;
  onLogin: (email: string, password: string) => void;
  onSwitchToActivate: () => void;
  onSwitchToLogin: () => void;
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
      animate={{ y: [0, -30, 0], opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5] }}
      transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function FocusInput({ icon: Icon, label, type = "text", placeholder, value, onChange, disabled, autoFocus, focusedField, fieldName, setFocusedField, mono }: {
  icon: typeof Mail;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  focusedField: string | null;
  fieldName: string;
  setFocusedField: (f: string | null) => void;
  mono?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className={`relative rounded-xl border transition-all duration-300 ${
        focusedField === fieldName
          ? "border-primary/50 shadow-md shadow-primary/10 bg-background"
          : "border-border/60 bg-secondary/30"
      }`}>
        <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
          focusedField === fieldName ? "text-primary" : "text-muted-foreground/50"
        }`} />
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(type === "text" && mono ? e.target.value.toUpperCase() : e.target.value)}
          onFocus={() => setFocusedField(fieldName)}
          onBlur={() => setFocusedField(null)}
          placeholder={placeholder}
          className={`w-full pl-11 ${isPassword ? "pr-11" : "pr-4"} py-3 rounded-xl bg-transparent text-foreground text-sm placeholder:text-muted-foreground/40 focus:outline-none ${mono ? "font-mono tracking-wider" : ""}`}
          disabled={disabled}
          autoFocus={autoFocus}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ACTIVATE FORM ──
function ActivateForm({ onActivate, isLoading, error, onSwitchToLogin, focusedField, setFocusedField }: {
  onActivate: (key: string, email: string) => void;
  isLoading: boolean;
  error?: string | null;
  onSwitchToLogin: () => void;
  focusedField: string | null;
  setFocusedField: (f: string | null) => void;
}) {
  const [key, setKey] = useState("");
  const [email, setEmail] = useState("");
  const isValid = key.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (isValid) onActivate(key.trim(), email.trim().toLowerCase()); }} className="space-y-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Key className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Primeira Ativação</h2>
          <p className="text-[11px] text-muted-foreground">Insira sua chave de licença para começar</p>
        </div>
      </div>

      <FocusInput icon={Mail} label="Email" type="email" placeholder="seu@email.com" value={email} onChange={setEmail} disabled={isLoading} autoFocus focusedField={focusedField} fieldName="act-email" setFocusedField={setFocusedField} />
      <FocusInput icon={Key} label="Chave de Licença" placeholder="LH-XXXXX-XXXXX-XXXXX-XXXXX" value={key} onChange={setKey} disabled={isLoading} focusedField={focusedField} fieldName="act-key" setFocusedField={setFocusedField} mono />

      <ErrorMessage error={error} />

      <SubmitButton isLoading={isLoading} disabled={!isValid} icon={Shield} label="Ativar Licença" loadingLabel="Verificando..." />

      <p className="text-center text-xs text-muted-foreground pt-2">
        Já tem conta?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-primary hover:underline font-medium">Fazer login</button>
      </p>
    </form>
  );
}

// ── REGISTER FORM ──
function RegisterForm({ onRegister, isLoading, error, pendingEmail, onBack, focusedField, setFocusedField }: {
  onRegister: (password: string, name: string) => void;
  isLoading: boolean;
  error?: string | null;
  pendingEmail: string;
  onBack: () => void;
  focusedField: string | null;
  setFocusedField: (f: string | null) => void;
}) {
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const isValid = password.length >= 6 && name.trim().length > 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (isValid) onRegister(password, name.trim()); }} className="space-y-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <UserPlus className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Criar Conta</h2>
          <p className="text-[11px] text-muted-foreground">Licença ativada! Crie sua senha para acessos futuros</p>
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/15 rounded-xl px-4 py-2.5 text-xs">
        <span className="text-muted-foreground">Email: </span>
        <span className="text-foreground font-medium">{pendingEmail}</span>
      </div>

      <FocusInput icon={UserPlus} label="Seu nome" placeholder="Como quer ser chamado" value={name} onChange={setName} disabled={isLoading} autoFocus focusedField={focusedField} fieldName="reg-name" setFocusedField={setFocusedField} />
      <FocusInput icon={Lock} label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={setPassword} disabled={isLoading} focusedField={focusedField} fieldName="reg-pass" setFocusedField={setFocusedField} />

      <ErrorMessage error={error} />

      <SubmitButton isLoading={isLoading} disabled={!isValid} icon={UserPlus} label="Criar Conta" loadingLabel="Criando..." />

      <p className="text-center">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
      </p>
    </form>
  );
}

// ── LOGIN FORM ──
function LoginForm({ onLogin, isLoading, error, onSwitchToActivate, focusedField, setFocusedField }: {
  onLogin: (email: string, password: string) => void;
  isLoading: boolean;
  error?: string | null;
  onSwitchToActivate: () => void;
  focusedField: string | null;
  setFocusedField: (f: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 1;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (isValid) onLogin(email.trim().toLowerCase(), password); }} className="space-y-4">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <LogIn className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Entrar</h2>
          <p className="text-[11px] text-muted-foreground">Acesse com seu email e senha</p>
        </div>
      </div>

      <FocusInput icon={Mail} label="Email" type="email" placeholder="seu@email.com" value={email} onChange={setEmail} disabled={isLoading} autoFocus focusedField={focusedField} fieldName="log-email" setFocusedField={setFocusedField} />
      <FocusInput icon={Lock} label="Senha" type="password" placeholder="Sua senha" value={password} onChange={setPassword} disabled={isLoading} focusedField={focusedField} fieldName="log-pass" setFocusedField={setFocusedField} />

      <ErrorMessage error={error} />

      <SubmitButton isLoading={isLoading} disabled={!isValid} icon={LogIn} label="Entrar" loadingLabel="Entrando..." />

      <p className="text-center text-xs text-muted-foreground pt-2">
        Primeira vez?{" "}
        <button type="button" onClick={onSwitchToActivate} className="text-primary hover:underline font-medium">Ativar licença</button>
      </p>
    </form>
  );
}

// ── Shared components ──
function ErrorMessage({ error }: { error?: string | null }) {
  return (
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
  );
}

function SubmitButton({ isLoading, disabled, icon: Icon, label, loadingLabel }: {
  isLoading: boolean; disabled: boolean; icon: typeof Shield; label: string; loadingLabel: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading || disabled}
      whileHover={{ scale: !disabled && !isLoading ? 1.01 : 1 }}
      whileTap={{ scale: !disabled && !isLoading ? 0.98 : 1 }}
      className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3.5 px-6 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Zap className="w-4 h-4" />
          </motion.div>
          {loadingLabel}
        </>
      ) : (
        <>
          <Icon className="w-4 h-4" />
          {label}
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </motion.button>
  );
}

// ── MAIN PAGE ──
export function LoginPage({
  step, isLoading, error, pendingActivation,
  onActivate, onRegister, onLogin,
  onSwitchToActivate, onSwitchToLogin,
}: LoginPageProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i, delay: i * 0.4, x: Math.random() * 100, y: Math.random() * 100,
  }));

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Left panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div className="flex items-center gap-4 mb-10" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-primary/10">
              <GitBranch className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Lov<span className="text-primary">Hub</span>
              </h1>
              <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">AI Dev Platform</p>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-muted-foreground mb-10 text-base leading-relaxed">
            Plataforma completa de desenvolvimento com IA. Edite, analise e publique projetos multi-plataforma.
          </motion.p>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-2xl p-6 shadow-2xl shadow-black/20"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: step === "register" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: step === "register" ? -20 : 20 }}
                transition={{ duration: 0.3 }}
              >
                {step === "activate" && (
                  <ActivateForm onActivate={onActivate} isLoading={isLoading} error={error} onSwitchToLogin={onSwitchToLogin} focusedField={focusedField} setFocusedField={setFocusedField} />
                )}
                {step === "register" && pendingActivation && (
                  <RegisterForm onRegister={onRegister} isLoading={isLoading} error={error} pendingEmail={pendingActivation.email} onBack={onSwitchToActivate} focusedField={focusedField} setFocusedField={setFocusedField} />
                )}
                {step === "login" && (
                  <LoginForm onLogin={onLogin} isLoading={isLoading} error={error} onSwitchToActivate={onSwitchToActivate} focusedField={focusedField} setFocusedField={setFocusedField} />
                )}
              </motion.div>
            </AnimatePresence>

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

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {(["activate", "register", "login"] as const).map((s, i) => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s ? "w-8 bg-primary" : "w-1.5 bg-border"
              }`} />
            ))}
          </div>

          {/* Credit */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-8 text-center">
            <p className="text-[11px] text-muted-foreground/50">Desenvolvido por</p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Uriel da Fonseca Fortunato</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5 font-mono">© {new Date().getFullYear()} · Todos os direitos reservados</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-primary/5 border-l border-border/40" />
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => <FloatingParticle key={p.id} {...p} />)}
        </div>
        <div className="relative z-10 flex items-center justify-center px-16 w-full">
          <div className="max-w-sm w-full space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex gap-3 mb-8">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.1 }} className="flex-1 bg-background/40 backdrop-blur-sm border border-border/30 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-primary">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }} whileHover={{ x: 4 }} className="flex gap-4 p-4 rounded-xl bg-background/30 backdrop-blur-sm border border-border/20 hover:border-primary/20 hover:bg-background/50 transition-all duration-300 group cursor-default">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/30 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="pt-4 mt-6 border-t border-border/20">
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
