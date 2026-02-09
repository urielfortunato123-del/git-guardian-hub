import { useState } from "react";
import { Settings, Trash2, Plus, Eye, EyeOff, X, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProviderConfig {
  id: string;
  label: string;
  envKey: string;
  placeholder: string;
  hint: string;
}

const BUILT_IN_PROVIDERS: ProviderConfig[] = [
  { id: "openrouter", label: "OpenRouter", envKey: "openrouter_key", placeholder: "sk-or-...", hint: "openrouter.ai/keys" },
  { id: "huggingface", label: "Hugging Face", envKey: "huggingface_key", placeholder: "hf_...", hint: "huggingface.co/settings/tokens" },
  { id: "openai", label: "OpenAI", envKey: "openai_key", placeholder: "sk-...", hint: "platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic", envKey: "anthropic_key", placeholder: "sk-ant-...", hint: "console.anthropic.com" },
  { id: "google", label: "Google AI Studio", envKey: "google_key", placeholder: "AIza...", hint: "aistudio.google.com/apikey" },
  { id: "groq", label: "Groq", envKey: "groq_key", placeholder: "gsk_...", hint: "console.groq.com/keys" },
];

const STORAGE_PREFIX = "lovhub_apikey_";

function getStoredKey(id: string): string {
  return localStorage.getItem(STORAGE_PREFIX + id) || "";
}
function setStoredKey(id: string, value: string) {
  if (value) localStorage.setItem(STORAGE_PREFIX + id, value);
  else localStorage.removeItem(STORAGE_PREFIX + id);
}

export function getAllUserKeys(): Record<string, string> {
  const keys: Record<string, string> = {};
  for (const p of BUILT_IN_PROVIDERS) {
    const v = getStoredKey(p.id);
    if (v) keys[p.id] = v;
  }
  // custom keys
  const custom = getCustomProviders();
  for (const c of custom) {
    const v = getStoredKey("custom_" + c.id);
    if (v) keys["custom_" + c.id] = v;
  }
  return keys;
}

interface CustomProvider {
  id: string;
  label: string;
}

function getCustomProviders(): CustomProvider[] {
  try {
    return JSON.parse(localStorage.getItem("lovhub_custom_providers") || "[]");
  } catch { return []; }
}
function saveCustomProviders(list: CustomProvider[]) {
  localStorage.setItem("lovhub_custom_providers", JSON.stringify(list));
}

export function APIKeysSettings() {
  const [open, setOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>(getCustomProviders);
  const [newCustomName, setNewCustomName] = useState("");

  // Load values on open
  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const v: Record<string, string> = {};
      for (const p of BUILT_IN_PROVIDERS) v[p.id] = getStoredKey(p.id);
      const cp = getCustomProviders();
      for (const c of cp) v["custom_" + c.id] = getStoredKey("custom_" + c.id);
      setValues(v);
      setCustomProviders(cp);
      setVisibleFields({});
    }
  };

  const updateValue = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
    setStoredKey(id, val);
  };

  const deleteKey = (id: string) => {
    setValues((prev) => ({ ...prev, [id]: "" }));
    setStoredKey(id, "");
  };

  const toggleVisible = (id: string) => {
    setVisibleFields((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addCustomProvider = () => {
    const name = newCustomName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (customProviders.some((c) => c.id === id)) return;
    const updated = [...customProviders, { id, label: name }];
    setCustomProviders(updated);
    saveCustomProviders(updated);
    setNewCustomName("");
  };

  const removeCustomProvider = (id: string) => {
    const updated = customProviders.filter((c) => c.id !== id);
    setCustomProviders(updated);
    saveCustomProviders(updated);
    deleteKey("custom_" + id);
  };

  const renderKeyRow = (id: string, label: string, placeholder: string, hint?: string, onDelete?: () => void) => {
    const val = values[id] || "";
    const visible = visibleFields[id];
    const hasValue = !!val;

    return (
      <div key={id} className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium text-foreground">{label}</span>
            {hasValue && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
            {hint && <span className="text-[10px] text-muted-foreground ml-auto">{hint}</span>}
          </div>
          <Input
            type={visible ? "text" : "password"}
            value={val}
            onChange={(e) => updateValue(id, e.target.value)}
            placeholder={placeholder}
            className="h-8 text-xs font-mono"
          />
        </div>
        <div className="flex items-center gap-0.5 pt-5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisible(id)}>
            {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { deleteKey(id); onDelete?.(); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Key className="w-4 h-4" />
            Chaves de API
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2">
          As chaves são salvas localmente no seu navegador. Modelos Lovable AI não precisam de chave.
        </p>

        <div className="space-y-4 mt-2">
          {/* Built-in providers */}
          {BUILT_IN_PROVIDERS.map((p) =>
            renderKeyRow(p.id, p.label, p.placeholder, p.hint)
          )}

          {/* Custom providers */}
          {customProviders.length > 0 && (
            <>
              <div className="border-t border-border pt-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Provedores Personalizados</p>
              </div>
              {customProviders.map((c) =>
                renderKeyRow("custom_" + c.id, c.label, "Sua API key...", undefined, () => removeCustomProvider(c.id))
              )}
            </>
          )}

          {/* Add custom */}
          <div className="border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Adicionar Provedor</p>
            <div className="flex gap-2">
              <Input
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="Nome do provedor..."
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => e.key === "Enter" && addCustomProvider()}
              />
              <Button variant="outline" size="sm" className="h-8" onClick={addCustomProvider}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
