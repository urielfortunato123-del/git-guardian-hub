import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen, ArrowLeft, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { mockFileTree, type FileNode } from "@/data/mockData";

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

export function RepoExplorerPage() {
  const { owner, name } = useParams();

  return (
    <div className="flex h-full">
      {/* File tree sidebar */}
      <div className="w-72 border-r border-border bg-sidebar flex flex-col">
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

      {/* Content area */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <FileCode className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Selecione um arquivo para editar</p>
        </motion.div>
      </div>
    </div>
  );
}
