import { useState } from "react";
import { 
  BookOpen, Monitor, Cloud, Download, Terminal, Cpu, GitBranch, 
  FolderUp, Sparkles, Wrench, Stethoscope, Workflow, Rocket,
  ChevronDown, ChevronRight, ExternalLink, Copy, Check,
  Server, Shield, Zap, HardDrive, Globe, Settings
} from "lucide-react";

interface Section {
  id: string;
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

function CopyBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-background border border-border rounded-lg p-4 text-sm font-mono overflow-x-auto text-foreground">
        {code}
      </pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-secondary/80 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function Accordion({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 bg-card hover:bg-secondary/30 transition-colors text-left">
        <Icon className="w-5 h-5 text-primary flex-shrink-0" />
        <span className="font-semibold text-foreground flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 py-4 border-t border-border space-y-4 text-sm text-muted-foreground leading-relaxed">{children}</div>}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-sm font-bold text-primary">{n}</span>
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-foreground mb-1">{title}</h4>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function GuidePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Como Usar o LovHub</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Guia completo para todas as funcionalidades da plataforma. 
            Desde a configuração inicial até deploy e geração de executáveis.
          </p>
        </div>

        {/* Quick Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Sparkles, label: "AI Editor", desc: "Edite código com IA" },
            { icon: Workflow, label: "Agente", desc: "Análise e melhorias" },
            { icon: Wrench, label: "Melhorias", desc: "Modificação direta" },
            { icon: Stethoscope, label: "Repo Doctor", desc: "Diagnóstico de repos" },
          ].map(({ icon: I, label, desc }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center space-y-2">
              <I className="w-6 h-6 text-primary mx-auto" />
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-3">

          {/* 1. Instalação e Setup */}
          <Accordion title="1. Instalação e Configuração Inicial" icon={Download} defaultOpen>
            <p className="text-foreground font-medium">Existem 3 formas de usar o LovHub:</p>

            <div className="space-y-5 mt-3">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Opção A: Versão Web (Online)
                </h4>
                <p>Acesse diretamente pelo navegador. Funciona com IA na nuvem (OpenRouter, Lovable AI). Não requer instalação.</p>
                <p className="text-xs text-yellow-400">⚠️ Limitação: não conecta com IAs locais (LM Studio/Ollama) por restrições de segurança do navegador (Mixed Content).</p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" /> Opção B: Rodar Localmente (Recomendado)
                </h4>
                <p>Clone o projeto e rode no seu computador. Permite usar IAs locais sem restrições.</p>
                <div className="space-y-2">
                  <Step n={1} title="Clone o repositório">
                    <CopyBlock code={`git clone <url-do-seu-repo>\ncd <nome-do-repo>`} />
                  </Step>
                  <Step n={2} title="Instale as dependências">
                    <CopyBlock code="npm install" />
                  </Step>
                  <Step n={3} title="Inicie o servidor de desenvolvimento">
                    <CopyBlock code="npm run dev" />
                  </Step>
                  <Step n={4} title="Acesse no navegador">
                    <p>Abra <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground">http://localhost:8081</code></p>
                  </Step>
                </div>
                <p className="text-xs text-green-400">✅ Requisito: Node.js 18+ instalado</p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" /> Opção C: App Desktop (Electron)
                </h4>
                <p>Programa instalável para Windows, macOS e Linux com janela nativa.</p>
                <div className="space-y-2">
                  <Step n={1} title="Clone e instale">
                    <CopyBlock code={`git clone <url-do-repo>\ncd <nome-do-repo>\nnpm install`} />
                  </Step>
                  <Step n={2} title="Rode em modo desenvolvimento">
                    <CopyBlock code={`# Terminal 1: servidor web\nnpm run dev\n\n# Terminal 2: electron\nnpx electron .`} />
                  </Step>
                  <Step n={3} title="Gere o instalador para sua plataforma">
                    <CopyBlock code={`npm run build\n\n# Windows:\nnpx electron-builder --win\n\n# macOS:\nnpx electron-builder --mac\n\n# Linux:\nnpx electron-builder --linux`} />
                  </Step>
                </div>
                <p className="text-xs">Os instaladores ficam na pasta <code className="bg-secondary px-1 rounded text-foreground">release/</code></p>
              </div>
            </div>
          </Accordion>

          {/* 2. Configurar IA */}
          <Accordion title="2. Configurar Modelos de IA" icon={Cpu}>
            <p>O LovHub suporta múltiplos provedores de IA. Configure em <strong className="text-foreground">Modelos IA</strong> no menu lateral.</p>

            <div className="space-y-4 mt-3">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">☁️ IA na Nuvem (OpenRouter)</h4>
                <div className="space-y-2">
                  <Step n={1} title="Crie uma conta no OpenRouter">
                    <p>Acesse <code className="bg-secondary px-1 rounded text-foreground">openrouter.ai</code> e crie uma conta gratuita.</p>
                  </Step>
                  <Step n={2} title="Gere uma API Key">
                    <p>No painel do OpenRouter, vá em <strong className="text-foreground">Keys</strong> → <strong className="text-foreground">Create Key</strong>.</p>
                  </Step>
                  <Step n={3} title="Configure no LovHub">
                    <p>Vá em <strong className="text-foreground">Modelos IA</strong> → clique no ícone ⚙️ → cole a API Key do OpenRouter.</p>
                  </Step>
                </div>
                <p className="text-xs text-muted-foreground">Modelos disponíveis: GPT-4o, Claude 3.5, Gemini 2.0 Flash, Llama 3, Mixtral, e mais.</p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">🖥️ IA Local (LM Studio / Ollama)</h4>
                <div className="space-y-2">
                  <Step n={1} title="Instale o LM Studio ou Ollama">
                    <p><strong className="text-foreground">LM Studio:</strong> Baixe em <code className="bg-secondary px-1 rounded text-foreground">lmstudio.ai</code></p>
                    <p><strong className="text-foreground">Ollama:</strong> Baixe em <code className="bg-secondary px-1 rounded text-foreground">ollama.com</code></p>
                  </Step>
                  <Step n={2} title="Baixe um modelo">
                    <p>No LM Studio: busque e baixe um modelo (ex: Qwen 2.5, Llama 3).</p>
                    <p>No Ollama: <code className="bg-secondary px-1 rounded text-foreground">ollama pull llama3</code></p>
                  </Step>
                  <Step n={3} title="Inicie o servidor local">
                    <p><strong className="text-foreground">LM Studio:</strong> Vá em "Local Server" → ative "Start Server" → habilite CORS.</p>
                    <p><strong className="text-foreground">Ollama:</strong> já roda automaticamente na porta 11434.</p>
                  </Step>
                  <Step n={4} title="Configure no LovHub">
                    <p>Em <strong className="text-foreground">Modelos IA</strong>, adicione um endpoint local:</p>
                    <CopyBlock code={`Nome: LM Studio\nURL: http://localhost:1234/v1\n\nNome: Ollama\nURL: http://localhost:11434/v1`} />
                  </Step>
                </div>
                <p className="text-xs text-yellow-400">⚠️ IA local só funciona rodando o LovHub localmente (Opção B ou C).</p>
              </div>
            </div>
          </Accordion>

          {/* 3. AI Editor */}
          <Accordion title="3. AI Editor — Editar Código com IA" icon={Sparkles}>
            <p>O AI Editor permite fazer upload de um projeto local e usar IA para editar os arquivos.</p>
            
            <div className="space-y-3 mt-3">
              <Step n={1} title="Acesse o AI Editor">
                <p>No menu lateral, clique em <strong className="text-foreground">AI Editor</strong>.</p>
              </Step>
              <Step n={2} title="Faça upload da pasta do projeto">
                <p>Clique em <strong className="text-foreground">"Selecionar Pasta"</strong> e escolha a pasta raiz do seu projeto. Arquivos pesados (node_modules, binários) são ignorados automaticamente.</p>
              </Step>
              <Step n={3} title="Navegue pelos arquivos">
                <p>A árvore de arquivos aparece à esquerda. Clique em qualquer arquivo para abrir no editor Monaco (mesmo editor do VS Code).</p>
              </Step>
              <Step n={4} title="Converse com a IA">
                <p>No painel direito, descreva o que quer alterar. A IA vê todos os seus arquivos e gera código completo. Exemplos:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>"Adicione autenticação JWT neste projeto"</li>
                  <li>"Refatore o componente UserCard para usar TypeScript"</li>
                  <li>"Crie uma página de dashboard com gráficos"</li>
                  <li>"Corrija o bug no formulário de cadastro"</li>
                </ul>
              </Step>
              <Step n={5} title="Aplique as alterações">
                <p>A IA gera arquivos completos que aparecem no preview. Clique em <strong className="text-foreground">"Aplicar"</strong> para integrar ao projeto ou <strong className="text-foreground">"Aplicar Tudo"</strong> para aplicar todos de uma vez.</p>
              </Step>
              <Step n={6} title="Baixe o projeto editado">
                <p>Clique no ícone de <strong className="text-foreground">Download (⬇️)</strong> na árvore de arquivos para baixar como ZIP.</p>
              </Step>
            </div>

            <div className="bg-primary/10 rounded-lg p-3 mt-3 text-xs">
              <strong className="text-primary">💡 Dica:</strong> Você pode arrastar e soltar imagens, PDFs e ZIPs diretamente no chat. A IA analisa imagens como referência de design e lê o conteúdo de arquivos de texto.
            </div>
          </Accordion>

          {/* 4. Agente */}
          <Accordion title="4. Agente — Análise e Plano de Ação" icon={Workflow}>
            <p>O Agente analisa seu projeto completo, identifica problemas e gera um plano de melhorias automatizado.</p>

            <div className="space-y-3 mt-3">
              <Step n={1} title="Conecte um repositório">
                <p>No menu lateral, clique em <strong className="text-foreground">Agente</strong>. Você pode:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Importar do GitHub (cole a URL do repo)</li>
                  <li>Fazer upload de uma pasta local</li>
                </ul>
              </Step>
              <Step n={2} title="Análise automática">
                <p>O agente detecta a stack (React, Python, Java...) e analisa:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>📊 Estrutura do código</li>
                  <li>🔒 Segurança</li>
                  <li>📦 Dependências</li>
                  <li>⚡ Qualidade e performance</li>
                </ul>
              </Step>
              <Step n={3} title="Selecione melhorias">
                <p>O agente sugere melhorias categorizadas por prioridade (crítica, alta, média, baixa). Selecione as que deseja aplicar.</p>
              </Step>
              <Step n={4} title="Gere o plano de ação">
                <p>Clique em <strong className="text-foreground">"Gerar Plano"</strong>. O agente cria etapas detalhadas com estimativa de linhas alteradas e nível de risco.</p>
              </Step>
              <Step n={5} title="Aplique os patches">
                <p>Para cada etapa, clique em <strong className="text-foreground">"Gerar Patch"</strong>. O código é gerado via streaming e pode ser revisado no diff viewer antes de aplicar.</p>
              </Step>
            </div>
          </Accordion>

          {/* 5. Melhorias & Alterações */}
          <Accordion title="5. Melhorias & Alterações — Modificação Direta" icon={Wrench}>
            <p>Essa página permite que a IA faça alterações diretamente nos arquivos do projeto no disco, com sistema de backup integrado.</p>

            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 text-xs text-yellow-400 mb-3">
              ⚠️ Requer o Daemon Local rodando. Veja a seção "Daemon Local" abaixo.
            </div>

            <div className="space-y-3">
              <Step n={1} title="Inicie o Daemon Local">
                <CopyBlock code="cd agent && python agent.py" />
                <p className="mt-1">O daemon roda em <code className="bg-secondary px-1 rounded text-foreground">http://127.0.0.1:8787</code></p>
              </Step>
              <Step n={2} title="Importe um projeto">
                <p>Primeiro, importe o projeto via GitHub ou ZIP usando o Agente. Isso cria uma pasta em <code className="bg-secondary px-1 rounded text-foreground">~/.infinity_agent/projects/</code>.</p>
              </Step>
              <Step n={3} title="Conecte ao projeto">
                <p>Em <strong className="text-foreground">Melhorias</strong>, digite o ID do projeto (nome da pasta) e conecte.</p>
              </Step>
              <Step n={4} title="Peça alterações via chat">
                <p>Descreva o que quer modificar. A IA gera o código e aplica automaticamente nos arquivos. Exemplos:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>"Adicione tratamento de erros em todos os endpoints"</li>
                  <li>"Crie testes unitários para os componentes"</li>
                  <li>"Refatore o código para melhor organização"</li>
                </ul>
              </Step>
              <Step n={5} title="Backups automáticos">
                <p>Antes de cada alteração, um backup é criado automaticamente. Você também pode criar backups manuais clicando em <strong className="text-foreground">"Criar Backup"</strong>.</p>
              </Step>
              <Step n={6} title="Restaurar versão anterior">
                <p>Clique em <strong className="text-foreground">"Backups"</strong> no header → escolha o backup → <strong className="text-foreground">"Restaurar"</strong>. Um backup automático é feito antes da restauração.</p>
              </Step>
            </div>
          </Accordion>

          {/* 6. Daemon Local */}
          <Accordion title="6. Daemon Local — Servidor de Automação" icon={Server}>
            <p>O Daemon é um servidor Python que roda na sua máquina para operações pesadas como clonagem Git, testes e manipulação de arquivos.</p>

            <div className="space-y-3 mt-3">
              <Step n={1} title="Instale as dependências Python">
                <CopyBlock code={`cd agent\npip install -r requirements.txt`} />
              </Step>
              <Step n={2} title="Inicie o Daemon">
                <CopyBlock code="python agent.py" />
                <p className="mt-1">Saída esperada:</p>
                <CopyBlock code={`🚀 Lovable Infinity Agent running at http://127.0.0.1:8787\n📁 Workspace: ~/.infinity_agent`} />
              </Step>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold text-foreground mb-2">Endpoints disponíveis:</h4>
              <div className="space-y-2 font-mono text-xs">
                {[
                  { method: "GET", path: "/health", desc: "Status do daemon" },
                  { method: "POST", path: "/v1/import/github", desc: "Clonar repo do GitHub" },
                  { method: "POST", path: "/v1/import/zip", desc: "Importar projeto ZIP" },
                  { method: "GET", path: "/v1/project/tree", desc: "Listar arquivos do projeto" },
                  { method: "GET", path: "/v1/project/file", desc: "Ler um arquivo" },
                  { method: "POST", path: "/v1/project/write-files", desc: "Escrever arquivos" },
                  { method: "POST", path: "/v1/patch/apply", desc: "Aplicar patch unified diff" },
                  { method: "POST", path: "/v1/tests/run", desc: "Rodar testes do projeto" },
                  { method: "POST", path: "/v1/backup/create", desc: "Criar backup" },
                  { method: "GET", path: "/v1/backup/list", desc: "Listar backups" },
                  { method: "POST", path: "/v1/backup/restore", desc: "Restaurar backup" },
                  { method: "POST", path: "/v1/github/push", desc: "Push para GitHub" },
                  { method: "POST", path: "/v1/build", desc: "Gerar executável" },
                ].map(({ method, path, desc }) => (
                  <div key={path} className="flex items-center gap-2 bg-secondary/30 rounded px-3 py-2">
                    <span className={`font-bold w-12 ${method === "GET" ? "text-green-400" : "text-blue-400"}`}>{method}</span>
                    <span className="text-foreground flex-1">{path}</span>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </Accordion>

          {/* 7. Deploy */}
          <Accordion title="7. Deploy e Publicação" icon={Rocket}>
            <p>Publique seu projeto de várias formas:</p>

            <div className="space-y-4 mt-3">
              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">🔀 Push para GitHub</h4>
                <p>O agente pode fazer push das alterações diretamente para o GitHub, criando um branch e commit automático.</p>
                <p>Configure seu token do GitHub em <strong className="text-foreground">Dashboard</strong> → <strong className="text-foreground">"Conectar GitHub"</strong>.</p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">📦 Exportar como ZIP</h4>
                <p>No AI Editor, clique no ícone de download para baixar o projeto completo como ZIP.</p>
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">🖥️ App Desktop (Electron)</h4>
                <p>Gere instaladores nativos para Windows (.exe), macOS (.dmg) e Linux (.AppImage).</p>
                <CopyBlock code={`npm run build\nnpx electron-builder --win    # Windows\nnpx electron-builder --mac    # macOS\nnpx electron-builder --linux  # Linux`} />
              </div>

              <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-foreground">📱 Android (APK)</h4>
                <p>O projeto suporta exportação para Android via Capacitor. Acesse em <strong className="text-foreground">Deploy</strong> → <strong className="text-foreground">Android</strong>.</p>
              </div>
            </div>
          </Accordion>

          {/* 8. Dicas */}
          <Accordion title="8. Dicas e Boas Práticas" icon={Zap}>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <h4 className="font-medium text-foreground">Seja específico nos prompts</h4>
                  <p>Em vez de "melhore o código", diga "adicione validação de email no formulário de cadastro em src/components/RegisterForm.tsx".</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl">📁</span>
                <div>
                  <h4 className="font-medium text-foreground">Projetos grandes? Filtre os arquivos</h4>
                  <p>Para projetos com muitos arquivos, o agente pode estourar o limite de tokens. Foque nos arquivos relevantes ou use IA local com contexto maior.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl">💾</span>
                <div>
                  <h4 className="font-medium text-foreground">Sempre faça backup antes de alterações grandes</h4>
                  <p>Use a funcionalidade de backup em "Melhorias" ou faça commit no Git antes de aplicar patches do agente.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl">🔑</span>
                <div>
                  <h4 className="font-medium text-foreground">Configure API Keys com segurança</h4>
                  <p>Nunca compartilhe suas API keys. O LovHub armazena as chaves localmente no navegador (localStorage), não em servidores externos.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-xl">🤖</span>
                <div>
                  <h4 className="font-medium text-foreground">Combine IA local + nuvem</h4>
                  <p>Use IA local (grátis, privada) para tarefas rápidas e IA na nuvem (mais poderosa) para refatorações complexas.</p>
                </div>
              </div>
            </div>
          </Accordion>

          {/* 9. Requisitos */}
          <Accordion title="9. Requisitos do Sistema" icon={HardDrive}>
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Versão Web (mínimo):</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Navegador moderno (Chrome, Firefox, Edge, Safari)</li>
                <li>Conexão com internet</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">Versão Local (recomendado):</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Node.js 18+</li>
                <li>Python 3.9+ (para o Daemon)</li>
                <li>Git instalado</li>
                <li>8 GB RAM (mínimo)</li>
                <li>16 GB RAM (para IA local)</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">App Desktop (para build):</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Node.js 18+</li>
                <li>Windows: Windows 10+</li>
                <li>macOS: macOS 10.15+ com Xcode Command Line Tools</li>
                <li>Linux: Ubuntu 18.04+ ou equivalente</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">IA Local:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>LM Studio ou Ollama instalado</li>
                <li>16 GB RAM (para modelos 7B)</li>
                <li>32 GB RAM (para modelos 13B+)</li>
                <li>GPU com 8 GB VRAM (opcional, acelera muito)</li>
              </ul>
            </div>
          </Accordion>

        </div>

        <div className="text-center text-xs text-muted-foreground pb-8">
          LovHub v1.0 • Feito com ❤️ para desenvolvedores
        </div>
      </div>
    </div>
  );
}
