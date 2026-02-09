"""
Lovable Infinity - Agente Local
Rode com: python agent.py
Acessa em: http://127.0.0.1:8787
"""
import os
import re
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from git import Repo
from pathspec import PathSpec
from pathspec.patterns.gitwildmatch import GitWildMatchPattern

APP_ROOT = Path(os.environ.get("INFINITY_WORKDIR", str(Path.home() / ".infinity_agent"))).resolve()
APP_ROOT.mkdir(parents=True, exist_ok=True)

BACKUPS_ROOT = APP_ROOT / "backups"
BACKUPS_ROOT.mkdir(parents=True, exist_ok=True)

DEFAULT_IGNORE = """
.git/
node_modules/
dist/
build/
target/
.venv/
venv/
__pycache__/
*.pyc
*.log
*.zip
*.exe
*.dll
*.so
*.png
*.jpg
*.jpeg
*.gif
*.ico
*.woff
*.woff2
*.ttf
*.eot
*.mp3
*.mp4
*.pdf
"""

def run_cmd(cmd: List[str], cwd: Optional[Path] = None, timeout: int = 1800) -> str:
    p = subprocess.run(cmd, cwd=str(cwd) if cwd else None, capture_output=True, text=True, timeout=timeout)
    out = (p.stdout or "") + (p.stderr or "")
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{out[:5000]}")
    return out

