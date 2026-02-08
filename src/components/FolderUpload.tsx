import { useState, useCallback, useRef } from "react";
import { FolderUp, Loader2 } from "lucide-react";
import { readFilesFromInput, type UploadedFile } from "@/lib/fileUtils";

interface FolderUploadProps {
  onFilesLoaded: (files: UploadedFile[]) => void;
  isLoading?: boolean;
}

export function FolderUpload({ onFilesLoaded, isLoading }: FolderUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList) => {
    setProcessing(true);
    try {
      const files = await readFilesFromInput(fileList);
      onFilesLoaded(files);
    } catch (e) {
      console.error("Error reading files:", e);
    } finally {
      setProcessing(false);
    }
  }, [onFilesLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const busy = processing || isLoading;

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`relative cursor-pointer border-2 border-dashed rounded-lg p-8 text-center transition-all ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border hover:border-muted-foreground"
      } ${busy ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleInputChange}
        className="hidden"
        // @ts-ignore - webkitdirectory is not in the types
        webkitdirectory="true"
        directory="true"
        multiple
      />
      
      {busy ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Lendo arquivos...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <FolderUp className="w-10 h-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Arraste uma pasta aqui</p>
            <p className="text-sm text-muted-foreground mt-1">
              ou clique para selecionar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
