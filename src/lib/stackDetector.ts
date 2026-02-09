import type { UploadedFile } from "./fileUtils";

export interface StackInfo {
  type: string;
  label: string;
  icon: string;
  signals: string[];
  testCommand?: string;
  buildCommand?: string;
}

export function detectStack(files: UploadedFile[]): StackInfo {
  const paths = files.map(f => f.path.toLowerCase());
  const hasFile = (name: string) => paths.some(p => p.endsWith(name));
  const hasDir = (name: string) => paths.some(p => p.includes(`${name}/`));

  const signals: string[] = [];

  // React / Vite
  if (hasFile("vite.config.ts") || hasFile("vite.config.js")) signals.push("Vite");
  if (paths.some(p => p.endsWith(".tsx") || p.endsWith(".jsx"))) signals.push("React/JSX");
  if (hasFile("next.config.js") || hasFile("next.config.mjs") || hasFile("next.config.ts")) signals.push("Next.js");
  if (hasFile("nuxt.config.ts") || hasFile("nuxt.config.js")) signals.push("Nuxt");
  if (hasFile("angular.json")) signals.push("Angular");
  if (hasFile("svelte.config.js")) signals.push("Svelte");

  // Node
  if (hasFile("package.json")) signals.push("Node.js");
  if (hasFile("tsconfig.json")) signals.push("TypeScript");
  if (hasFile("tailwind.config.ts") || hasFile("tailwind.config.js")) signals.push("Tailwind CSS");

  // Python
  if (hasFile("requirements.txt")) signals.push("Python (pip)");
  if (hasFile("pyproject.toml")) signals.push("Python (pyproject)");
  if (hasFile("setup.py")) signals.push("Python (setup.py)");
  if (paths.some(p => p.endsWith(".py"))) signals.push("Python");

  // Java
  if (hasFile("pom.xml")) signals.push("Maven");
  if (hasFile("build.gradle") || hasFile("build.gradle.kts")) signals.push("Gradle");
  if (paths.some(p => p.endsWith(".java"))) signals.push("Java");

  // Go
  if (hasFile("go.mod")) signals.push("Go");

  // Rust
  if (hasFile("cargo.toml")) signals.push("Rust");

  // Docker
  if (hasFile("dockerfile") || hasFile("docker-compose.yml") || hasFile("docker-compose.yaml")) signals.push("Docker");

  // Determine primary type
  let type = "unknown";
  let label = "Desconhecido";
  let icon = "📁";
  let testCommand: string | undefined;
  let buildCommand: string | undefined;

  if (signals.includes("Next.js")) {
    type = "nextjs"; label = "Next.js"; icon = "▲";
    testCommand = "npm test"; buildCommand = "npm run build";
  } else if (signals.includes("Vite") || signals.includes("React/JSX")) {
    type = "react-vite"; label = "React + Vite"; icon = "⚛️";
    testCommand = "npm test"; buildCommand = "npm run build";
  } else if (signals.includes("Angular")) {
    type = "angular"; label = "Angular"; icon = "🅰️";
    testCommand = "ng test"; buildCommand = "ng build";
  } else if (signals.includes("Svelte")) {
    type = "svelte"; label = "Svelte"; icon = "🔥";
  } else if (signals.includes("Node.js")) {
    type = "node"; label = "Node.js"; icon = "🟢";
    testCommand = "npm test"; buildCommand = "npm run build";
  } else if (signals.includes("Maven") || signals.includes("Gradle")) {
    type = "java"; label = "Java"; icon = "☕";
    testCommand = signals.includes("Maven") ? "mvn test" : "./gradlew test";
    buildCommand = signals.includes("Maven") ? "mvn package" : "./gradlew build";
  } else if (signals.includes("Python") || signals.includes("Python (pip)") || signals.includes("Python (pyproject)")) {
    type = "python"; label = "Python"; icon = "🐍";
    testCommand = "pytest"; buildCommand = "pyinstaller --onefile main.py";
  } else if (signals.includes("Go")) {
    type = "go"; label = "Go"; icon = "🐹";
    testCommand = "go test ./..."; buildCommand = "go build";
  } else if (signals.includes("Rust")) {
    type = "rust"; label = "Rust"; icon = "🦀";
    testCommand = "cargo test"; buildCommand = "cargo build --release";
  }

  return { type, label, icon, signals: [...new Set(signals)], testCommand, buildCommand };
}

export function generateProjectSummary(files: UploadedFile[], stack: StackInfo): string {
  const filesByExt: Record<string, number> = {};
  let totalLines = 0;

  for (const f of files) {
    const ext = f.path.split('.').pop()?.toLowerCase() || 'other';
    filesByExt[ext] = (filesByExt[ext] || 0) + 1;
    totalLines += f.content.split('\n').length;
  }

  const topExts = Object.entries(filesByExt)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ext, count]) => `.${ext} (${count})`)
    .join(', ');

  const dirs = new Set<string>();
  for (const f of files) {
    const parts = f.path.split('/');
    if (parts.length > 1) dirs.add(parts[0]);
  }

  return `## ${stack.icon} ${stack.label}

**Arquivos:** ${files.length} | **Linhas:** ~${totalLines.toLocaleString()} | **Pastas raiz:** ${dirs.size}

**Tecnologias:** ${stack.signals.join(', ') || 'N/A'}

**Tipos de arquivo:** ${topExts}

${stack.testCommand ? `**Testes:** \`${stack.testCommand}\`` : ''}
${stack.buildCommand ? `**Build:** \`${stack.buildCommand}\`` : ''}`;
}
