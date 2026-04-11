import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { toast } from "sonner";
import type { DoctorProfile, Especialidade } from "@/types/doctor";
import type { CarouselSkill, PreferredVisualStyle } from "@/types/carousel";
import { DEFAULT_SKILL } from "@/types/carousel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Instagram, Loader2, X, Save, Check, Cloud, CloudOff,
  ChevronRight, ChevronLeft, User, Target, BookOpen, Palette,
  PenTool, Eye, Sparkles, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ── Constants ─────────────────────────────────────────────────── */

const especialidades: Especialidade[] = [
  "Dermatologia", "Ginecologia e Obstetrícia", "Pediatria", "Cardiologia",
  "Ortopedia", "Oftalmologia", "Nutrologia", "Endocrinologia",
  "Cirurgia Plástica", "Psiquiatria", "Medicina Estética", "Outra",
];

const tomOptions = [
  { value: "educativo", label: "Educativo", desc: "Explica com clareza, acolhe dúvidas" },
  { value: "manifesto", label: "Manifesto", desc: "Posicionamento forte, provocativo" },
  { value: "hibrido", label: "Híbrido", desc: "Educa com personalidade e opinião" },
  { value: "conversao", label: "Conversão", desc: "Foco em atrair pacientes" },
];

const visualStyles: { value: PreferredVisualStyle; label: string; desc: string; colors: string[] }[] = [
  { value: "editorial_black_gold", label: "Editorial Black & Gold", desc: "Sofisticado, premium, alto impacto", colors: ["#111111", "#C9A55C", "#F0F0F0"] },
  { value: "ivory_sage", label: "Ivory & Sage", desc: "Natural, acolhedor, feminino", colors: ["#FAF8F5", "#7A8B6F", "#2C2C2C"] },
  { value: "travessia", label: "Travessia", desc: "Bold, moderno, contrastante", colors: ["#0A0A0A", "#FFFFFF", "#E94560"] },
];

