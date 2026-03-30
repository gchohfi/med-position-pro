import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Camera, Loader2, X } from "lucide-react";

interface ProfilePhotoUploadProps {
  currentPhotoUrl: string | null;
  onPhotoUpdated: (url: string | null) => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoUpdated,
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/profile-photo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user-assets")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("user-assets")
        .getPublicUrl(path);

      const photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ photo_url: photoUrl } as any)
        .eq("id", user.id);

      if (updateError) throw updateError;

      onPhotoUpdated(photoUrl);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar foto.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ photo_url: null } as any)
        .eq("id", user.id);
      if (error) throw error;
      onPhotoUpdated(null);
      toast.success("Foto removida.");
    } catch {
      toast.error("Erro ao remover foto.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Photo preview */}
      <div
        className="relative w-16 h-16 rounded-full bg-muted border-2 border-accent/20 overflow-hidden flex items-center justify-center cursor-pointer group"
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {currentPhotoUrl ? (
          <img
            src={currentPhotoUrl}
            alt="Foto profissional"
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-medium text-accent hover:text-accent/80 transition-colors text-left"
        >
          {currentPhotoUrl ? "Trocar foto" : "Adicionar foto profissional"}
        </button>
        {currentPhotoUrl && (
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="text-[11px] text-muted-foreground hover:text-destructive transition-colors text-left flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Remover
          </button>
        )}
        <span className="text-[10px] text-muted-foreground">
          Usada nos slides do carrossel
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhotoUpload;
