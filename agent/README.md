# Lovable Infinity - Agente Local

## Instalação

```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

## Rodar

```bash
python agent.py
```

O agente roda em `http://127.0.0.1:8787`.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status do agente |
| POST | `/v1/import/github` | Clonar repo do GitHub |
| POST | `/v1/import/zip` | Upload de ZIP |
| GET | `/v1/project/tree?project_id=X` | Listar arquivos |
| GET | `/v1/project/file?project_id=X&path=Y` | Ler arquivo |
| POST | `/v1/patch/apply` | Aplicar unified diff |
| POST | `/v1/tests/run` | Rodar testes |
| POST | `/v1/github/push` | Push para GitHub |
| POST | `/v1/build` | Empacotar (PyInstaller/Java) |

## Segurança

- Projetos ficam isolados em `~/.infinity_agent/projects/`
- Arquivos sensíveis (.env, .pem, id_rsa) são bloqueados
- Nenhuma execução automática — tudo precisa de ação manual
- Token GitHub só fica em memória, nunca salvo no disco
- Sempre use branch + PR ao invés de push direto na main

## GitHub Actions (Windows EXE)

Para gerar `.exe` Windows, use o workflow em `.github/workflows/build-python-exe.yml`:

```yaml
name: Build Python EXE
on:
  workflow_dispatch:
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -U pip pyinstaller
      - run: |
          if (Test-Path requirements.txt) { pip install -r requirements.txt }
      - run: pyinstaller --onefile main.py --distpath dist
      - uses: actions/upload-artifact@v4
        with:
          name: app-exe
          path: dist/*
```
