/**
 * GenLab Engine — API Service Layer
 * Centraliza todas as chamadas ao Agent local.
 */

const AGENT_URL = "http://127.0.0.1:8787";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${AGENT_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// ── Types ──

export interface ProjectAnalysis {
  project_id: string;
  project_type: string;
  frameworks: string[];
  has_frontend: boolean;
  has_backend: boolean;
  has_docker: boolean;
  has_tests: boolean;
  file_count: number;
  signals: string[];
  entry_points: string[];
}

export interface GeneratedProject {
  name: string;
  dir: string;
  file_count: number;
}

export interface RecreateResult {
  ok: boolean;
  project_name?: string;
  count?: number;
  files_saved?: string[];
  analysis?: ProjectAnalysis;
  error?: string;
  raw?: string;
}

export interface RunResult {
  ok: boolean;
  mode?: string;
  logs?: string;
  error?: string;
}

export interface BuildResult {
  ok: boolean;
  target?: string;
  logs?: string;
  error?: string;
}

export interface AutoFixResult {
  ok: boolean;
  fixes_applied?: number;
  errors_found?: string[];
  logs?: string;
  error?: string;
}

export interface LLMConfig {
  provider: string;
  model: string;
  base_url: string;
}

// ── Health ──

export async function checkAgentHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(`${AGENT_URL}/health`, { signal: controller.signal });
    return resp.ok;
  } catch {
    return false;
  }
}

// ── GenLab Engine ──

export async function analyzeProject(projectId: string): Promise<ProjectAnalysis> {
  return request("/v1/genlab/analyze", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId }),
  });
}

export async function recreateProject(projectId: string, outputName?: string): Promise<RecreateResult> {
  return request("/v1/genlab/recreate", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, output_name: outputName }),
  });
}

export async function listGeneratedProjects(): Promise<GeneratedProject[]> {
  const data = await request<{ projects: GeneratedProject[] }>("/v1/genlab/projects");
  return data.projects || [];
}

export async function runProject(projectId: string, mode = "auto"): Promise<RunResult> {
  return request("/v1/genlab/run", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, mode }),
  });
}

export async function buildInstaller(projectId: string, target = "auto"): Promise<BuildResult> {
  return request("/v1/genlab/build-installer", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, target }),
  });
}

export async function autoFixProject(projectId: string): Promise<AutoFixResult> {
  return request("/v1/genlab/auto-fix", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId }),
  });
}

export async function getLLMConfig(): Promise<LLMConfig> {
  return request("/v1/genlab/llm-config");
}

export async function setLLMConfig(config: Partial<LLMConfig>): Promise<LLMConfig> {
  return request("/v1/genlab/llm-config", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

// ── Project CRUD (existing agent endpoints) ──

export async function getProjectTree(projectId: string): Promise<{ files: string[] }> {
  return request(`/v1/project/tree?project_id=${encodeURIComponent(projectId)}`);
}

export async function readProjectFile(projectId: string, path: string): Promise<{ content: string }> {
  return request(`/v1/project/file?project_id=${encodeURIComponent(projectId)}&path=${encodeURIComponent(path)}`);
}

export async function importFromGitHub(repoUrl: string, token?: string, branch?: string, projectName?: string) {
  return request("/v1/import/github", {
    method: "POST",
    body: JSON.stringify({ repo_url: repoUrl, token, branch, project_name: projectName }),
  });
}

// ── Templates ──

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  stack: string[];
  files: Array<{ path: string; content: string }>;
}
