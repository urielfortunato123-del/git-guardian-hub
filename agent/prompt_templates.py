"""
GenLab Engine — Prompt Templates
Prompts dinâmicos por tipo de projeto para recriação inteligente.
"""

COMMON_REQUIREMENTS = """
REQUISITOS OBRIGATÓRIOS para o projeto recriado:
- Validação de formulários com feedback visual
- Logs estruturados (console + arquivo)
- Tratamento de erros com mensagens amigáveis
- Autenticação local (JWT ou session)
- Exportação de dados (CSV e PDF)
- Modo offline (PWA com service worker)
- README.md completo com instruções
- Arquivo .env.example documentado
- Testes básicos (unitários + integração)
- Estrutura profissional de pastas
"""

TEMPLATES: dict[str, str] = {
    "react-app": f"""
Você é um arquiteto de software senior. Recrie este projeto React como um monorepo local moderno e completo.

ESTRUTURA ALVO:
```
frontend/
  src/
    components/    — Componentes reutilizáveis
    pages/         — Páginas/rotas
    hooks/         — Custom hooks
    services/      — API clients
    utils/         — Utilitários
    types/         — TypeScript types
  public/
  package.json
  vite.config.ts
  tsconfig.json
backend/
  app/
    routers/       — Endpoints FastAPI
    models/        — Pydantic models
    services/      — Lógica de negócio
    db/            — Database (SQLite)
  main.py
  requirements.txt
docker-compose.yml
README.md
.env.example
```

STACK: React + Vite + TypeScript + Tailwind CSS (frontend), FastAPI + SQLite (backend), Docker opcional.

{COMMON_REQUIREMENTS}

Analise o código fonte fornecido e recrie uma versão MELHORADA mantendo toda a funcionalidade original.
Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "vue-app": f"""
Você é um arquiteto de software senior. Recrie este projeto Vue como um monorepo local moderno.

ESTRUTURA ALVO:
```
frontend/
  src/
    components/
    views/
    composables/
    stores/        — Pinia stores
    services/
    types/
  package.json
  vite.config.ts
backend/
  app/
    routers/
    models/
    services/
  main.py
  requirements.txt
docker-compose.yml
README.md
.env.example
```

STACK: Vue 3 + Vite + TypeScript + Pinia (frontend), FastAPI + SQLite (backend).

{COMMON_REQUIREMENTS}

Recrie uma versão MELHORADA mantendo toda a funcionalidade original.
Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "angular-app": f"""
Você é um arquiteto de software senior. Recrie este projeto Angular como um monorepo local.

STACK: Angular 17+ standalone components + TypeScript (frontend), FastAPI + SQLite (backend).

{COMMON_REQUIREMENTS}

Recrie uma versão MELHORADA mantendo toda a funcionalidade original.
Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "node-backend": f"""
Você é um arquiteto de software senior. Recrie este backend Node.js como um projeto modular e bem estruturado.

ESTRUTURA ALVO:
```
src/
  routes/
  controllers/
  services/
  middleware/
  models/
  utils/
  config/
package.json
tsconfig.json
docker-compose.yml
README.md
.env.example
tests/
```

STACK: Node.js + TypeScript + Express/Fastify, banco de dados SQLite ou PostgreSQL.

{COMMON_REQUIREMENTS}

Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "python-backend": f"""
Você é um arquiteto de software senior. Refatore este backend Python para uma arquitetura FastAPI modular.

ESTRUTURA ALVO:
```
app/
  routers/         — Endpoints separados por domínio
  models/          — Pydantic models + ORM models
  services/        — Lógica de negócio
  middleware/      — Auth, CORS, logging
  db/              — Database setup + migrations
  utils/           — Helpers
main.py
requirements.txt
pyproject.toml
docker-compose.yml
README.md
.env.example
tests/
  test_*.py
```

STACK: FastAPI + SQLAlchemy + SQLite + Pydantic v2.

{COMMON_REQUIREMENTS}

Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "chrome-extension": f"""
Você é um arquiteto de software senior. Transforme esta extensão Chrome em uma aplicação moderna.

OPÇÕES DE TRANSFORMAÇÃO:
1. App Electron desktop com UI React
2. PWA com funcionalidade equivalente
3. Extensão modernizada com Manifest V3

ESTRUTURA ALVO (Electron):
```
src/
  renderer/        — React frontend
  main/            — Electron main process
  preload/         — Preload scripts
  shared/          — Shared types/utils
backend/           — FastAPI opcional
package.json
electron-builder.yml
README.md
.env.example
```

{COMMON_REQUIREMENTS}

Recrie como aplicação Electron + React + TypeScript.
Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "mobile-android": f"""
Você é um arquiteto de software senior. Recrie este app Android como uma aplicação web moderna equivalente.

STACK: React + Vite + TypeScript + Tailwind CSS + PWA (para funcionar como app mobile).
Backend: FastAPI + SQLite.

{COMMON_REQUIREMENTS}

Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "mobile-ios": f"""
Você é um arquiteto de software senior. Recrie este app iOS como uma aplicação web moderna equivalente.

STACK: React + Vite + TypeScript + Tailwind CSS + PWA.
Backend: FastAPI + SQLite.

{COMMON_REQUIREMENTS}

Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "docker-project": f"""
Você é um arquiteto de software senior. Analise este projeto Docker e recrie como uma aplicação bem estruturada.

{COMMON_REQUIREMENTS}

Mantenha o Docker como base e adicione uma UI web React para gerenciamento.
Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "electron-app": f"""
Você é um arquiteto de software senior. Recrie este app Electron com arquitetura moderna.

STACK: Electron + React + Vite + TypeScript.

{COMMON_REQUIREMENTS}

Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",

    "unknown": f"""
Você é um arquiteto de software senior. Analise este projeto e recrie como uma aplicação web moderna.

STACK PADRÃO: React + Vite + TypeScript + Tailwind CSS (frontend), FastAPI + SQLite (backend).

{COMMON_REQUIREMENTS}

Responda APENAS com JSON no formato: {{"files": [{{"path": "...", "content": "..."}}]}}
""",
}


def get_prompt(project_type: str) -> str:
    """Retorna o prompt template para o tipo de projeto."""
    return TEMPLATES.get(project_type, TEMPLATES["unknown"])


def build_recreation_prompt(analysis: dict, source_files: list[dict]) -> str:
    """Constrói o prompt completo para recriação com código fonte."""
    ptype = analysis.get("project_type", "unknown")
    template = get_prompt(ptype)

    # Build source context
    source_context = "\n\n".join(
        f"### {f['path']}\n```\n{f['content'][:8000]}\n```"
        for f in source_files[:50]  # Limit files
    )

    return f"""{template}

## ANÁLISE DO PROJETO ORIGINAL
- Tipo: {ptype}
- Frameworks: {', '.join(analysis.get('frameworks', []))}
- Tem Frontend: {analysis.get('has_frontend')}
- Tem Backend: {analysis.get('has_backend')}
- Tem Docker: {analysis.get('has_docker')}
- Tem Testes: {analysis.get('has_tests')}

## CÓDIGO FONTE ORIGINAL
{source_context}
"""
