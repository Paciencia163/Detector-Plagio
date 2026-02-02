import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UploadedFile {
  file: File;
  id: string;
  status: "uploading" | "processing" | "ready" | "error";
  progress: number;
  storagePath?: string;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
};

export function DocumentUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState({
    title: "",
    author: "",
    notes: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File): UploadedFile | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: `O ficheiro "${file.name}" não é suportado. Use PDF, DOCX ou TXT.`,
        variant: "destructive",
      });
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Ficheiro muito grande",
        description: `O ficheiro "${file.name}" excede o limite de 10MB.`,
        variant: "destructive",
      });
      return null;
    }

    return {
      file,
      id: crypto.randomUUID(),
      status: "uploading",
      progress: 0,
    };
  };

  const uploadToStorage = async (uploadedFile: UploadedFile) => {
    if (!user) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: "error" } : f
        )
      );
      toast({
        title: "Erro de autenticação",
        description: "Deve estar autenticado para fazer upload de ficheiros.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update progress to show upload starting
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, progress: 10 } : f
        )
      );

      // Generate unique file path: userId/timestamp-filename
      const fileExt = uploadedFile.file.name.split('.').pop();
      const fileName = `${Date.now()}-${uploadedFile.file.name}`;
      const filePath = `${user.id}/${fileName}`;

      // Update progress
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, progress: 30 } : f
        )
      );

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadedFile.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Update progress
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, progress: 80 } : f
        )
      );

      // Mark as ready
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "ready", progress: 100, storagePath: data.path }
            : f
        )
      );

      toast({
        title: "Upload concluído",
        description: `O ficheiro "${uploadedFile.file.name}" foi carregado com sucesso.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, status: "error" } : f
        )
      );
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível carregar o ficheiro.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const processedFiles = droppedFiles.map(processFile).filter(Boolean) as UploadedFile[];

      setFiles((prev) => [...prev, ...processedFiles]);
      processedFiles.forEach(uploadToStorage);
    },
    [user, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const processedFiles = selectedFiles.map(processFile).filter(Boolean) as UploadedFile[];

    setFiles((prev) => [...prev, ...processedFiles]);
    processedFiles.forEach(uploadToStorage);
  };

  const removeFile = async (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    
    // If file was uploaded to storage, delete it
    if (fileToRemove?.storagePath) {
      try {
        await supabase.storage
          .from('documents')
          .remove([fileToRemove.storagePath]);
      } catch (error) {
        console.error('Error removing file from storage:', error);
      }
    }
    
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAnalyze = async () => {
    if (files.length === 0 || files.some((f) => f.status !== "ready")) return;

    setIsAnalyzing(true);

    // Simulate analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));

    toast({
      title: "Análise concluída",
      description: "O relatório de plágio está pronto para visualização.",
    });

    navigate("/report/demo");
  };

  const allFilesReady = files.length > 0 && files.every((f) => f.status === "ready");

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "upload-zone cursor-pointer",
          isDragging && "upload-zone-active"
        )}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              Arraste ficheiros ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Suporta PDF, DOCX e TXT (máx. 10MB por ficheiro)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Ficheiros selecionados</h3>
          <div className="space-y-2">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
              >
                <div className="p-2 rounded-lg bg-secondary">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {uploadedFile.file.name}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                      {FILE_TYPE_LABELS[uploadedFile.file.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {(uploadedFile.file.size / 1024).toFixed(1)} KB
                    </span>
                    {uploadedFile.status === "uploading" && (
                      <Progress value={uploadedFile.progress} className="h-1.5 flex-1 max-w-32" />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {uploadedFile.status === "uploading" && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {uploadedFile.status === "ready" && (
                    <CheckCircle className="h-5 w-5 text-risk-low" />
                  )}
                  {uploadedFile.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadedFile.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Form */}
      {files.length > 0 && (
        <div className="space-y-4 p-6 rounded-xl border border-border bg-card">
          <h3 className="font-display font-semibold text-lg">Informações do Documento</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título do trabalho</Label>
              <Input
                id="title"
                placeholder="Ex: Análise Económica do Sector..."
                value={metadata.title}
                onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Autor(es)</Label>
              <Input
                id="author"
                placeholder="Nome do autor ou autores"
                value={metadata.author}
                onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionais para o avaliador..."
              rows={3}
              value={metadata.notes}
              onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          <AlertCircle className="inline-block h-4 w-4 mr-1" />
          Este sistema é uma ferramenta de apoio e não substitui a avaliação humana.
        </p>
        <Button
          size="lg"
          disabled={!allFilesReady || isAnalyzing}
          onClick={handleAnalyze}
          className="min-w-40"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A analisar...
            </>
          ) : (
            "Iniciar Análise"
          )}
        </Button>
      </div>
    </div>
  );
}
