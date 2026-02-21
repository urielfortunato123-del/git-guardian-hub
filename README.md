# 🧬 GenLab Engine

**Software nasce aqui** — Importar, Analisar, Recriar, Rodar, Instalar.

GenLab é uma plataforma desktop + web que permite importar qualquer projeto (GitHub, ZIP, Lovable), analisar sua stack automaticamente, recriar uma versão local melhorada com IA, executar sem nuvem e gerar instaladores nativos (.exe, .dmg, .AppImage).

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Local (Dev)](#-instalação-local-dev)
- [Configuração da IA Local](#-configuração-da-ia-local)
- [Gerar Instalador Windows (.exe)](#-gerar-instalador-windows-exe)
- [Gerar Instalador macOS (.dmg)](#-gerar-instalador-macos-dmg)
- [Gerar Instalador Linux (.AppImage / .deb)](#-gerar-instalador-linux-appimage--deb)
- [Build Automático via GitHub Actions](#-build-automático-via-github-actions)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Endpoints da API (Agent)](#-endpoints-da-api-agent)
- [Funcionalidades](#-funcionalidades)
- [Configuração Electron](#-configuração-electron)
- [Troubleshooting](#-troubleshooting)

---

## 🔭 Visão Geral

| Feature | Descrição |
|---------|-----------|
| **Importar** | Clone de GitHub (público/privado) ou upload ZIP |
| **Analisar** | Detecção automática de stack (React, Vue, Angular, Node, Python, Go, Rust, Java, Docker) |
| **Recriar** | IA local (Ollama/LM Studio) recria o projeto com melhorias |
| **Auto-Fix** | Detecta erros de build/lint e corrige automaticamente com IA |
| **Rodar** | Executa projetos localmente (npm, Docker, Python) |
| **Instalador** | Gera .exe / .dmg / .AppImage via Electron Builder |
| **Backup** | Sistema de snapshots com restore automático |
| **Templates** | Marketplace de templates prontos (SaaS, E-Commerce, IA, etc.) |
| **Desktop** | App Electron com splash screen, auto-update e daemon integrado |

---

## 🏗 Arquitetura

```
┌──────────────────────────────────────────────────┐
│                   ELECTRON SHELL                  │
│  ┌─────────────┐     ┌─────────────────────────┐ │
│  │  Splash      │     │  Main Window (Chromium)  │ │
│  │  Screen      │────▶│  React + Vite + Tailwind │ │
│  └─────────────┘     └──────────┬──────────────┘ │
│                                  │ HTTP :8787      │
│  ┌──────────────────────────────┴──────────────┐ │
│  │         AGENT DAEMON (Python/FastAPI)         │ │
│  │  ┌────────────┐ ┌──────────┐ ┌────────────┐ │ │
│  │  │ Analyzer   │ │ CodeGen  │ │  Runner    │ │ │
│  │  │ (classify) │ │ (LLM)    │ │ (exec/build│ │ │
│  │  └────────────┘ └──────────┘ └────────────┘ │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
         │                    │
    ┌────┴────┐         ┌────┴────┐
    │ Ollama  │         │LM Studio│
    │ (local) │         │ (local) │
    └─────────┘         └─────────┘
```

---

## ✅ Pré-requisitos

### Obrigatórios

| Software | Versão Mínima | Instalação |
|----------|--------------|------------|
| **Node.js** | 20+ | [nvm](https://github.com/nvm-sh/nvm) ou [nodejs.org](https://nodejs.org) |
| **Python** | 3.10+ | [python.org](https://python.org) |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com) |

### Opcionais (para IA local)

| Software | Para quê | Instalação |
|----------|----------|------------|
| **Ollama** | Rodar modelos IA locais | [ollama.ai](https://ollama.ai) |
| **LM Studio** | Alternativa GUI para IA | [lmstudio.ai](https://lmstudio.ai) |
| **Docker** | Rodar projetos containerizados | [docker.com](https://docker.com) |

### Para build Windows (.exe)

| Software | Versão | Nota |
|----------|--------|------|
| **Windows 10/11** | 64-bit | Build nativo requer Windows |
| **Visual Studio Build Tools** | 2019+ | Para compilação de módulos nativos |

---

## 🚀 Instalação Local (Dev)

### 1. Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/genlab.git
cd genlab
```

### 2. Instalar dependências do frontend

```bash
npm install
```

### 3. Instalar dependências do agent Python

```bash
cd agent
pip install -r requirements.txt
cd ..
```

### 4. Rodar em modo desenvolvimento

**Terminal 1 — Agent (backend):**
```bash
cd agent
python agent.py
# 🧬 GenLab Engine running at http://127.0.0.1:8787
```

**Terminal 2 — Frontend (Vite):**
```bash
npm run dev
# Abre em http://localhost:8080
```

**Terminal 3 — Electron (opcional, para testar desktop):**
```bash
npx electron .
```

### 5. Verificar que tudo funciona

- Acesse `http://localhost:8080` no browser
- Verifique o status "Agent Online" no topo da página GenLab Engine
- Teste importar um projeto via GitHub URL

---

## 🤖 Configuração da IA Local

### Opção A: Ollama (Recomendado)

```bash
# 1. Instalar Ollama
curl -fsSL https://ollama.ai/install.sh | sh    # Linux/Mac
# Windows: baixe em https://ollama.ai/download

# 2. Baixar modelo (escolha um)
ollama pull gemma3          # 4GB — Recomendado para PCs com 8GB+ RAM
ollama pull codellama:7b    # 4GB — Otimizado para código
ollama pull deepseek-coder  # 4GB — Bom para geração de código
ollama pull llama3.1:8b     # 5GB — Mais potente, precisa 16GB+ RAM

# 3. Verificar que está rodando
ollama list
curl http://127.0.0.1:11434/v1/models
```

### Opção B: LM Studio

1. Baixe em [lmstudio.ai](https://lmstudio.ai)
2. Instale um modelo (ex: `TheBloke/CodeLlama-7B-GGUF`)
3. Inicie o servidor local (porta padrão: 1234)
4. Configure no GenLab:
   - Provider: `lmstudio`
   - Model: nome do modelo carregado
   - Base URL: `http://127.0.0.1:1234/v1`

### Configurar no GenLab

Na página GenLab Engine → seção "Configuração IA Local":

| Campo | Ollama | LM Studio |
|-------|--------|-----------|
| Provider | `ollama` | `lmstudio` |
| Modelo | `gemma3` | (nome do modelo) |
| Base URL | `http://127.0.0.1:11434/v1` | `http://127.0.0.1:1234/v1` |

---

## 🪟 Gerar Instalador Windows (.exe)

### Método 1: Build Local no Windows

> ⚠️ **Requer Windows 10/11 64-bit**

```powershell
# 1. Abrir PowerShell como Administrador

# 2. Instalar dependências
npm install

# 3. Build do frontend
npm run build

# 4. Gerar instalador .exe
npx electron-builder --win

# 5. Resultado
# O instalador estará em: release/GenLab-Setup-X.X.X-win.exe
```

**Opções do instalador gerado:**
- Instalador NSIS com interface
- Permite escolher pasta de instalação
- Cria atalho na Área de Trabalho
- Inclui o Agent Python embutido

### Método 2: Build via GitHub Actions (Recomendado)

> ✅ **Não precisa de Windows local — builds na nuvem**

1. Configure o repositório no `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: SEU_USUARIO_GITHUB
  repo: SEU_REPOSITORIO
```

2. Crie uma tag e faça push:

```bash
# Atualize a versão no package.json primeiro
git add .
git commit -m "release: v1.0.0"
git tag v1.0.0
git push origin main --tags
```

3. O GitHub Actions vai automaticamente:
   - Compilar o frontend (React + Vite)
   - Empacotar com Electron Builder
   - Gerar `GenLab-Setup-1.0.0-win.exe`
   - Publicar como GitHub Release

4. Baixe o .exe na aba **Releases** do seu repositório.

### Método 3: Cross-compilation (Linux/Mac → Windows)

> ⚠️ Pode apresentar instabilidades. Prefira Método 2.

```bash
# Instalar Wine (necessário para builds Windows no Linux)
sudo apt install wine64    # Ubuntu/Debian
brew install --cask wine-stable  # macOS

# Build
npx electron-builder --win --x64
```

---

## 🍎 Gerar Instalador macOS (.dmg)

### Build Local

```bash
# Requer macOS
npm install
npm run build
npx electron-builder --mac

# Resultado: release/GenLab-X.X.X-mac-arm64.dmg (Apple Silicon)
#            release/GenLab-X.X.X-mac-x64.dmg (Intel)
```

### Via GitHub Actions

O workflow `build-desktop.yml` gera automaticamente DMGs para x64 e arm64 ao criar uma tag.

> 📝 Para assinar e notarizar o app (necessário para distribuição), configure:
> - `CSC_LINK` — Certificado Developer ID (base64)
> - `CSC_KEY_PASSWORD` — Senha do certificado
> - `APPLE_ID` / `APPLE_APP_SPECIFIC_PASSWORD` — Para notarização

---

## 🐧 Gerar Instalador Linux (.AppImage / .deb)

```bash
npm install
npm run build
npx electron-builder --linux

# Resultado:
# release/GenLab-X.X.X-linux-x64.AppImage
# release/GenLab-X.X.X-linux-x64.deb
```

---

## 🔄 Build Automático via GitHub Actions

O arquivo `.github/workflows/build-desktop.yml` automatiza builds para **todas as plataformas**.

### Trigger

```yaml
on:
  push:
    tags:
      - 'v*'         # Qualquer tag que comece com 'v'
  workflow_dispatch:  # Ou manualmente pelo GitHub
```

### Como usar

```bash
# 1. Commit suas alterações
git add .
git commit -m "feat: nova funcionalidade"

# 2. Crie a tag de versão
git tag v1.0.0

# 3. Push com tags
git push origin main --tags

# 4. Aguarde os builds (5-15 min)
# Acompanhe em: GitHub → Actions → Build Desktop Installers
```

### Artefatos gerados

| Plataforma | Artefato | Localização |
|------------|----------|-------------|
| Windows | `GenLab-Setup-1.0.0-win.exe` | Releases + Artifacts |
| macOS x64 | `GenLab-1.0.0-mac-x64.dmg` | Releases + Artifacts |
| macOS ARM | `GenLab-1.0.0-mac-arm64.dmg` | Releases + Artifacts |
| Linux | `GenLab-1.0.0-linux-x64.AppImage` | Releases + Artifacts |
| Linux | `GenLab-1.0.0-linux-x64.deb` | Releases + Artifacts |

### Configurar auto-update

O Electron auto-updater verifica novas releases no GitHub automaticamente. Configure o `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: SEU_USUARIO
  repo: SEU_REPO
```

O app verificará atualizações 5 segundos após abrir e notificará o usuário.

---

## 📁 Estrutura do Projeto

```
genlab/
├── agent/                          # Backend Python (FastAPI)
│   ├── agent.py                    # Servidor principal — endpoints REST
│   ├── project_analyzer.py         # Classificação automática de projetos
│   ├── code_generator.py           # Geração de código via IA local
│   ├── prompt_templates.py         # Templates de prompt para LLMs
│   ├── runner.py                   # Execução local + build de instaladores
│   ├── license.py                  # Sistema de licenciamento
│   └── requirements.txt            # Dependências Python
│
├── electron/                       # App Desktop
│   ├── main.js                     # Processo principal Electron
│   ├── preload.js                  # Bridge segura renderer ↔ main
│   └── splash.html                 # Splash screen animada
│
├── src/                            # Frontend React
│   ├── pages/
│   │   ├── GenLabEnginePage.tsx     # Dashboard principal do GenLab
│   │   ├── TemplatesPage.tsx       # Marketplace de templates
│   │   ├── EditorPage.tsx          # Editor de código (Monaco)
│   │   ├── DashboardPage.tsx       # Painel geral
│   │   └── ...
│   ├── components/
│   │   ├── layout/AppLayout.tsx    # Layout com sidebar
│   │   ├── AIChat.tsx              # Chat com IA
│   │   ├── LiveCodePreview.tsx     # Preview ao vivo
│   │   └── ...
│   ├── services/
│   │   ├── genlab-api.ts           # Client TypeScript para o Agent
│   │   └── ai.ts                   # Integração com modelos IA
│   └── hooks/                      # React hooks customizados
│
├── public/
│   ├── extension/                  # Extensão Chrome (companion)
│   └── icon.png                    # Ícone do app
│
├── .github/workflows/
│   ├── build-desktop.yml           # CI/CD — builds multi-plataforma
│   └── build-python-protected.yml  # Build Python protegido
│
├── electron-builder.yml            # Config do Electron Builder
├── vite.config.ts                  # Config do Vite
├── tailwind.config.ts              # Config do Tailwind CSS
├── package.json                    # Dependências Node.js
└── tsconfig.json                   # Config TypeScript
```

---

## 🔌 Endpoints da API (Agent)

O Agent roda em `http://127.0.0.1:8787` e expõe os seguintes endpoints:

### Health & Config

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Status do agent |
| `GET` | `/v1/genlab/llm-config` | Config atual do LLM |
| `POST` | `/v1/genlab/llm-config` | Atualizar config LLM |

### Importação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/import/github` | Clonar repo GitHub |
| `POST` | `/v1/import/zip` | Upload ZIP |

### Projeto

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/v1/project/tree?project_id=X` | Listar arquivos |
| `GET` | `/v1/project/file?project_id=X&path=Y` | Ler arquivo |
| `GET` | `/v1/project/files-batch?project_id=X&paths=a,b,c` | Ler vários arquivos |
| `POST` | `/v1/project/write-file` | Escrever arquivo |
| `POST` | `/v1/project/write-files` | Escrever múltiplos arquivos |
| `POST` | `/v1/patch/apply` | Aplicar patch (unified diff) |

### GenLab Engine

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/genlab/analyze` | Analisar e classificar projeto |
| `POST` | `/v1/genlab/recreate` | Recriar com IA |
| `GET` | `/v1/genlab/projects` | Listar projetos gerados |
| `GET` | `/v1/genlab/project/tree?name=X` | Arquivos do projeto gerado |
| `POST` | `/v1/genlab/run` | Executar projeto |
| `POST` | `/v1/genlab/build-installer` | Gerar instalador nativo |
| `POST` | `/v1/genlab/auto-fix` | Auto-corrigir erros com IA |

### Backup

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/backup/create` | Criar snapshot |
| `GET` | `/v1/backup/list?project_id=X` | Listar backups |
| `POST` | `/v1/backup/restore` | Restaurar backup |
| `DELETE` | `/v1/backup/delete?backup_id=X` | Deletar backup |

### Build & Deploy

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/build` | Build (PyInstaller/Maven) |
| `POST` | `/v1/tests/run` | Rodar testes |
| `POST` | `/v1/github/push` | Push para GitHub |

### Licença

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/license/activate` | Ativar licença |
| `GET` | `/v1/license/status` | Status da licença |

---

## ⚡ Funcionalidades

### 🔍 Análise de Projetos
Detecta automaticamente:
- **Stacks**: React, Vue, Angular, Node, Python, Go, Rust, Java
- **Características**: Frontend, Backend, Docker, Testes
- **Frameworks**: Express, FastAPI, Django, Spring, etc.
- **Contagem de arquivos** com filtro inteligente (.gitignore respeitado)

### 🧬 Recriação com IA
1. Analisa o projeto original
2. Gera prompt otimizado com a classificação
3. Envia para LLM local (Ollama/LM Studio)
4. Recria todos os arquivos com melhorias automáticas
5. Salva em `~/.infinity_agent/generated/`

### 🔧 Auto-Fix
1. Roda `npm install`, `tsc --noEmit`, ou `py_compile`
2. Coleta todos os erros
3. Envia código + erros para o LLM
4. Aplica correções automaticamente

### 📦 Geração de Instaladores
| Tipo de Projeto | Instalador | Método |
|----------------|------------|--------|
| Web (React/Vue/etc) | .exe/.dmg/.AppImage | Electron wrapper automático |
| Electron existente | .exe/.dmg/.AppImage | Electron Builder direto |
| Python | executável standalone | PyInstaller |

### 🔄 Auto-Update (Desktop)
- Verifica novas versões no GitHub Releases
- Download e instalação com um clique
- Progress bar na janela durante download

---

## ⚙️ Configuração Electron

### `electron-builder.yml`

```yaml
appId: app.genlab.desktop
productName: GenLab
copyright: Copyright © 2025 GenLab

publish:
  provider: github
  owner: SEU_USUARIO      # ← Altere para seu usuário GitHub
  repo: SEU_REPOSITORIO   # ← Altere para seu repositório

directories:
  output: release

files:
  - dist/**/*
  - electron/**/*
  - public/icon.png

extraResources:
  - from: agent/
    to: agent/
    filter:
      - "**/*.py"
      - "**/*.txt"

win:
  target: nsis
  icon: public/icon.png
  artifactName: GenLab-Setup-${version}-win.${ext}

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true

mac:
  target: dmg
  icon: public/icon.png
  category: public.app-category.developer-tools

linux:
  target:
    - AppImage
    - deb
  icon: public/icon.png
  category: Development
```

### Scripts úteis para `package.json`

```json
{
  "scripts": {
    "dev": "vite --port 8080",
    "build": "vite build",
    "electron:dev": "concurrently \"vite --port 8081\" \"wait-on http://localhost:8081 && electron .\"",
    "electron:build:win": "vite build && electron-builder --win",
    "electron:build:mac": "vite build && electron-builder --mac",
    "electron:build:linux": "vite build && electron-builder --linux",
    "agent": "cd agent && python agent.py"
  }
}
```

---

## 🐛 Troubleshooting

### Agent não conecta

```bash
# Verificar se o agent está rodando
curl http://127.0.0.1:8787/health

# Verificar dependências Python
cd agent && pip install -r requirements.txt

# Rodar manualmente com debug
python agent.py
```

### Ollama não responde

```bash
# Verificar status
ollama list
curl http://127.0.0.1:11434/v1/models

# Reiniciar Ollama
systemctl restart ollama          # Linux
brew services restart ollama      # macOS
# Windows: reinicie pelo system tray
```

### Build Windows falha

```
# Erro: "Cannot find module electron"
npm install electron electron-builder --save-dev

# Erro: "NSIS error" 
npm cache clean --force
npm install

# Erro de permissão
# Execute PowerShell como Administrador
```

### Build macOS falha com "code signing"

```bash
# Para desenvolvimento (sem assinatura):
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac

# Para distribuição, configure certificado Apple Developer
```

### Erro "Python not found" no Electron

O Electron tenta encontrar Python automaticamente. Certifique-se que `python3` ou `python` está no PATH:

```bash
# Verificar
python3 --version
# ou
python --version

# Se necessário, criar alias
alias python3=python
```

---

## 📄 Licença

Proprietário — © 2025 GenLab. Todos os direitos reservados.

---

## 🤝 Contribuição

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commit: `git commit -m 'feat: minha feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

<p align="center">
  <strong>🧬 GenLab Engine</strong><br>
  Software nasce aqui.
</p>
