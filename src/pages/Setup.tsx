import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { toast } from "sonner";
import type { DoctorProfile, Especialidade, Plataforma } from "@/types/doctor";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Instagram, Loader2, X } from "lucide-react";
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

const plataformaOptions: { value: Plataforma; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
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
      plataformas: [],
      publico_alvo: "",
      tom_de_voz: "",
      diferenciais: [],
      objetivos: [],
    }
  );

  const [skill, setSkill] = useState<CarouselSkill>(
    profile?.skill || DEFAULT_SKILL
  );

  const [instagramHandle, setInstagramHandle] = useState(
    profile?.skill?.handle || ""
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
      toast.error("Imagem muito grande. Maximo 5MB.");
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
    updateField("foto_url", undefined as any);
  };

  const handleInstagramImport = async () => {
    if (!instagramHandle.trim()) {
      toast.error("Digite um handle do Instagram para importar.");
      return;
    }

    setImportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "import-instagram-profile",
        { body: { handle: instagramHandle.trim() } }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Merge returned data into form — only overwrite empty fields or if returned value is non-empty
      setForm((prev) => ({
        ...prev,
        nome: prev.nome || data.nome || prev.nome,
        especialidade:
          prev.especialidade === "Outra" && data.especialidade
            ? data.especialidade
            : prev.especialidade,
        subespecialidade:
          prev.subespecialidade || data.subespecialidade || "",
        crm: prev.crm || data.crm || "",
        cidade: prev.cidade || data.cidade || "",
        estado: prev.estado || data.estado || "",
        plataformas:
          prev.plataformas.length === 0 && Array.isArray(data.plataformas)
            ? data.plataformas
            : prev.plataformas,
        publico_alvo: prev.publico_alvo || data.publico_alvo || "",
        tom_de_voz: prev.tom_de_voz || data.tom_de_voz || "",
        diferenciais:
          prev.diferenciais.length === 0 && Array.isArray(data.diferenciais)
            ? data.diferenciais
            : prev.diferenciais,
        objetivos: prev.objetivos.length === 0 && Array.isArray(data.objetivos)
          ? data.objetivos
          : prev.objetivos,
        bio_instagram: prev.bio_instagram || data.bio_instagram || "",
      }));

      const confidence = data.confidence ?? 0;
      toast.success(
        `Perfil importado com ${Math.round(confidence * 100)}% de confiança.`
      );
    } catch (err) {
      toast.error(
        `Erro ao importar perfil: ${(err as Error).message}`
      );
    } finally {
      setImportLoading(false);
    }
  };

  const updateSkill = <K extends keyof CarouselSkill>(key: K, value: CarouselSkill[K]) => {
    setSkill((prev) => ({ ...prev, [key]: value }));
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

  const updateField = <K extends keyof DoctorProfile>(key: K, value: DoctorProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePlataforma = (p: Plataforma) => {
    setForm((prev) => ({
      ...prev,
      plataformas: prev.plataformas.includes(p)
        ? prev.plataformas.filter((x) => x !== p)
        : [...prev.plataformas, p],
    }));
  };

  const handleSave = () => {
    if (!form.nome || !form.crm || !form.especialidade) {
      toast.error("Preencha pelo menos nome, CRM e especialidade.");
      return;
    }
    setProfile({ ...form, skill });
    toast.success("Perfil médico salvo com sucesso!");
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Setup do Perfil Médico</h1>
        <p className="text-muted-foreground">
          Configure seu perfil para que os agentes de IA produzam conteúdo personalizado.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Dados Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-pink-300 bg-pink-50/50 p-4 space-y-3">
              <Label className="text-sm font-medium">Importar do Instagram</Label>
              <div className="flex gap-2">
                <Input
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  placeholder="@dra.exemplo"
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
                  {importLoading ? "Importando..." : "Importar do Instagram"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Preencha automaticamente os campos a partir do perfil do Instagram.
              </p>
            </div>

            {/* Photo upload */}
            <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Foto para Carrosséis
              </Label>
              <p className="text-xs text-muted-foreground">
                Sua foto aparecerá nos slides do tipo capa, texto+imagem e final dos carrosséis.
              </p>
              <div className="flex items-center gap-4">
                {fotoPreview ? (
                  <div className="relative">
                    <img
                      src={fotoPreview}
                      alt="Foto do médico"
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-200"
                    />
                    <button
                      onClick={removeFoto}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <Camera className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors cursor-pointer">
                      <Camera className="h-4 w-4" />
                      {fotoPreview ? "Trocar foto" : "Escolher foto"}
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">JPG ou PNG, max 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => updateField("nome", e.target.value)}
                  placeholder="Dr(a). Nome Sobrenome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                <Input
                  id="crm"
                  value={form.crm}
                  onChange={(e) => updateField("crm", e.target.value)}
                  placeholder="CRM/UF 123456"
                />
              </div>

              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select
                  value={form.especialidade}
                  onValueChange={(v) => updateField("especialidade", v as Especialidade)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub">Subespecialidade</Label>
                <Input
                  id="sub"
                  value={form.subespecialidade || ""}
                  onChange={(e) => updateField("subespecialidade", e.target.value)}
                  placeholder="Ex: Dermatologia Estética"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={form.cidade}
                  onChange={(e) => updateField("cidade", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={form.estado}
                  onChange={(e) => updateField("estado", e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plataformas</Label>
              <div className="flex flex-wrap gap-4">
                {plataformaOptions.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={form.plataformas.includes(p.value)}
                      onCheckedChange={() => togglePlataforma(p.value)}
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publico">Público-alvo</Label>
              <Textarea
                id="publico"
                value={form.publico_alvo}
                onChange={(e) => updateField("publico_alvo", e.target.value)}
                placeholder="Descreva seu público ideal: faixa etária, gênero, interesses..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tom">Tom de voz</Label>
              <Textarea
                id="tom"
                value={form.tom_de_voz}
                onChange={(e) => updateField("tom_de_voz", e.target.value)}
                placeholder="Ex: Acessível, didático, com pitadas de humor..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diferenciais">Diferenciais (separados por vírgula)</Label>
              <Textarea
                id="diferenciais"
                value={form.diferenciais.join(", ")}
                onChange={(e) =>
                  updateField(
                    "diferenciais",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Ex: Referência em laser, atendimento humanizado, pós-doutorado"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivos">Objetivos (separados por vírgula)</Label>
              <Textarea
                id="objetivos"
                value={form.objetivos.join(", ")}
                onChange={(e) =>
                  updateField(
                    "objetivos",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Ex: Aumentar autoridade, captar pacientes, lançar curso"
                rows={2}
              />
            </div>

            <Button onClick={handleSave} className="w-full mt-4" size="lg">
              Salvar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* ── Skill de Carrossel ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Skill de Carrossel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill_nome">Nome do canal/marca</Label>
                <Input
                  id="skill_nome"
                  value={skill.nome_canal}
                  onChange={(e) => updateSkill("nome_canal", e.target.value)}
                  placeholder="Ex: MEDSHIFT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill_handle">Handle do Instagram</Label>
                <Input
                  id="skill_handle"
                  value={skill.handle}
                  onChange={(e) => updateSkill("handle", e.target.value)}
                  placeholder="Ex: @dra.silva"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_posicionamento">Posicionamento em 1 linha</Label>
              <Textarea
                id="skill_posicionamento"
                value={skill.posicionamento}
                onChange={(e) => updateSkill("posicionamento", e.target.value)}
                placeholder="Ex: Posicionamento estrategico medico"
                rows={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_tom">Tom de voz</Label>
              <Input
                id="skill_tom"
                value={skill.tom}
                onChange={(e) => updateSkill("tom", e.target.value)}
                placeholder="Ex: Direto, racional, tecnico e acessivel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_pub1">Publico principal</Label>
              <Textarea
                id="skill_pub1"
                value={skill.publico_principal}
                onChange={(e) => updateSkill("publico_principal", e.target.value)}
                placeholder="Ex: Medicos que querem se posicionar no Instagram"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_pub2">Publico secundario</Label>
              <Textarea
                id="skill_pub2"
                value={skill.publico_secundario}
                onChange={(e) => updateSkill("publico_secundario", e.target.value)}
                placeholder="Ex: Profissionais de saude em geral"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_pilares">Pilares de conteudo (separados por virgula)</Label>
              <Textarea
                id="skill_pilares"
                value={skill.pilares.join(", ")}
                onChange={(e) =>
                  updateSkill(
                    "pilares",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Ex: Posicionamento, Estrategia, Conteudo"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_proibicoes">O que nunca fazer (separados por virgula)</Label>
              <Textarea
                id="skill_proibicoes"
                value={skill.proibicoes.join(", ")}
                onChange={(e) =>
                  updateSkill(
                    "proibicoes",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="Ex: Nunca promete resultados, Nunca usa antes/depois"
                rows={2}
              />
            </div>

            {/* Estilo Visual */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-4">Estilo Visual</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skill_cor_fundo">Cor de fundo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="skill_cor_fundo"
                      type="color"
                      value={skill.estilo_visual.cor_fundo}
                      onChange={(e) => updateEstiloVisual("cor_fundo", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{skill.estilo_visual.cor_fundo}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill_cor_destaque">Cor destaque</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="skill_cor_destaque"
                      type="color"
                      value={skill.estilo_visual.cor_destaque}
                      onChange={(e) => updateEstiloVisual("cor_destaque", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{skill.estilo_visual.cor_destaque}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill_cor_texto">Cor do texto</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="skill_cor_texto"
                      type="color"
                      value={skill.estilo_visual.cor_texto}
                      onChange={(e) => updateEstiloVisual("cor_texto", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground">{skill.estilo_visual.cor_texto}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Fonte Display</Label>
                  <Select
                    value={skill.estilo_visual.fonte_display}
                    onValueChange={(v) => updateEstiloVisual("fonte_display", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Bebas Neue", "Oswald", "Archivo Black", "Black Han Sans", "Righteous"].map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fonte Corpo</Label>
                  <Select
                    value={skill.estilo_visual.fonte_corpo}
                    onValueChange={(v) => updateEstiloVisual("fonte_corpo", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Inter", "DM Sans", "Lato", "Nunito", "Roboto"].map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="skill_ref_visual">Referencia visual</Label>
                  <Input
                    id="skill_ref_visual"
                    value={skill.estilo_visual.referencia_visual}
                    onChange={(e) => updateEstiloVisual("referencia_visual", e.target.value)}
                    placeholder="Ex: Wired, Fast Company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill_estilo_img">Estilo de imagem</Label>
                  <Input
                    id="skill_estilo_img"
                    value={skill.estilo_visual.estilo_imagem}
                    onChange={(e) => updateEstiloVisual("estilo_imagem", e.target.value)}
                    placeholder="Ex: cinematic, editorial, dark"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full mt-4" size="lg">
              Salvar Perfil e Skill
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Setup;