def load_ignore(repo_dir: Path) -> PathSpec:
    patterns = [line.strip() for line in DEFAULT_IGNORE.splitlines() if line.strip()]
    gitignore = repo_dir / ".gitignore"
    if gitignore.exists():
        patterns += [
            line.strip()
            for line in gitignore.read_text(errors="ignore").splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
    return PathSpec.from_lines(GitWildMatchPattern, patterns)

def safe_list_files(repo_dir: Path, max_files: int = 4000) -> List[str]:
    spec = load_ignore(repo_dir)
    files = []
    for p in repo_dir.rglob("*"):
        if p.is_file():
            rel = str(p.relative_to(repo_dir)).replace("\\", "/")
            if spec.match_file(rel):
                continue
            if p.stat().st_size > 2_000_000:
                continue
            files.append(rel)
            if len(files) >= max_files:
                break
    return sorted(files)

def detect_stack(repo_dir: Path) -> dict:
    d = {"type": "unknown", "signals": []}
    if (repo_dir / "package.json").exists():
        d["type"] = "node"
        d["signals"].append("package.json")
    if (repo_dir / "pyproject.toml").exists() or (repo_dir / "requirements.txt").exists():
        if d["type"] == "unknown":
            d["type"] = "python"
        d["signals"].append("python deps")
    if (repo_dir / "pom.xml").exists() or (repo_dir / "build.gradle").exists():
        if d["type"] == "unknown":
            d["type"] = "java"
        d["signals"].append("java build file")
    if (repo_dir / "go.mod").exists():
        if d["type"] == "unknown":
            d["type"] = "go"
        d["signals"].append("go.mod")
    if (repo_dir / "Cargo.toml").exists():
        if d["type"] == "unknown":
            d["type"] = "rust"
        d["signals"].append("Cargo.toml")
    return d


# ── Pydantic models ──

class ImportGitHub(BaseModel):
    repo_url: str
    branch: Optional[str] = None
    token: Optional[str] = None
    project_name: Optional[str] = None

class ApplyPatch(BaseModel):
    project_id: str
    unified_diff: str

class RunTests(BaseModel):
    project_id: str

class PushGitHub(BaseModel):
    project_id: str
    remote: Optional[str] = "origin"
    branch: str
    message: str = "Infinity: apply changes"
    token: Optional[str] = None

class BuildReq(BaseModel):
    project_id: str
    target: str  # "python-linux", "python-exe", "java"
    entry: Optional[str] = None

class WriteFile(BaseModel):
    project_id: str
    path: str
    content: str

class WriteMultipleFiles(BaseModel):
    project_id: str
    files: List[dict]  # [{"path": "...", "content": "..."}]

class BackupCreate(BaseModel):
    project_id: str
    label: Optional[str] = None

class BackupRestore(BaseModel):
    project_id: str
    backup_id: str


# ── App ──

app = FastAPI(title="Lovable Infinity Agent", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def project_path(project_id: str) -> Path:
    p = (APP_ROOT / "projects" / project_id).resolve()
    if not str(p).startswith(str((APP_ROOT / "projects").resolve())):
        raise HTTPException(400, "Invalid project id")
    if not p.exists():
        raise HTTPException(404, f"Project '{project_id}' not found")
    return p


# ── Endpoints ──

@app.get("/health")
def health():
    return {"ok": True, "workdir": str(APP_ROOT), "version": "0.3.0"}

@app.post("/v1/import/github")
def import_github(req: ImportGitHub):
    pid = req.project_name or f"proj_{next(tempfile._get_candidate_names())}"
    dest = (APP_ROOT / "projects" / pid).resolve()
    if dest.exists():
        raise HTTPException(409, "Project already exists")
    dest.parent.mkdir(parents=True, exist_ok=True)

    url = req.repo_url
    if req.token and url.startswith("https://"):
        url = url.replace("https://", f"https://{req.token}@")

    Repo.clone_from(url, dest, branch=req.branch or None)
    files = safe_list_files(dest)
    return {"project_id": pid, "stack": detect_stack(dest), "files_count": len(files)}

@app.post("/v1/import/zip")
async def import_zip(file: UploadFile = File(...)):
    pid = f"zip_{next(tempfile._get_candidate_names())}"
    dest = (APP_ROOT / "projects" / pid).resolve()
    dest.mkdir(parents=True, exist_ok=True)
    tmp = dest / "upload.zip"
    tmp.write_bytes(await file.read())
    run_cmd(["bash", "-lc", f"cd '{dest}' && unzip -q upload.zip && rm upload.zip"])
    files = safe_list_files(dest)
    return {"project_id": pid, "stack": detect_stack(dest), "files_count": len(files)}

@app.get("/v1/project/tree")
def tree(project_id: str):
    repo_dir = project_path(project_id)
    files = safe_list_files(repo_dir)
    return {"project_id": project_id, "files": files, "stack": detect_stack(repo_dir)}

@app.get("/v1/project/file")
def read_file(project_id: str, path: str):
    repo_dir = project_path(project_id)
    p = (repo_dir / path).resolve()
    if not str(p).startswith(str(repo_dir)):
        raise HTTPException(400, "Invalid path")
    if not p.exists() or not p.is_file():
        raise HTTPException(404, "Not found")
    
    # Security: block sensitive files
    blocked = [".env", "id_rsa", ".pem", ".pfx", ".key"]
    if any(p.name.lower().endswith(ext) or p.name.lower() == ext.lstrip(".") for ext in blocked):
        raise HTTPException(403, "Access to sensitive files is blocked")
    
    return {"path": path, "content": p.read_text(errors="ignore")}

@app.get("/v1/project/files-batch")
def read_files_batch(project_id: str, paths: str):
    """Read multiple files at once. paths is comma-separated."""
    repo_dir = project_path(project_id)
    result = []
    blocked = [".env", "id_rsa", ".pem", ".pfx", ".key"]
    for path in paths.split(","):
        path = path.strip()
        if not path:
            continue
        p = (repo_dir / path).resolve()
        if not str(p).startswith(str(repo_dir)):
            continue
        if not p.exists() or not p.is_file():
            continue
        if any(p.name.lower().endswith(ext) or p.name.lower() == ext.lstrip(".") for ext in blocked):
            continue
        if p.stat().st_size > 500_000:
            continue
        result.append({"path": path, "content": p.read_text(errors="ignore")})
    return {"files": result}

@app.post("/v1/project/write-file")
def write_file(req: WriteFile):
    """Write a single file to the project."""
    repo_dir = project_path(req.project_id)
    p = (repo_dir / req.path).resolve()
    if not str(p).startswith(str(repo_dir)):
        raise HTTPException(400, "Invalid path")
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(req.content, encoding="utf-8")
    return {"ok": True, "path": req.path}

@app.post("/v1/project/write-files")
def write_files(req: WriteMultipleFiles):
    """Write multiple files to the project at once."""
    repo_dir = project_path(req.project_id)
    written = []
    for f in req.files:
        path = f.get("path", "")
        content = f.get("content", "")
        p = (repo_dir / path).resolve()
        if not str(p).startswith(str(repo_dir)):
            continue
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        written.append(path)
    return {"ok": True, "written": written}

@app.post("/v1/patch/apply")
def apply_patch(req: ApplyPatch):
    repo_dir = project_path(req.project_id)
    diff_file = repo_dir / ".infinity.patch"
    diff_file.write_text(req.unified_diff, encoding="utf-8")
    try:
        out = run_cmd(["git", "apply", ".infinity.patch"], cwd=repo_dir)
        return {"ok": True, "message": "Patch applied with git apply"}
    except Exception as e:
        raise HTTPException(400, f"Patch failed: {e}")
    finally:
        if diff_file.exists():
            diff_file.unlink()

@app.post("/v1/tests/run")
def tests(req: RunTests):
    repo_dir = project_path(req.project_id)
    stack = detect_stack(repo_dir)["type"]
    logs = ""
    try:
        if stack == "node":
            logs += run_cmd(["bash", "-lc", "npm ci || npm i"], cwd=repo_dir)
            pkg = json.loads((repo_dir / "package.json").read_text(errors="ignore"))
            scripts = pkg.get("scripts") or {}
            if "test" in scripts:
                logs += run_cmd(["bash", "-lc", "npm test"], cwd=repo_dir)
            if "build" in scripts:
                logs += run_cmd(["bash", "-lc", "npm run build"], cwd=repo_dir)
        elif stack == "python":
            if (repo_dir / "requirements.txt").exists():
                logs += run_cmd(["bash", "-lc", "python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt"], cwd=repo_dir)
            logs += run_cmd(["bash", "-lc", ". .venv/bin/activate && (pytest -q || true)"], cwd=repo_dir)
        elif stack == "java":
            if (repo_dir / "mvnw").exists():
                logs += run_cmd(["bash", "-lc", "./mvnw -q test"], cwd=repo_dir)
            else:
                logs += run_cmd(["bash", "-lc", "mvn -q test"], cwd=repo_dir)
        else:
            raise HTTPException(400, f"Unknown stack '{stack}': cannot run tests automatically")
        return {"ok": True, "stack": stack, "logs": logs[-20000:]}
    except Exception as e:
        return {"ok": False, "stack": stack, "error": str(e), "logs": logs[-20000:]}

@app.post("/v1/github/push")
def push(req: PushGitHub):
    repo_dir = project_path(req.project_id)
    repo = Repo(repo_dir)
    
    if req.branch in [h.name for h in repo.heads]:
        repo.git.checkout(req.branch)
    else:
        repo.git.checkout("-b", req.branch)
    
    repo.git.add(A=True)
    repo.index.commit(req.message)

    remote = repo.remotes[req.remote]
    url = remote.url
    if req.token and url.startswith("https://") and "@" not in url:
        url = url.replace("https://", f"https://{req.token}@")
        remote.set_url(url)
    
    out = repo.git.push("--set-upstream", req.remote, req.branch)
    return {"ok": True, "push": out}

@app.post("/v1/build")
def build(req: BuildReq):
    repo_dir = project_path(req.project_id)
    out_dir = (repo_dir / "infinity_dist").resolve()
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    if req.target == "python-linux":
        entry = req.entry or "main.py"
        run_cmd(["bash", "-lc", "python3 -m venv .venv && . .venv/bin/activate && pip install -U pip pyinstaller"], cwd=repo_dir)
        run_cmd(["bash", "-lc", f". .venv/bin/activate && pyinstaller --onefile {entry} --distpath infinity_dist"], cwd=repo_dir)
        return {"ok": True, "artifact_dir": str(out_dir)}
    elif req.target == "python-exe":
        raise HTTPException(400, "Windows EXE build recommended via GitHub Actions (windows-latest runner).")
    elif req.target == "java":
        if (repo_dir / "pom.xml").exists():
            run_cmd(["bash", "-lc", "mvn -q package -DskipTests"], cwd=repo_dir)
        elif (repo_dir / "gradlew").exists():
            run_cmd(["bash", "-lc", "./gradlew build -x test"], cwd=repo_dir)
        else:
            raise HTTPException(400, "No Maven/Gradle build file found")
        return {"ok": True, "message": "Java package built. Use jpackage on target OS for installer."}
    else:
        raise HTTPException(400, f"Unknown build target: {req.target}")


# ── Backup / Restore ──

@app.post("/v1/backup/create")
def backup_create(req: BackupCreate):
    """Create a snapshot backup of the project."""
    repo_dir = project_path(req.project_id)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    label = req.label or "manual"
    label_safe = re.sub(r'[^a-zA-Z0-9_-]', '_', label)[:40]
    backup_id = f"{req.project_id}_{ts}_{label_safe}"
    backup_dir = BACKUPS_ROOT / backup_id
    
    # Copy project files (excluding heavy dirs)
    spec = load_ignore(repo_dir)
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    files_copied = 0
    for p in repo_dir.rglob("*"):
        if p.is_file():
            rel = str(p.relative_to(repo_dir)).replace("\\", "/")
            if spec.match_file(rel):
                continue
            if p.stat().st_size > 2_000_000:
                continue
            dest = backup_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dest)
            files_copied += 1
    
    # Save metadata
    meta = {
        "project_id": req.project_id,
        "backup_id": backup_id,
        "label": req.label or "manual",
        "created_at": datetime.now().isoformat(),
        "files_count": files_copied,
    }
    (backup_dir / ".backup_meta.json").write_text(json.dumps(meta, indent=2))
    
    return meta

@app.get("/v1/backup/list")
def backup_list(project_id: str):
    """List all backups for a project."""
    backups = []
    for d in sorted(BACKUPS_ROOT.iterdir(), reverse=True):
        if not d.is_dir():
            continue
        meta_file = d / ".backup_meta.json"
        if meta_file.exists():
            meta = json.loads(meta_file.read_text())
            if meta.get("project_id") == project_id:
                backups.append(meta)
    return {"backups": backups}

@app.post("/v1/backup/restore")
def backup_restore(req: BackupRestore):
    """Restore a project from a backup. Creates an auto-backup first."""
    repo_dir = project_path(req.project_id)
    backup_dir = (BACKUPS_ROOT / req.backup_id).resolve()
    if not str(backup_dir).startswith(str(BACKUPS_ROOT)):
        raise HTTPException(400, "Invalid backup id")
    if not backup_dir.exists():
        raise HTTPException(404, "Backup not found")
    
    # Auto-backup before restore
    auto_req = BackupCreate(project_id=req.project_id, label="pre-restore-auto")
    backup_create(auto_req)
    
    # Restore: remove current files (except .git) and copy backup
    spec = load_ignore(repo_dir)
    for p in repo_dir.rglob("*"):
        if p.is_file():
            rel = str(p.relative_to(repo_dir)).replace("\\", "/")
            if rel.startswith(".git/"):
                continue
            if spec.match_file(rel):
                continue
            p.unlink()
    
    # Copy backup files into project
    files_restored = 0
    for p in backup_dir.rglob("*"):
        if p.is_file() and p.name != ".backup_meta.json":
            rel = str(p.relative_to(backup_dir)).replace("\\", "/")
            dest = repo_dir / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, dest)
            files_restored += 1
    
    return {"ok": True, "files_restored": files_restored}

@app.delete("/v1/backup/delete")
def backup_delete(backup_id: str):
    """Delete a backup."""
    backup_dir = (BACKUPS_ROOT / backup_id).resolve()
    if not str(backup_dir).startswith(str(BACKUPS_ROOT)):
        raise HTTPException(400, "Invalid backup id")
    if not backup_dir.exists():
        raise HTTPException(404, "Backup not found")
    shutil.rmtree(backup_dir)
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    print("🚀 Lovable Infinity Agent running at http://127.0.0.1:8787")
    print(f"📁 Workspace: {APP_ROOT}")
    uvicorn.run(app, host="127.0.0.1", port=8787)
