export interface UploadedFile {
  path: string;
  content: string;
  language: string;
}

export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    dockerfile: 'dockerfile',
    toml: 'toml',
    xml: 'xml',
  };
  return langMap[ext] || 'plaintext';
}

export async function readFilesFromInput(fileList: FileList): Promise<UploadedFile[]> {
  const files: UploadedFile[] = [];
  
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    
    // Skip common non-text files and folders
    const skipPatterns = [
      /node_modules/,
      /\.git\//,
      /\.next\//,
      /dist\//,
      /build\//,
      /\.DS_Store/,
      /\.env\.local/,
      /\.lock$/,
      /\.png$/i,
      /\.jpg$/i,
      /\.jpeg$/i,
      /\.gif$/i,
      /\.ico$/i,
      /\.woff/i,
      /\.ttf$/i,
      /\.eot$/i,
      /\.svg$/i,
      /\.mp3$/i,
      /\.mp4$/i,
      /\.pdf$/i,
      /\.zip$/i,
      /\.tar$/i,
    ];
    
    const relativePath = file.webkitRelativePath || file.name;
    
    if (skipPatterns.some(p => p.test(relativePath))) {
      continue;
    }

    // Only read small text files
    if (file.size > 500 * 1024) {
      continue; // Skip files > 500KB
    }

    try {
      const content = await file.text();
      files.push({
        path: relativePath,
        content,
        language: getLanguageFromPath(relativePath),
      });
    } catch (e) {
      console.warn(`Could not read file: ${relativePath}`, e);
    }
  }

  return files;
}

export function buildFileTree(files: UploadedFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  
  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join('/');
      
      let node = current.find(n => n.name === name);
      
      if (!node) {
        node = {
          name,
          path,
          type: isFile ? 'file' : 'dir',
          children: isFile ? undefined : [],
        };
        current.push(node);
      }
      
      if (!isFile && node.children) {
        current = node.children;
      }
    }
  }
  
  // Sort: folders first, then files, alphabetically
  const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(n => ({
      ...n,
      children: n.children ? sortNodes(n.children) : undefined,
    }));
  };
  
  return sortNodes(root);
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileTreeNode[];
}