const STEPS = [
  { key: "identity", label: "Identidade", icon: User },
  { key: "audience", label: "Público", icon: Target },
  { key: "references", label: "Referências", icon: BookOpen },
  { key: "visual", label: "Visual", icon: Palette },
  { key: "editorial", label: "Editorial", icon: PenTool },
  { key: "review", label: "Revisão", icon: Eye },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

/* ── Suggestion chips by specialty ─────────────────────────────── */

const publicoSuggestions: Record<string, string[]> = {
  Dermatologia: ["Mulheres 25-45 que buscam skincare", "Pacientes com acne resistente", "Público interessado em anti-aging"],
  "Ginecologia e Obstetrícia": ["Gestantes de primeiro filho", "Mulheres 30+ planejando gravidez", "Mulheres em menopausa"],
  Pediatria: ["Mães de crianças 0-5 anos", "Pais preocupados com alimentação", "Famílias buscando pediatra humanizado"],
  Cardiologia: ["Homens 40+ com risco cardiovascular", "Pacientes pós-infarto", "Público interessado em prevenção"],
  Nutrologia: ["Mulheres buscando emagrecimento saudável", "Pacientes com deficiências nutricionais", "Atletas amadores"],
  "Cirurgia Plástica": ["Mulheres 30-55 interessadas em rejuvenescimento", "Pacientes pós-bariátrica", "Público buscando harmonização"],
  "Medicina Estética": ["Mulheres 25-50 interessadas em procedimentos minimamente invasivos", "Público buscando prevenção do envelhecimento"],
  default: ["Pacientes que buscam informação de qualidade", "Público interessado em prevenção", "Profissionais de saúde"],
};

const diferenciaisSuggestions: Record<string, string[]> = {
  Dermatologia: ["Skincare baseado em evidência", "Dermatologia integrativa", "Pele real, sem filtro"],
  "Ginecologia e Obstetrícia": ["Parto humanizado", "Saúde da mulher moderna", "Ginecologia integrativa"],
  Pediatria: ["Pediatria gentil", "Desenvolvimento infantil", "Alimentação na infância"],
  Nutrologia: ["Nutrologia funcional", "Performance e longevidade", "Suplementação inteligente"],
  "Cirurgia Plástica": ["Naturalidade acima de tudo", "Resultado personalizado", "Segurança e técnica"],
  "Medicina Estética": ["Menos é mais", "Beleza natural", "Protocolos personalizados"],
  default: ["Educação em saúde", "Atendimento humanizado", "Ciência acessível"],
};

/* ── Component ─────────────────────────────────────────────────── */

const Setup = () => {
  const { profile, persistProfile, isProfileLoading } = useDoctor();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DoctorProfile>(
    profile || {
      nome: "", especialidade: "Outra", subespecialidade: "", crm: "",
      cidade: "", estado: "", plataformas: ["instagram"], publico_alvo: "",
      tom_de_voz: "educativo", diferenciais: [], objetivos: [],
    }
  );
  const [skill, setSkill] = useState<CarouselSkill>(profile?.skill || DEFAULT_SKILL);
  const [instagramHandle, setInstagramHandle] = useState(profile?.instagram_handle || "");
  const [importLoading, setImportLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSteps, setSavedSteps] = useState<Set<number>>(new Set());
  const [fotoPreview, setFotoPreview] = useState<string | null>(form.foto_url ?? null);
  const [newDiferencial, setNewDiferencial] = useState("");

  // Rehydrate from profile
  useEffect(() => {
    if (profile && !isProfileLoading) {
      setForm(profile);
      setSkill(profile.skill || DEFAULT_SKILL);
      setInstagramHandle(profile.instagram_handle || profile.skill?.handle || "");
      setFotoPreview(profile.foto_url ?? null);
    }
  }, [profile, isProfileLoading]);

  const updateField = <K extends keyof DoctorProfile>(key: K, value: DoctorProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateEstiloVisual = <K extends keyof CarouselSkill["estilo_visual"]>(
    key: K, value: CarouselSkill["estilo_visual"][K]
  ) => {
    setSkill((prev) => ({ ...prev, estilo_visual: { ...prev.estilo_visual, [key]: value } }));
  };

  const buildUpdatedSkill = useCallback((p: DoctorProfile, handle: string): CarouselSkill => ({
    ...skill,
    nome_canal: p.nome || skill.nome_canal,
    handle: handle || skill.handle,
    publico_principal: p.publico_alvo || skill.publico_principal,
    tom: p.tom_de_voz || skill.tom,
    pilares: p.diferenciais.length > 0 ? p.diferenciais : skill.pilares,
  }), [skill]);

  /* ── Save per step (incremental) ─────────────────────────────── */
  const saveStep = useCallback(async () => {
    setSaving(true);
    try {
      const handle = instagramHandle.trim() || undefined;
      const fullProfile: DoctorProfile = {
        ...form,
        instagram_handle: handle,
        skill: buildUpdatedSkill(form, handle || ""),
      };
      const result = await persistProfile(fullProfile);
      setSavedSteps((prev) => new Set(prev).add(step));
      if (result.remote) {
        toast.success("Progresso salvo", { icon: <Cloud className="h-4 w-4 text-accent" />, duration: 2000 });
      }
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }, [form, instagramHandle, skill, step, buildUpdatedSkill, persistProfile]);

  const goNext = async () => {
    await saveStep();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  /* ── Instagram import ────────────────────────────────────────── */
  const parseHandle = (input: string): string => {
    const trimmed = input.trim().replace(/\/+$/, "");
    const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/);
    return urlMatch ? urlMatch[1] : trimmed.replace(/^@/, "");
  };

  const handleInstagramImport = async () => {
    const handle = parseHandle(instagramHandle);
    if (!handle) { toast.error("Informe seu perfil do Instagram."); return; }
    setImportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-instagram-profile", { body: { handle } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setForm((prev) => ({
        ...prev,
        nome: prev.nome || data.nome || "",
        especialidade: prev.especialidade === "Outra" && data.especialidade ? data.especialidade : prev.especialidade,
        subespecialidade: prev.subespecialidade || data.subespecialidade || "",
        publico_alvo: prev.publico_alvo || data.publico_alvo || "",
        tom_de_voz: prev.tom_de_voz || data.tom_de_voz || "",
        diferenciais: prev.diferenciais.length === 0 && Array.isArray(data.diferenciais) ? data.diferenciais : prev.diferenciais,
        bio_instagram: prev.bio_instagram || data.bio_instagram || "",
        instagram_handle: handle,
      }));
      setInstagramHandle(handle);
      toast.success(`Perfil importado com ${Math.round((data.confidence ?? 0) * 100)}% de confiança.`);
    } catch (err: unknown) {
      toast.error(`Erro: ${err instanceof Error ? err.message : "Falha na importação"}`);
    } finally {
      setImportLoading(false);
    }
  };

  /* ── Photo upload ────────────────────────────────────────────── */
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setFotoPreview(url);
      updateField("foto_url", url);
    };
    reader.readAsDataURL(file);
  };

  /* ── Final save ──────────────────────────────────────────────── */
  const handleFinalSave = async () => {
    if (!form.nome || form.especialidade === "Outra") {
      toast.error("Preencha nome e especialidade antes de finalizar.");
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const handle = instagramHandle.trim() || undefined;
      const fullProfile: DoctorProfile = {
        ...form,
        instagram_handle: handle,
        skill: buildUpdatedSkill(form, handle || ""),
      };
      const result = await persistProfile(fullProfile);
      if (result.remote) {
        toast.success("Perfil estratégico completo e sincronizado!", { icon: <Check className="h-4 w-4" />, duration: 4000 });
      } else {
        toast.warning("Salvo localmente. Faça login para sincronizar.", { icon: <CloudOff className="h-4 w-4" /> });
      }
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Add diferencial ─────────────────────────────────────────── */
  const addDiferencial = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || form.diferenciais.includes(trimmed)) return;
    updateField("diferenciais", [...form.diferenciais, trimmed]);
    setNewDiferencial("");
  };

  const removeDiferencial = (value: string) => {
    updateField("diferenciais", form.diferenciais.filter((d) => d !== value));
  };

  /* ── Suggestions for current specialty ───────────────────────── */
  const esp = form.especialidade;
  const currentPublicoSuggestions = publicoSuggestions[esp] || publicoSuggestions.default;
  const currentDifSuggestions = (diferenciaisSuggestions[esp] || diferenciaisSuggestions.default)
    .filter((s) => !form.diferenciais.includes(s));

  /* ── Completion scoring ──────────────────────────────────────── */
  const completionFields = [
    !!form.nome, form.especialidade !== "Outra", !!form.publico_alvo,
    form.diferenciais.length > 0, !!form.tom_de_voz,
    !!instagramHandle, !!fotoPreview,
  ];
  const completionPct = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  if (isProfileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  /* ── Step renderers ──────────────────────────────────────────── */

  const renderIdentity = () => (
    <div className="space-y-6">
      <StepHeader
        title="Identidade profissional"
        subtitle="Como você quer ser reconhecida no Instagram?"
      />

      {/* Instagram import */}
      <div className="bg-secondary/50 rounded-2xl p-5 space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Instagram className="h-4 w-4" /> Importar do Instagram
        </Label>
        <div className="flex gap-2">
          <Input
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="https://instagram.com/seuperfil"
            className="flex-1"
          />
          <Button variant="outline" onClick={handleInstagramImport} disabled={importLoading} className="gap-2 shrink-0">
            {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
            {importLoading ? "..." : "Importar"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Importamos nome, bio e especialidade automaticamente.</p>
      </div>

      {/* Photo + Name */}
      <div className="flex items-start gap-5">
        <div className="shrink-0">
          {fotoPreview ? (
            <div className="relative group">
              <img src={fotoPreview} alt="Foto" className="w-20 h-20 rounded-full object-cover border-2 border-accent/30" />
              <button onClick={() => { setFotoPreview(null); updateField("foto_url", undefined); }}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-accent/50 transition-colors">
                <Camera className="h-6 w-6 text-muted-foreground/40" />
              </div>
            </label>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-xs">Nome profissional *</Label>
            <Input id="nome" value={form.nome} onChange={(e) => updateField("nome", e.target.value)}
              placeholder="Dra. Marcella Achy" className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">CRM</Label>
              <Input value={form.crm} onChange={(e) => updateField("crm", e.target.value)} placeholder="123456" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Input value={form.estado} onChange={(e) => updateField("estado", e.target.value)} placeholder="SP" maxLength={2} />
            </div>
          </div>
        </div>
      </div>

      {/* Specialty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Especialidade *</Label>
          <Select value={form.especialidade} onValueChange={(v) => updateField("especialidade", v as Especialidade)}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {especialidades.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Subespecialidade</Label>
          <Input value={form.subespecialidade || ""} onChange={(e) => updateField("subespecialidade", e.target.value)}
            placeholder="Ex: Rejuvenescimento facial" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Cidade</Label>
        <Input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} placeholder="São Paulo" />
      </div>
    </div>
  );

  const renderAudience = () => (
    <div className="space-y-6">
      <StepHeader
        title="Público e posicionamento"
        subtitle="Para quem você cria conteúdo e como quer ser percebida?"
      />

      <div className="space-y-3">
        <Label className="text-xs">Público-alvo principal</Label>
        <Textarea value={form.publico_alvo} onChange={(e) => updateField("publico_alvo", e.target.value)}
          placeholder="Descreva quem você quer alcançar..." rows={3} />
        <div className="flex flex-wrap gap-2">
          {currentPublicoSuggestions.map((s) => (
            <button key={s} onClick={() => updateField("publico_alvo", s)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-border hover:border-accent/40 hover:bg-accent/5 text-muted-foreground transition-colors flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Tom de voz</Label>
        <div className="grid grid-cols-2 gap-3">
          {tomOptions.map((t) => (
            <button key={t.value}
              onClick={() => updateField("tom_de_voz", t.value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                form.tom_de_voz === t.value
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/30"
              }`}>
              <p className="text-sm font-medium text-foreground">{t.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Pilares de conteúdo / Diferenciais</Label>
        <div className="flex flex-wrap gap-2">
          {form.diferenciais.map((d) => (
            <Badge key={d} variant="secondary" className="text-xs gap-1 pr-1">
              {d}
              <button onClick={() => removeDiferencial(d)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newDiferencial} onChange={(e) => setNewDiferencial(e.target.value)}
            placeholder="Adicione um pilar..." className="flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDiferencial(newDiferencial); } }}
          />
          <Button size="sm" variant="outline" onClick={() => addDiferencial(newDiferencial)} disabled={!newDiferencial.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {currentDifSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {currentDifSuggestions.map((s) => (
              <button key={s} onClick={() => addDiferencial(s)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-border hover:border-accent/40 hover:bg-accent/5 text-muted-foreground transition-colors flex items-center gap-1">
                <Plus className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReferences = () => (
    <div className="space-y-6">
      <StepHeader
        title="Referências de conteúdo"
        subtitle="Perfis que você admira e gostaria de usar como referência."
      />

      <div className="space-y-3">
        <Label className="text-xs">Perfis de inspiração (Instagram handles)</Label>
        <Textarea
          value={(form.inspiration_handles || []).join(", ")}
          onChange={(e) => updateField("inspiration_handles", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="@perfil1, @perfil2, @perfil3"
          rows={2}
        />
        <p className="text-[11px] text-muted-foreground">Perfis médicos ou de saúde que você admira pelo conteúdo.</p>
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Referências de conteúdo</Label>
        <Textarea
          value={(form.referencias_conteudo || []).join(", ")}
          onChange={(e) => updateField("referencias_conteudo", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Ex: @draanabelamachado, @drfelipebarros"
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Bio do Instagram</Label>
        <Textarea value={form.bio_instagram || ""} onChange={(e) => updateField("bio_instagram", e.target.value)}
          placeholder="Sua bio atual do Instagram..." rows={3} />
      </div>
    </div>
  );

  const renderVisual = () => (
    <div className="space-y-6">
      <StepHeader
        title="Direção visual"
        subtitle="Defina as cores e o estilo visual dos seus carrosséis."
      />

      <div className="space-y-3">
        <Label className="text-xs font-medium">Estilo visual preferido</Label>
        <div className="grid gap-3">
          {visualStyles.map((vs) => (
            <button key={vs.value}
              onClick={() => updateEstiloVisual("preferredVisualStyle", vs.value)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                skill.estilo_visual.preferredVisualStyle === vs.value
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/30"
              }`}>
              <div className="flex gap-1 shrink-0">
                {vs.colors.map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg border border-border/50" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{vs.label}</p>
                <p className="text-[11px] text-muted-foreground">{vs.desc}</p>
              </div>
              {skill.estilo_visual.preferredVisualStyle === vs.value && (
                <Check className="h-5 w-5 text-accent ml-auto shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-medium">Cores da marca (personalizar)</Label>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "cor_fundo" as const, label: "Fundo" },
            { key: "cor_texto" as const, label: "Texto" },
            { key: "cor_destaque" as const, label: "Destaque" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-[11px] text-muted-foreground">{label}</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={skill.estilo_visual[key]}
                  onChange={(e) => updateEstiloVisual(key, e.target.value)}
                  className="w-10 h-10 p-1 cursor-pointer rounded-lg" />
                <span className="text-[10px] text-muted-foreground font-mono">{skill.estilo_visual[key]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Referências de design</Label>
        <Textarea
          value={(form.referencias_design || []).join(", ")}
          onChange={(e) => updateField("referencias_design", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Ex: perfis ou marcas com visual que você gosta"
          rows={2}
        />
      </div>
    </div>
  );

  const renderEditorial = () => (
    <div className="space-y-6">
      <StepHeader
        title="Direção editorial"
        subtitle="Detalhes que refinam a geração de conteúdo."
      />

      <div className="space-y-3">
        <Label className="text-xs">Posicionamento (frase-síntese)</Label>
        <Input value={skill.posicionamento} onChange={(e) => setSkill((prev) => ({ ...prev, posicionamento: e.target.value }))}
          placeholder="Ex: Referência em rejuvenescimento natural e ciência aplicada" />
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Público secundário</Label>
        <Input value={skill.publico_secundario} onChange={(e) => setSkill((prev) => ({ ...prev, publico_secundario: e.target.value }))}
          placeholder="Ex: Profissionais de saúde buscando referência" />
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Proibições editoriais</Label>
        <Textarea
          value={skill.proibicoes.join("\n")}
          onChange={(e) => setSkill((prev) => ({ ...prev, proibicoes: e.target.value.split("\n").filter(Boolean) }))}
          placeholder={"Nunca promete resultados\nNunca usa antes/depois\nRespeita CFM 2.336/2023"}
          rows={3}
        />
        <p className="text-[11px] text-muted-foreground">Uma proibição por linha. Ex: "Nunca promete resultados".</p>
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Objetivos estratégicos</Label>
        <Textarea
          value={form.objetivos.join(", ")}
          onChange={(e) => updateField("objetivos", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          placeholder="Ex: Aumentar autoridade, Atrair pacientes particulares, Educar"
          rows={2}
        />
      </div>
    </div>
  );

  const renderReview = () => {
    const items = [
      { label: "Nome", value: form.nome, filled: !!form.nome },
      { label: "Especialidade", value: form.especialidade, filled: form.especialidade !== "Outra" },
      { label: "CRM", value: form.crm || "—", filled: !!form.crm },
      { label: "Cidade/Estado", value: `${form.cidade || "—"} / ${form.estado || "—"}`, filled: !!(form.cidade || form.estado) },
      { label: "Instagram", value: instagramHandle ? `@${instagramHandle}` : "—", filled: !!instagramHandle },
      { label: "Público-alvo", value: form.publico_alvo || "—", filled: !!form.publico_alvo },
      { label: "Tom de voz", value: tomOptions.find((t) => t.value === form.tom_de_voz)?.label || form.tom_de_voz, filled: !!form.tom_de_voz },
      { label: "Pilares", value: form.diferenciais.length > 0 ? form.diferenciais.join(", ") : "—", filled: form.diferenciais.length > 0 },
      { label: "Estilo visual", value: visualStyles.find((v) => v.value === skill.estilo_visual.preferredVisualStyle)?.label || "—", filled: !!skill.estilo_visual.preferredVisualStyle },
      { label: "Foto", value: fotoPreview ? "✓ Adicionada" : "—", filled: !!fotoPreview },
    ];

    return (
      <div className="space-y-6">
        <StepHeader
          title="Revisão final"
          subtitle="Confira seu perfil estratégico antes de salvar."
        />

        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--accent))" strokeWidth="4"
                  strokeDasharray={`${completionPct * 1.508} 999`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">{completionPct}%</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Perfil {completionPct >= 80 ? "completo" : "em progresso"}</p>
              <p className="text-[11px] text-muted-foreground">
                {completionPct >= 80 ? "Ótimo! Seus carrosséis serão altamente personalizados." : "Complete mais campos para melhor personalização."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.label} className="flex items-start gap-2 text-sm">
                <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${item.filled ? "bg-accent/20" : "bg-muted"}`}>
                  {item.filled ? <Check className="h-2.5 w-2.5 text-accent" /> : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
                </div>
                <span className="text-muted-foreground w-28 shrink-0">{item.label}</span>
                <span className={`text-foreground ${!item.filled ? "text-muted-foreground/50" : ""}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleFinalSave} disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base" size="lg">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Salvando..." : "Salvar perfil estratégico"}
        </Button>
      </div>
    );
  };

  const stepRenderers: Record<StepKey, () => JSX.Element> = {
    identity: renderIdentity,
    audience: renderAudience,
    references: renderReferences,
    visual: renderVisual,
    editorial: renderEditorial,
    review: renderReview,
  };

  const currentStep = STEPS[step];

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = savedSteps.has(i) || i < step;
              return (
                <button key={s.key} onClick={() => setStep(i)}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    isActive ? "scale-110" : "opacity-60 hover:opacity-80"
                  }`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isActive ? "bg-accent text-accent-foreground" : isDone ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
                  }`}>
                    {isDone && !isActive ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] hidden md:block ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {stepRenderers[currentStep.key]()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep.key !== "review" && (
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="ghost" onClick={goPrev} disabled={step === 0} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Button>
            <div className="flex items-center gap-3">
              {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Button onClick={goNext} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                {step < STEPS.length - 2 ? "Próximo" : "Revisar"} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

/* ── Utility components ────────────────────────────────────────── */

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <h2 className="font-heading text-2xl font-semibold text-foreground">{title}</h2>
      <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
    </div>
  );
}

export default Setup;
