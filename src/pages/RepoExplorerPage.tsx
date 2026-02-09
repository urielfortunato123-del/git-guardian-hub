import { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, ArrowLeft, GitBranch } from "lucide-react";
import { mockFileTree, mockFileContents, type FileNode } from "@/data/mockData";
import { AIChat } from "@/components/AIChat";
import { LiveCodePreview } from "@/components/LiveCodePreview";
import type { UploadedFile } from "@/lib/fileUtils";
import { getLanguageFromPath } from "@/lib/fileUtils";

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const { owner, name } = useParams();

  if (node.type === "dir") {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-secondary/60 rounded transition-colors text-foreground"
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          {open ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary" />}
          <span className="font-medium">{node.name}</span>
        </button>
        {open && node.children?.map((child) => (
          <FileTreeItem key={child.path} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <Link
      to={`/editor/${owner}/${name}?path=${encodeURIComponent(node.path)}`}
      className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-secondary/60 rounded transition-colors text-muted-foreground hover:text-foreground"
      style={{ paddingLeft: `${depth * 16 + 28}px` }}
    >
      <FileCode className="w-4 h-4 text-accent" />
      <span>{node.name}</span>
    </Link>
  );
}

/** Flatten file tree into UploadedFile[] */
function flattenTree(nodes: FileNode[], contents: Record<string, string>): UploadedFile[] {
  const result: UploadedFile[] = [];
  for (const node of nodes) {
    if (node.type === "file" && contents[node.path]) {
      result.push({
        path: node.path,
        content: contents[node.path],
        language: getLanguageFromPath(node.path),
      });
    }
    if (node.children) {
      result.push(...flattenTree(node.children, contents));
    }
  }
  return result;
}

export function RepoExplorerPage() {
  const { owner, name } = useParams();
  const [fileContents, setFileContents] = useState<Record<string, string>>(mockFileContents);
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});

  const files = useMemo<UploadedFile[]>(
    () => flattenTree(mockFileTree, fileContents),
    [fileContents]
  );

  const handleFileUpdate = useCallback((path: string, content: string) => {
    setFileContents(prev => ({ ...prev, [path]: content }));
    setGeneratedFiles(prev => ({ ...prev, [path]: content }));
  }, []);

  return (
    <div className="flex h-full">
      {/* File tree sidebar */}
      <div className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="h-12 flex items-center gap-2 px-4 border-b border-sidebar-border">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-semibold text-sm text-foreground truncate">{owner}/{name}</span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-sidebar-border">
          <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">main</span>
        </div>

        <div className="flex-1 overflow-auto py-2">
          {mockFileTree.map((node) => (
            <FileTreeItem key={node.path} node={node} />
          ))}
        </div>
      </div>

      {/* AI Chat agent - left panel */}
      <div className="flex-1 flex flex-col min-h-0 border-r border-border">
        <AIChat files={files} onFileUpdate={handleFileUpdate} />
      </div>

      {/* Live code preview - right panel */}
      <div className="w-[45%] flex flex-col min-h-0 bg-background">
        <LiveCodePreview files={generatedFiles} />
      </div>
    </div>
  );
}
