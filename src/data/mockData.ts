export interface Repo {
  id: number;
  full_name: string;
  owner: string;
  name: string;
  description: string;
  private: boolean;
  language: string;
  updated_at: string;
  stars: number;
}

export interface FileNode {
  name: string;
  path: string;
  type: "dir" | "file";
  children?: FileNode[];
}

export const mockRepos: Repo[] = [
  { id: 1, full_name: "user/lovhub-app", owner: "user", name: "lovhub-app", description: "GitHub Project Manager PWA", private: false, language: "TypeScript", updated_at: "2026-02-08T10:00:00Z", stars: 42 },
  { id: 2, full_name: "user/fastapi-starter", owner: "user", name: "fastapi-starter", description: "FastAPI boilerplate with auth", private: true, language: "Python", updated_at: "2026-02-07T15:30:00Z", stars: 18 },
  { id: 3, full_name: "user/react-dashboard", owner: "user", name: "react-dashboard", description: "Admin dashboard with charts", private: false, language: "TypeScript", updated_at: "2026-02-06T09:00:00Z", stars: 127 },
  { id: 4, full_name: "user/ai-chatbot", owner: "user", name: "ai-chatbot", description: "AI-powered chatbot with RAG", private: true, language: "Python", updated_at: "2026-02-05T22:00:00Z", stars: 63 },
  { id: 5, full_name: "user/portfolio-site", owner: "user", name: "portfolio-site", description: "Personal portfolio website", private: false, language: "TypeScript", updated_at: "2026-02-04T14:00:00Z", stars: 8 },
  { id: 6, full_name: "user/node-api", owner: "user", name: "node-api", description: "REST API with Express + Prisma", private: true, language: "JavaScript", updated_at: "2026-02-03T18:00:00Z", stars: 31 },
];

export const mockFileTree: FileNode[] = [
  {
    name: "src", path: "src", type: "dir", children: [
      {
        name: "components", path: "src/components", type: "dir", children: [
          { name: "Header.tsx", path: "src/components/Header.tsx", type: "file" },
          { name: "Sidebar.tsx", path: "src/components/Sidebar.tsx", type: "file" },
          { name: "Button.tsx", path: "src/components/Button.tsx", type: "file" },
        ]
      },
      {
        name: "pages", path: "src/pages", type: "dir", children: [
          { name: "Home.tsx", path: "src/pages/Home.tsx", type: "file" },
          { name: "About.tsx", path: "src/pages/About.tsx", type: "file" },
        ]
      },
      { name: "App.tsx", path: "src/App.tsx", type: "file" },
      { name: "main.tsx", path: "src/main.tsx", type: "file" },
      { name: "index.css", path: "src/index.css", type: "file" },
    ]
  },
  { name: "package.json", path: "package.json", type: "file" },
  { name: "tsconfig.json", path: "tsconfig.json", type: "file" },
  { name: "vite.config.ts", path: "vite.config.ts", type: "file" },
  { name: "README.md", path: "README.md", type: "file" },
];

export const mockFileContents: Record<string, string> = {
  "src/App.tsx": `import React from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';

function App() {
  return (
    <div className="app">
      <Header title="LovHub" />
      <div className="layout">
        <Sidebar />
        <main>
          <h1>Welcome to LovHub</h1>
          <p>Your GitHub Project Manager</p>
        </main>
      </div>
    </div>
  );
}

export default App;`,
  "src/main.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "src/components/Header.tsx": `interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <nav>
        <a href="/repos">Repos</a>
        <a href="/settings">Settings</a>
      </nav>
    </header>
  );
}`,
  "package.json": `{
  "name": "lovhub-app",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}`,
  "README.md": `# LovHub App

A GitHub Project Manager built with React + Vite.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
};

export const templates = [
  { id: "react-pwa", name: "React PWA", description: "React + Vite + PWA starter", icon: "⚛️", language: "TypeScript" },
  { id: "nextjs", name: "Next.js", description: "Next.js App Router starter", icon: "▲", language: "TypeScript" },
  { id: "fastapi", name: "FastAPI", description: "FastAPI + SQLAlchemy starter", icon: "🐍", language: "Python" },
  { id: "node-express", name: "Node/Express", description: "Express + Prisma REST API", icon: "🟢", language: "JavaScript" },
  { id: "lovable-app", name: "Lovable App", description: "Full-stack Lovable template", icon: "💜", language: "TypeScript" },
];

export const languageColors: Record<string, string> = {
  TypeScript: "hsl(212, 92%, 58%)",
  JavaScript: "hsl(48, 96%, 53%)",
  Python: "hsl(212, 60%, 44%)",
  Rust: "hsl(24, 80%, 50%)",
  Go: "hsl(195, 68%, 52%)",
};
