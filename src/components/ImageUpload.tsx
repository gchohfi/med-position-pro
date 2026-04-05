import React, { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { value: "retratos", label: "Retratos" },
  { value: "clinica", label: "Clínica" },
  { value: "bastidores", label: "Bastidores" },
  { value: "feed_atual", label: "Feed atual" },
  { value: "referencias", label: "Referências visuais" },
  { value: "series", label: "Séries" },
  { value: "casos_ouro", label: "Casos de ouro" },
  { value: "geral", label: "Geral" },
];

interface UploadedAsset {
  id: string;
  file_path: string;
  file_name: string;
  category: string;
  note: string | null;
  favorite: boolean;
  created_at: string;
}

interface ImageUploadProps {
  linkedModule?: string;
  linkedSeriesId?: string;
  onUpload?: (asset: UploadedAsset) => void;
  compact?: boolean;
}

export default function ImageUpload({
  linkedModule,
  linkedSeriesId,
  onUpload,
  compact = false,
}: ImageUploadProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("geral");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione apenas imagens (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!user || !selectedFile) return;
    setUploading(true);

    try {
      const ext = selectedFile.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${user.id}/${category}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(filePath, selectedFile, { contentType: selectedFile.type });

      if (uploadError) throw uploadError;

      const { data: assetData, error: insertError } = await supabase
        .from("uploaded_assets")
        .insert([{
          user_id: user.id,
          file_path: filePath,
          file_name: selectedFile.name,
          category,
          linked_module: linkedModule || null,
          linked_series_id: linkedSeriesId || null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      logStrategicEvent(STRATEGIC_EVENTS.ASSET_UPLOADED, "upload", { category });
      toast.success("Imagem salva no seu acervo visual.");

      if (onUpload && assetData) onUpload(assetData as UploadedAsset);

      setSelectedFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      toast.error("Erro ao fazer upload. Tente novamente.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          {uploading ? "Enviando…" : "Adicionar imagem"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.button
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-3 hover:border-accent/40 hover:bg-accent/3 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Image className="h-5 w-5 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Adicionar referência visual
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou WebP · Máximo 5MB
              </p>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-border rounded-2xl p-4 space-y-4"
          >
            <div className="relative">
              <img
                src={preview!}
                alt="Preview"
                className="w-full max-h-48 object-contain rounded-xl bg-muted/30"
              />
              <button
                onClick={clearSelection}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">
                Categoria
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      category === cat.value
                        ? "border-accent bg-accent/8 text-foreground"
                        : "border-border text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 h-10"
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Enviando…" : "Salvar no acervo visual"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
