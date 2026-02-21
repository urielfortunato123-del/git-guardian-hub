"""
GenLab Engine — Runner
Executa projetos gerados localmente com auto-detecção de modo.
"""
import subprocess
import json
from pathlib import Path
from typing import Optional, List


def run_cmd(cmd: List[str], cwd: Optional[Path] = None, timeout: int = 1800) -> str:
    p = subprocess.run(cmd, cwd=str(cwd) if cwd else None, capture_output=True, text=True, timeout=timeout)
    out = (p.stdout or "") + (p.stderr or "")
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{out[:5000]}")
    return out


def detect_run_mode(project_dir: Path) -> str:
    """Auto-detecta o melhor modo de execução."""
    if (project_dir / "docker-compose.yml").exists() or (project_dir / "docker-compose.yaml").exists():
        return "docker"
    if (project_dir / "package.json").exists():
        return "npm"
    if (project_dir / "requirements.txt").exists() or (project_dir / "main.py").exists():
        return "python"
    return "unknown"


def run_project(project_dir: Path, mode: str = "auto") -> dict:
    """Executa um projeto localmente."""
    project_dir = Path(project_dir)
    if not project_dir.exists():
        return {"ok": False, "error": "Project directory not found"}

    if mode == "auto":
        mode = detect_run_mode(project_dir)
        if mode == "unknown":
            return {"ok": False, "error": "Cannot auto-detect run mode"}

    logs = ""
    try:
        if mode == "docker":
            logs = run_cmd(["docker", "compose", "up", "--build", "-d"], cwd=project_dir, timeout=300)
        elif mode == "npm":
            logs = run_cmd(["bash", "-lc", "npm install && npm run dev &"], cwd=project_dir, timeout=120)
        elif mode == "python":
            entry = "main.py" if (project_dir / "main.py").exists() else "app.py"
            logs = run_cmd(
                ["bash", "-lc", f"python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt 2>/dev/null; python {entry} &"],
                cwd=project_dir, timeout=120,
            )
        else:
            return {"ok": False, "error": f"Unknown mode: {mode}"}

        return {"ok": True, "mode": mode, "logs": logs[-10000:]}
    except Exception as e:
        return {"ok": False, "mode": mode, "error": str(e), "logs": logs[-10000:]}


def build_installer(project_dir: Path, target: str = "auto") -> dict:
    """Gera instalador para o projeto."""
    project_dir = Path(project_dir)
    logs = ""

    try:
        if target == "auto":
            if (project_dir / "package.json").exists():
                pkg = json.loads((project_dir / "package.json").read_text(errors="ignore"))
                deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                if "electron" in deps:
                    target = "electron"
                else:
                    target = "electron-wrap"  # Wrap any web app in Electron
            elif (project_dir / "requirements.txt").exists() or (project_dir / "main.py").exists():
                target = "pyinstaller"
            else:
                return {"ok": False, "error": "Cannot determine installer type"}

        if target == "electron":
            # Project already has Electron — just build
            logs += run_cmd(["bash", "-lc", "npm install && npm run build"], cwd=project_dir, timeout=300)
            logs += run_cmd(["bash", "-lc", "npx electron-builder --linux --mac"], cwd=project_dir, timeout=600)
            return {"ok": True, "target": target, "logs": logs[-10000:]}

        elif target == "electron-wrap":
            # Create minimal Electron wrapper around web app
            electron_main = '''const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    icon: path.join(__dirname, "icon.png"),
  });
  win.loadFile("dist/index.html");
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
'''
            (project_dir / "electron-main.js").write_text(electron_main)

            # Update package.json
            pkg = json.loads((project_dir / "package.json").read_text(errors="ignore")) if (project_dir / "package.json").exists() else {}
            pkg["main"] = "electron-main.js"
            pkg.setdefault("build", {})
            pkg["build"]["appId"] = f"com.genlab.{project_dir.name}"
            pkg["build"]["productName"] = project_dir.name
            pkg["build"]["files"] = ["dist/**/*", "electron-main.js", "icon.png"]
            (project_dir / "package.json").write_text(json.dumps(pkg, indent=2))

            logs += run_cmd(["bash", "-lc", "npm install && npm run build"], cwd=project_dir, timeout=300)
            logs += run_cmd(["bash", "-lc", "npx electron-builder --linux --mac"], cwd=project_dir, timeout=600)
            return {"ok": True, "target": target, "logs": logs[-10000:]}

        elif target == "pyinstaller":
            entry = "main.py" if (project_dir / "main.py").exists() else "app.py"
            logs += run_cmd(
                ["bash", "-lc", f"python3 -m venv .venv && . .venv/bin/activate && pip install -U pyinstaller && pyinstaller --onefile {entry} --distpath dist"],
                cwd=project_dir, timeout=600,
            )
            return {"ok": True, "target": target, "logs": logs[-10000:]}

        else:
            return {"ok": False, "error": f"Unknown target: {target}"}

    except Exception as e:
        return {"ok": False, "target": target, "error": str(e), "logs": logs[-10000:]}
