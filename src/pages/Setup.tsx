import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { toast } from "sonner";
import type { DoctorProfile, Especialidade } from "@/types/doctor";
import type { CarouselSkill } from "@/types/carousel";
import { DEFAULT_SKILL } from "@/types/carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Instagram, Loader2, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const especialidades: Especialidade[] = [
  "Dermatologia",
  "Ginecologia e Obstetrícia",
  "Pediatria",
  "Cardiologia",
  "Ortopedia",
  "Oftalmologia",
  "Nutrologia",
  "Endocrinologia",
  "Cirurgia Plástica",
  "Psiquiatria",
  "Medicina Estética",
  "Outra",
];

const tomOptions = [
  { value: "educativo", label: "Educativo" },
  { value: "manifesto", label: "Manifesto" },
  { value: "hibrido", label: "Híbrido" },
  { value: "conversao", label: "Conversão" },
];

const Setup = () => {
  const { profile, setProfile } = useDoctor();

  const [form, setForm] = useState<DoctorProfile>(
    profile || {
      nome: "",
      especialidade: "Outra",
      subespecialidade: "",
      crm: "",
      cidade: "",
      estado: "",
      plataformas: ["instagram"],
      publico_alvo: "",
      tom_de_voz: "educativo",
      diferenciais: [],
      objetivos: [],
    }
  );

  const [skill, setSkill] = useState<CarouselSkill>(
    profile?.skill || DEFAULT_SKILL
  );

  const [instagramHandle, setInstagramHandle] = useState(
    profile?.instagram_handle || profile?.skill?.handle || ""
  );
  const [importLoading, setImportLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(form.foto_url ?? null);

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setFotoPreview(dataUrl);
      updateField("foto_url", dataUrl);
      toast.success("Foto adicionada!");
    };
    reader.readAsDataURL(file);
  };

  const removeFoto = () => {
    setFotoPreview(null);
    updateField("foto_url", undefined);
  };

  const parseInstagramInput = (input: string): string => {
    const trimmed = input.trim().replace(/\/+$/, "");
    // URL format: https://instagram.com/handle or https://www.instagram.com/handle
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/);
    if (urlMatch) return urlMatch[1];
    // Handle format: @handle or handle
    return trimmed.replace(/^@/, "");
  };

  const buildUpdatedSkill = (profileData: DoctorProfile, handle: string): CarouselSkill => ({
    ...skill,
    nome_canal: profileData.nome || skill.nome_canal,
    handle: handle || skill.handle,
    publico_principal: profileData.publico_alvo || skill.publico_principal,
    tom: profileData.tom_de_voz || skill.tom,
    pilares: profileData.diferenciais.length > 0 ? profileData.diferenciais : skill.pilares,
  });

  const persistProfile = async (profileData: DoctorProfile) => {
    const normalizedHandle = profileData.instagram_handle?.trim() || undefined;
    const persistedProfile: DoctorProfile = {
      ...profileData,
      instagram_handle: normalizedHandle,
      skill: buildUpdatedSkill(profileData, normalizedHandle || ""),
    };

    setProfile(persistedProfile);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return persistedProfile;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: persistedProfile.nome || null,
        specialty: persistedProfile.especialidade || null,
        instagram_handle: normalizedHandle || null,
        photo_url: persistedProfile.foto_url || null,
      },
      { onConflict: "id" }
    );

    if (error) throw error;

    return persistedProfile;
  };

  const handleInstagramImport = async () => {
    if (!instagramHandle.trim()) {
      toast.error("Cole a URL do perfil do Instagram para importar.");
      return;
    }
    const handle = parseInstagramInput(instagramHandle);
    if (!handle) {
      toast.error("URL inválida. Use o formato: https://instagram.com/seuperfil");
      return;
    }
    setImportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "import-instagram-profile",
        { body: { handle } }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const importedProfile: DoctorProfile = {
        ...form,
        nome: form.nome || data.nome || "",
        especialidade:
          form.especialidade === "Outra" && data.especialidade
            ? data.especialidade
            : form.especialidade,
        subespecialidade: form.subespecialidade || data.subespecialidade || "",
        publico_alvo: form.publico_alvo || data.publico_alvo || "",
        tom_de_voz: form.tom_de_voz || data.tom_de_voz || "",
        diferenciais:
          form.diferenciais.length === 0 && Array.isArray(data.diferenciais)
            ? data.diferenciais
            : form.diferenciais,
        bio_instagram: form.bio_instagram || data.bio_instagram || "",
        instagram_handle: handle,
      };

      setForm(importedProfile);
      setInstagramHandle(handle);
      await persistProfile(importedProfile);
      const confidence = data.confidence ?? 0;
      toast.success(
        `Perfil importado e salvo com ${Math.round(confidence * 100)}% de confiança.`
      );
    } catch (err: unknown) {
      toast.error(
        `Erro ao importar: ${err instanceof Error ? err.message : "Erro desconhecido"}`
      );
    } finally {
      setImportLoading(false);
    }
  };

  const updateField = <K extends keyof DoctorProfile>(key: K, value: DoctorProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEstiloVisual = <K extends keyof CarouselSkill["estilo_visual"]>(
    key: K,
    value: CarouselSkill["estilo_visual"][K]
  ) => {
    setSkill((prev) => ({
      ...prev,
      estilo_visual: { ...prev.estilo_visual, [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!form.nome || !form.especialidade) {
      toast.error("Preencha pelo menos o nome e a especialidade.");
      return;
    }

    try {
      await persistProfile({
        ...form,
        instagram_handle: instagramHandle.trim(),
      });
      toast.success("Perfil salvo com sucesso!");
    } catch (err) {
      console.error("Failed to persist profile:", err);
      toast.error("Perfil salvo localmente, mas não sincronizou com sua conta.");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
            Seu perfil
          </h1>
          <p className="text-muted-foreground text-sm">
            Configure uma vez — seus carrosséis serão personalizados automaticamente.
          </p>
        </div>

        {/* Instagram import */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Importar do Instagram
            </Label>
            <div className="flex gap-2">
              <Input
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="https://instagram.com/dramarcellaachy"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleInstagramImport}
                disabled={importLoading}
                className="gap-2"
              >
                {importLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Instagram className="h-4 w-4" />
                )}
                {importLoading ? "Importando..." : "Importar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cole a URL do perfil (ex: https://instagram.com/seuperfil) ou o @handle.
            </p>
          </CardContent>
        </Card>

        {/* Photo */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Foto para carrosséis
            </Label>
            <div className="flex items-center gap-4">
              {fotoPreview ? (
                <div className="relative">
                  <img
                    src={fotoPreview}
                    alt="Foto"
                    className="w-20 h-20 rounded-full object-cover border-2 border-accent/30"
                  />
                  <button
                    onClick={removeFoto}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  <Camera className="h-7 w-7 text-muted-foreground/40" />
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-secondary text-sm font-medium transition-colors cursor-pointer">
                  <Camera className="h-4 w-4" />
                  {fotoPreview ? "Trocar foto" : "Escolher foto"}
                </span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Core fields */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da médica *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => updateField("nome", e.target.value)}
                  placeholder="Dra. Marcella Achy"
                />
              </div>
              <div className="space-y-2">
                <Label>Especialidade *</Label>
                <Select
                  value={form.especialidade}
                  onValueChange={(v) => updateField("especialidade", v as Especialidade)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub">Subespecialidade</Label>
              <Input
                id="sub"
                value={form.subespecialidade || ""}
                onChange={(e) => updateField("subespecialidade", e.target.value)}
                placeholder="Ex: Rejuvenescimento facial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publico">Público-alvo</Label>
              <Textarea
                id="publico"
                value={form.publico_alvo}
                onChange={(e) => updateField("publico_alvo", e.target.value)}
                placeholder="Ex: Mulheres 35-55 anos que buscam rejuvenescimento natural"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Tom de voz</Label>
              <Select
                value={form.tom_de_voz || "educativo"}
                onValueChange={(v) => updateField("tom_de_voz", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tomOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pilares">Pilares de conteúdo (separados por vírgula)</Label>
              <Textarea
                id="pilares"
                value={form.diferenciais.join(", ")}
                onChange={(e) =>
                  updateField(
                    "diferenciais",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Ex: Bioestimuladores, Skincare, Método 360°"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand colors */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Label className="text-sm font-semibold">Cores da marca</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Fundo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={skill.estilo_visual.cor_fundo}
                    onChange={(e) => updateEstiloVisual("cor_fundo", e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {skill.estilo_visual.cor_fundo}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Texto</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={skill.estilo_visual.cor_texto}
                    onChange={(e) => updateEstiloVisual("cor_texto", e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {skill.estilo_visual.cor_texto}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Destaque</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={skill.estilo_visual.cor_destaque}
                    onChange={(e) => updateEstiloVisual("cor_destaque", e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground font-mono">
                    {skill.estilo_visual.cor_destaque}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Salvar perfil
        </Button>
      </div>
    </AppLayout>
  );
};

export default Setup;
