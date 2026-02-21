import { useState } from "react";
import {
  Smartphone, Monitor, Apple, Globe, Cpu, Layers, Terminal, Box,
  ArrowRight, Loader2, Download, X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface PlatformTarget {
  id: string;
  name: string;
  icon: React.ElementType;
  language: string;
  description: string;
  category: "mobile" | "desktop" | "web" | "backend" | "embedded";
}

export const PLATFORMS: PlatformTarget[] = [
  // Mobile
  { id: "android-kotlin", name: "Android (Kotlin)", icon: Smartphone, language: "Kotlin", description: "App nativo Android com Kotlin + Jetpack Compose", category: "mobile" },
  { id: "android-java", name: "Android (Java)", icon: Smartphone, language: "Java", description: "App nativo Android com Java + XML layouts", category: "mobile" },
  { id: "ios-swift", name: "iOS (Swift)", icon: Apple, language: "Swift", description: "App nativo iOS com SwiftUI", category: "mobile" },
  { id: "react-native", name: "React Native", icon: Smartphone, language: "TypeScript", description: "App cross-platform com React Native + Expo", category: "mobile" },
  { id: "flutter", name: "Flutter", icon: Smartphone, language: "Dart", description: "App cross-platform com Flutter + Dart", category: "mobile" },
  { id: "kotlin-multiplatform", name: "Kotlin Multiplatform", icon: Layers, language: "Kotlin", description: "App multiplataforma com KMP", category: "mobile" },

  // Desktop
  { id: "electron", name: "Electron", icon: Monitor, language: "TypeScript", description: "App desktop cross-platform com Electron", category: "desktop" },
  { id: "tauri", name: "Tauri", icon: Monitor, language: "Rust + TypeScript", description: "App desktop leve com Tauri + Rust", category: "desktop" },
  { id: "csharp-wpf", name: "Windows (C# WPF)", icon: Monitor, language: "C#", description: "App Windows nativo com WPF + .NET", category: "desktop" },
  { id: "csharp-winui", name: "Windows (WinUI 3)", icon: Monitor, language: "C#", description: "App Windows moderno com WinUI 3", category: "desktop" },
  { id: "macos-swift", name: "macOS (Swift)", icon: Apple, language: "Swift", description: "App macOS nativo com SwiftUI", category: "desktop" },
  { id: "javafx", name: "JavaFX", icon: Monitor, language: "Java", description: "App desktop cross-platform com JavaFX", category: "desktop" },
  { id: "python-tkinter", name: "Python (Tkinter)", icon: Terminal, language: "Python", description: "App desktop com Python + Tkinter", category: "desktop" },
  { id: "python-qt", name: "Python (PyQt)", icon: Terminal, language: "Python", description: "App desktop profissional com PyQt6", category: "desktop" },

  // Web
  { id: "react", name: "React", icon: Globe, language: "TypeScript", description: "Web app com React + Vite + TypeScript", category: "web" },
  { id: "nextjs", name: "Next.js", icon: Globe, language: "TypeScript", description: "Web app fullstack com Next.js", category: "web" },
  { id: "vue", name: "Vue.js", icon: Globe, language: "TypeScript", description: "Web app com Vue 3 + Composition API", category: "web" },
  { id: "svelte", name: "SvelteKit", icon: Globe, language: "TypeScript", description: "Web app com SvelteKit", category: "web" },
  { id: "html-css-js", name: "HTML/CSS/JS", icon: Globe, language: "JavaScript", description: "Web app vanilla sem framework", category: "web" },

  // Backend
  { id: "nodejs", name: "Node.js (Express)", icon: Terminal, language: "TypeScript", description: "API REST com Express + TypeScript", category: "backend" },
  { id: "python-fastapi", name: "Python (FastAPI)", icon: Terminal, language: "Python", description: "API moderna com FastAPI", category: "backend" },
  { id: "python-django", name: "Python (Django)", icon: Terminal, language: "Python", description: "Web app fullstack com Django", category: "backend" },
  { id: "go", name: "Go", icon: Terminal, language: "Go", description: "API de alta performance com Go", category: "backend" },
  { id: "rust-actix", name: "Rust (Actix)", icon: Terminal, language: "Rust", description: "API ultra-rápida com Actix Web", category: "backend" },
  { id: "csharp-aspnet", name: "C# (ASP.NET)", icon: Terminal, language: "C#", description: "API com ASP.NET Core", category: "backend" },
  { id: "java-spring", name: "Java (Spring Boot)", icon: Terminal, language: "Java", description: "API enterprise com Spring Boot", category: "backend" },

  // Embedded / CLI
  { id: "cli-python", name: "CLI (Python)", icon: Cpu, language: "Python", description: "Ferramenta de linha de comando em Python", category: "embedded" },
  { id: "cli-rust", name: "CLI (Rust)", icon: Cpu, language: "Rust", description: "Ferramenta de linha de comando em Rust", category: "embedded" },
  { id: "cli-go", name: "CLI (Go)", icon: Cpu, language: "Go", description: "Ferramenta de linha de comando em Go", category: "embedded" },
  { id: "arduino", name: "Arduino (C++)", icon: Box, language: "C++", description: "Firmware para Arduino/ESP32", category: "embedded" },
];

const CATEGORY_LABELS: Record<string, string> = {
  mobile: "📱 Mobile",
  desktop: "🖥️ Desktop",
  web: "🌐 Web",
  backend: "⚙️ Backend / API",
  embedded: "🔧 CLI / Embedded",
};

interface PlatformConverterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert: (platform: PlatformTarget) => void;
  isConverting: boolean;
  hasFiles: boolean;
}

export function PlatformConverter({ open, onOpenChange, onConvert, isConverting, hasFiles }: PlatformConverterProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformTarget | null>(null);
  const [filter, setFilter] = useState("");

  const categories = ["mobile", "desktop", "web", "backend", "embedded"];

  const filtered = filter.trim()
    ? PLATFORMS.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.language.toLowerCase().includes(filter.toLowerCase()) ||
        p.description.toLowerCase().includes(filter.toLowerCase())
      )
    : PLATFORMS;

  const handleConvert = () => {
    if (selectedPlatform) {
      onConvert(selectedPlatform);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5 text-primary" />
            Converter para outra plataforma
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            A IA irá reescrever todo o projeto para a plataforma escolhida
          </p>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Buscar plataforma... (ex: Android, Python, React)"
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Platform grid */}
        <div className="flex-1 overflow-auto px-5 pb-4 space-y-4">
          {categories.map(cat => {
            const items = filtered.filter(p => p.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {items.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p)}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                        selectedPlatform?.id === p.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40 hover:bg-secondary/40"
                      }`}
                    >
                      <p.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        selectedPlatform?.id === p.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{p.name}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{p.description}</div>
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground mt-1 font-mono">
                          {p.language}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma plataforma encontrada</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-card">
          <div className="text-xs text-muted-foreground">
            {selectedPlatform ? (
              <span className="text-foreground font-medium">
                {selectedPlatform.name} — {selectedPlatform.language}
              </span>
            ) : (
              "Selecione uma plataforma alvo"
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConvert}
              disabled={!selectedPlatform || isConverting || !hasFiles}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>
                  Converter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
