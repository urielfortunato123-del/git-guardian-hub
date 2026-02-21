"""
GenLab Engine — Project Analyzer
Detecta automaticamente o tipo de projeto e gera metadata estruturada.
"""
import json
from pathlib import Path
from typing import List, Optional


PROJECT_TYPES = [
    "react-app",
    "vue-app",
    "angular-app",
    "node-backend",
    "python-backend",
    "chrome-extension",
    "mobile-android",
    "mobile-ios",
    "docker-project",
    "electron-app",
    "unknown",
]


def analyze_project(repo_dir: Path) -> dict:
    """Analisa um repositório e retorna classificação detalhada."""
    repo_dir = Path(repo_dir)
    signals: List[str] = []
    project_type = "unknown"
    frameworks: List[str] = []
    has_backend = False
    has_frontend = False
    has_tests = False
    has_docker = False
    entry_points: List[str] = []

    # ── Detecção de arquivos-chave ──
    pkg_json = _read_json(repo_dir / "package.json")
    
    # Docker
    if (repo_dir / "Dockerfile").exists() or (repo_dir / "docker-compose.yml").exists() or (repo_dir / "docker-compose.yaml").exists():
        has_docker = True
        signals.append("docker")

    # Chrome Extension
    manifest = _read_json(repo_dir / "manifest.json")
    if manifest and manifest.get("manifest_version"):
        project_type = "chrome-extension"
        signals.append("manifest.json (chrome ext)")
        mv = manifest.get("manifest_version", "?")
        frameworks.append(f"Manifest V{mv}")

    # Python
    has_py_deps = (repo_dir / "requirements.txt").exists() or (repo_dir / "pyproject.toml").exists() or (repo_dir / "setup.py").exists()
    if has_py_deps:
        signals.append("python-deps")
        has_backend = True
        if project_type == "unknown":
            project_type = "python-backend"
        # Detect frameworks
        reqs_text = _read_text(repo_dir / "requirements.txt")
        pyproject_text = _read_text(repo_dir / "pyproject.toml")
        combined = (reqs_text + pyproject_text).lower()
        if "fastapi" in combined:
            frameworks.append("FastAPI")
        if "flask" in combined:
            frameworks.append("Flask")
        if "django" in combined:
            frameworks.append("Django")

    # Node / Frontend frameworks
    if pkg_json:
        deps = {**pkg_json.get("dependencies", {}), **pkg_json.get("devDependencies", {})}
        signals.append("package.json")

        if "react" in deps or "react-dom" in deps:
            project_type = "react-app"
            has_frontend = True
            frameworks.append("React")
            if "next" in deps:
                frameworks.append("Next.js")
            if "vite" in deps or "@vitejs/plugin-react" in deps:
                frameworks.append("Vite")
            if "tailwindcss" in deps:
                frameworks.append("Tailwind CSS")

        elif "vue" in deps:
            project_type = "vue-app"
            has_frontend = True
            frameworks.append("Vue")
            if "nuxt" in deps:
                frameworks.append("Nuxt")

        elif "@angular/core" in deps:
            project_type = "angular-app"
            has_frontend = True
            frameworks.append("Angular")

        elif "electron" in deps:
            project_type = "electron-app"
            frameworks.append("Electron")

        # Node backend signals
        if "express" in deps:
            has_backend = True
            frameworks.append("Express")
            if project_type == "unknown":
                project_type = "node-backend"
        if "fastify" in deps:
            has_backend = True
            frameworks.append("Fastify")
            if project_type == "unknown":
                project_type = "node-backend"
        if "nest" in deps or "@nestjs/core" in deps:
            has_backend = True
            frameworks.append("NestJS")
            if project_type == "unknown":
                project_type = "node-backend"

        # Tests
        if "jest" in deps or "vitest" in deps or "mocha" in deps or "@testing-library/react" in deps:
            has_tests = True
            signals.append("test-framework")

        # Entry points
        scripts = pkg_json.get("scripts", {})
        if "dev" in scripts:
            entry_points.append("npm run dev")
        if "start" in scripts:
            entry_points.append("npm start")
        if "build" in scripts:
            entry_points.append("npm run build")

    # Android
    if (repo_dir / "build.gradle").exists() or (repo_dir / "build.gradle.kts").exists():
        if (repo_dir / "app" / "src" / "main" / "AndroidManifest.xml").exists():
            project_type = "mobile-android"
            frameworks.append("Android")
            signals.append("AndroidManifest.xml")
        elif (repo_dir / "settings.gradle").exists() or (repo_dir / "settings.gradle.kts").exists():
            signals.append("gradle-project")

    # iOS
    for ext in ["*.xcodeproj", "*.xcworkspace"]:
        if list(repo_dir.glob(ext)):
            project_type = "mobile-ios"
            frameworks.append("iOS/Xcode")
            signals.append("xcode-project")
            break
    if (repo_dir / "Package.swift").exists():
        if project_type == "unknown":
            project_type = "mobile-ios"
        frameworks.append("Swift Package")
        signals.append("Package.swift")

    # Python entry points
    if has_py_deps:
        for name in ["main.py", "app.py", "manage.py", "run.py"]:
            if (repo_dir / name).exists():
                entry_points.append(f"python {name}")

    # Count files
    file_count = sum(1 for _ in repo_dir.rglob("*") if _.is_file() and ".git" not in str(_))

    return {
        "project_type": project_type,
        "frameworks": frameworks,
        "signals": signals,
        "has_frontend": has_frontend,
        "has_backend": has_backend,
        "has_tests": has_tests,
        "has_docker": has_docker,
        "entry_points": entry_points,
        "file_count": min(file_count, 99999),
    }


def _read_json(path: Path) -> Optional[dict]:
    try:
        return json.loads(path.read_text(errors="ignore"))
    except Exception:
        return None


def _read_text(path: Path) -> str:
    try:
        return path.read_text(errors="ignore")
    except Exception:
        return ""
