import JSZip from "jszip";
import { getLanguageFromPath, type UploadedFile } from "./fileUtils";

const SKIP_PATTERNS = [
  /node_modules\//,
  /\.git\//,
  /\.next\//,
  /dist\//,
  /build\//,
  /\.DS_Store/,
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
];

export async function extractFilesFromZip(file: File): Promise<UploadedFile[]> {
  const zip = await JSZip.loadAsync(file);
  const files: UploadedFile[] = [];

  // Find common root prefix (e.g. "my-project/")
  const allPaths = Object.keys(zip.files).filter(p => !zip.files[p].dir);
  const commonPrefix = findCommonPrefix(allPaths);

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;

    // Strip common prefix
    const relativePath = commonPrefix ? path.replace(commonPrefix, "") : path;
    if (!relativePath) continue;

    if (SKIP_PATTERNS.some(p => p.test(relativePath))) continue;

    try {
      const content = await entry.async("string");
      if (content.length > 500 * 1024) continue; // skip large files

      files.push({
        path: relativePath,
        content,
        language: getLanguageFromPath(relativePath),
      });
    } catch {
      // binary file, skip
    }
  }

  return files;
}

function findCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  const first = paths[0];
  const slashIdx = first.indexOf("/");
  if (slashIdx === -1) return "";

  const candidate = first.substring(0, slashIdx + 1);
  if (paths.every(p => p.startsWith(candidate))) return candidate;
  return "";
}
