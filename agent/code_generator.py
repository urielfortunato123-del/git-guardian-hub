"""
GenLab Engine — Code Generator
Gera projetos recriados usando IA local (LM Studio / Ollama).
"""
import json
import os
import re
from pathlib import Path
from typing import Optional
import httpx

from project_analyzer import analyze_project
from prompt_templates import build_recreation_prompt


GENERATED_ROOT = Path(os.environ.get("INFINITY_WORKDIR", str(Path.home() / ".infinity_agent"))) / "generated_projects"
GENERATED_ROOT.mkdir(parents=True, exist_ok=True)


def get_llm_config() -> dict:
    """Retorna configuração do LLM a partir de variáveis de ambiente."""
    provider = os.environ.get("LLM_PROVIDER", "ollama")
    model = os.environ.get("LLM_MODEL", "gemma3")

    if provider == "lmstudio":
        base_url = os.environ.get("LLM_BASE_URL", "http://127.0.0.1:1234/v1")
    elif provider == "ollama":
        base_url = os.environ.get("LLM_BASE_URL", "http://127.0.0.1:11434/v1")
    else:
        base_url = os.environ.get("LLM_BASE_URL", "http://127.0.0.1:11434/v1")

    return {"provider": provider, "model": model, "base_url": base_url}


def call_llm(prompt: str, max_tokens: int = 16000) -> str:
    """Chama o LLM local e retorna a resposta."""
    config = get_llm_config()
    url = f"{config['base_url']}/chat/completions"

    payload = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": "Você é um gerador de código. Responda APENAS com JSON válido no formato solicitado."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
        "stream": False,
    }

    resp = httpx.post(url, json=payload, timeout=300)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def call_llm_stream(prompt: str, max_tokens: int = 16000):
    """Chama o LLM com streaming e yield chunks."""
    config = get_llm_config()
    url = f"{config['base_url']}/chat/completions"

    payload = {
        "model": config["model"],
        "messages": [
            {"role": "system", "content": "Você é um gerador de código. Responda APENAS com JSON válido no formato solicitado."},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": 0.3,
        "stream": True,
    }

    with httpx.stream("POST", url, json=payload, timeout=300) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines():
            if not line or not line.startswith("data: "):
                continue
            data_str = line[6:].strip()
            if data_str == "[DONE]":
                break
            try:
                chunk = json.loads(data_str)
                content = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                if content:
                    yield content
            except json.JSONDecodeError:
                continue


def extract_files_json(text: str) -> Optional[list]:
    """Extrai o JSON de arquivos da resposta do LLM."""
    # Try direct parse
    try:
        data = json.loads(text)
        if isinstance(data, dict) and "files" in data:
            return data["files"]
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        pass

    # Try extracting JSON from markdown code blocks
    patterns = [
        r'```json\s*\n(.*?)\n```',
        r'```\s*\n(.*?)\n```',
        r'\{[\s\S]*"files"\s*:\s*\[[\s\S]*\]\s*\}',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text, re.DOTALL)
        for match in matches:
            try:
                data = json.loads(match)
                if isinstance(data, dict) and "files" in data:
                    return data["files"]
                if isinstance(data, list):
                    return data
            except json.JSONDecodeError:
                continue

    return None


def save_generated_project(project_name: str, files: list) -> dict:
    """Salva os arquivos gerados em disco."""
    project_dir = GENERATED_ROOT / project_name
    if project_dir.exists():
        import shutil
        shutil.rmtree(project_dir)
    project_dir.mkdir(parents=True, exist_ok=True)

    saved = []
    for f in files:
        path = f.get("path", "")
        content = f.get("content", "")
        if not path:
            continue
        file_path = (project_dir / path).resolve()
        # Security: ensure within project dir
        if not str(file_path).startswith(str(project_dir.resolve())):
            continue
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")
        saved.append(path)

    return {"project_name": project_name, "dir": str(project_dir), "files_saved": saved, "count": len(saved)}


def recreate_project(source_dir: Path, project_name: str) -> dict:
    """Pipeline completo: analisa → gera prompt → chama IA → salva."""
    source_dir = Path(source_dir)

    # 1. Analyze
    analysis = analyze_project(source_dir)

    # 2. Collect source files (limited)
    from agent import safe_list_files, load_ignore
    file_list = safe_list_files(source_dir, max_files=50)
    source_files = []
    for rel in file_list[:50]:
        p = source_dir / rel
        if p.stat().st_size > 50_000:
            continue
        try:
            source_files.append({"path": rel, "content": p.read_text(errors="ignore")})
        except Exception:
            continue

    # 3. Build prompt
    prompt = build_recreation_prompt(analysis, source_files)

    # 4. Call LLM
    response_text = call_llm(prompt)

    # 5. Extract files
    files = extract_files_json(response_text)
    if not files:
        return {"ok": False, "error": "Failed to parse LLM response as file list", "raw": response_text[:2000]}

    # 6. Save
    result = save_generated_project(project_name, files)
    result["analysis"] = analysis
    result["ok"] = True
    return result
