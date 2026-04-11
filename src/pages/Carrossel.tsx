import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  TravessIARoteiro,
  travessiaToSlideData,
  validarRoteiro,
  avaliarQualidadeRoteiro,
  type PreferredVisualStyle,
} from "@/types/carousel";
import { mapToObjetivoEnum, type ObjetivoEnum } from "@/types/inspiration";
import CarouselVisualPreview from "@/components/carousel/CarouselVisualPreview";
import type { SlideData } from "@/components/carousel/SlideRenderer";
import { getPreset, BENCHMARK_PRESETS, type BenchmarkPresetId } from "@/lib/benchmark-presets";
import { calculatePerformanceScore, type PerformanceScore } from "@/lib/performance-score";
import PerformanceScoreCard from "@/components/carousel/PerformanceScoreCard";
import PromptLab, { type VariationAxis, type LabVariation } from "@/components/carousel/PromptLab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Layers,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Zap,
  TrendingUp,
  Settings,
  FlaskConical,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

interface TopicSuggestion {
  titulo: string;
  tese: string;
  objetivo: string;
  formato: string;
  por_que: string;
  urgencia: string;
}

const objetivoOptions: { value: ObjetivoEnum; label: string }[] = [
  { value: "educar", label: "Educar" },
  { value: "salvar", label: "Gerar salvamentos" },
  { value: "comentar", label: "Provocar comentários" },
  { value: "conversao", label: "Conversão" },
];

const formatoOptions = [
  { value: "educativo", label: "Educativo" },
  { value: "manifesto", label: "Manifesto" },
  { value: "lista", label: "Lista" },
  { value: "protocolo", label: "Protocolo em etapas" },
  { value: "mitos_verdades", label: "Mito vs Verdade" },
];

const urgenciaCor: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  baixa: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

/* ── Component ─────────────────────────────────────────── */

const Carrossel = () => {
  const { profile, isConfigured } = useDoctor();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Suggestions
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  // Brief form
  const [tema, setTema] = useState("");
  const [tese, setTese] = useState("");
  const [objetivo, setObjetivo] = useState<ObjetivoEnum>("educar");
  const [objetivoDetalhado, setObjetivoDetalhado] = useState("");
  const [formato, setFormato] = useState("educativo");

  // Roteiro
  const [roteiro, setRoteiro] = useState<TravessIARoteiro | null>(null);
  const [slideDataList, setSlideDataList] = useState<SlideData[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [visualStyle, setVisualStyle] = useState<PreferredVisualStyle>("editorial_black_gold");
  const [activePreset, setActivePreset] = useState<BenchmarkPresetId>("autoridade_premium");
  const [loading, setLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [labMode, setLabMode] = useState(false);

  // Rewrite
  const [feedback, setFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Save
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [savedContentOutputId, setSavedContentOutputId] = useState<string | null>(null);

  // Campaign link from URL
  const campaignId = new URLSearchParams(location.search).get("campaign") || null;

  // Pre-fill from navigation state — map free text to enum
  useEffect(() => {
    const state = location.state as Record<string, string> | null;
    if (!state) return;

    // Cluster context
    if (state.clusterName) {
      setTese(state.clusterName);
    }
    if (state.preset && state.preset in BENCHMARK_PRESETS) {
      setActivePreset(state.preset as BenchmarkPresetId);
    }

    if (state.tese) {
      setTese(state.tese);
    }

    if (state.tema) setTema(state.tema);

    if (state.objetivoEnum && objetivoOptions.some((o) => o.value === state.objetivoEnum)) {
      setObjetivo(state.objetivoEnum as ObjetivoEnum);
    } else if (state.objetivo) {
      setObjetivo(mapToObjetivoEnum(state.objetivo));
    }

    if (state.objetivoDetalhado) {
      setObjetivoDetalhado(state.objetivoDetalhado);
    } else if (state.objetivo) {
      setObjetivoDetalhado(state.objetivo);
    }

    // Apply preset and visual style from calendar
    if (state.preset && state.preset in BENCHMARK_PRESETS) {
      setActivePreset(state.preset as BenchmarkPresetId);
      const preset = getPreset(state.preset as BenchmarkPresetId);
      setVisualStyle(preset.preferredVisualStyle);
    }
  }, [location.state]);

  // Auto-load suggestions
  useEffect(() => {
    if (isConfigured && profile && !suggestionsLoaded && !location.state?.tese) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, profile]);

  const loadSuggestions = async () => {
    if (!profile || suggestionsLoading) return;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "suggest-carousel-topics",
        {
          body: {
            especialidade: profile.especialidade,
            subespecialidade: profile.subespecialidade ?? "",
            publico_alvo: profile.publico_alvo ?? "",
            tom_de_voz: profile.tom_de_voz ?? "",
            pilares: profile.diferenciais ?? [],
          },
        }
      );
      if (error) throw error;
      const result = data as { sugestoes?: TopicSuggestion[] };
      if (result.sugestoes?.length) setSuggestions(result.sugestoes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar sugestões.";
      setSuggestionsError(msg);
    } finally {
      setSuggestionsLoading(false);
      setSuggestionsLoaded(true);
    }
  };

  const handleSelectSuggestion = (s: TopicSuggestion) => {
    setTema(s.titulo);
    setTese(s.tese);
    setObjetivo(mapToObjetivoEnum(s.objetivo));
    setObjetivoDetalhado(s.objetivo);
    setFormato(s.formato || "educativo");
    toast.success(`Tema selecionado: ${s.titulo}`);
  };

  const handleGenerateFromSuggestion = async (s: TopicSuggestion) => {
    handleSelectSuggestion(s);
    await generateCarousel(s.tese, mapToObjetivoEnum(s.objetivo));
  };

  const applyRoteiro = (parsed: TravessIARoteiro) => {
    setRoteiro(parsed);
    const slides = parsed.slides.map((s) => travessiaToSlideData(s, parsed.slides.length));
    setSlideDataList(slides);
    const avisos = validarRoteiro(parsed);
    setWarnings(avisos);
    setVisualStyle(parsed.preferredVisualStyle || profile?.skill?.estilo_visual?.preferredVisualStyle || "editorial_black_gold");
    setGenerateError(null);
    if (avisos.length > 0) {
      toast.warning(`Roteiro gerado com ${avisos.length} aviso(s).`);
    } else {
      toast.success("Roteiro gerado com sucesso!");
    }
  };

  // Preserve current roteiro until new one succeeds
  const generateCarousel = async (teseOverride?: string, objetivoOverride?: ObjetivoEnum) => {
    if (!profile) return;
    const useTese = teseOverride || tese;
    if (!useTese.trim()) {
      toast.error("Informe a tese central do carrossel.");
      return;
    }
    setLoading(true);
    setGenerateError(null);
    setSavedContentOutputId(null);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: {
          profile: {
            ...profile,
            pilares: profile.diferenciais,
          },
          tese: useTese,
          objetivo: objetivoOverride || objetivo,
          objetivoDetalhado,
          formato,
          action: "generate",
          skill: profile?.skill,
          topic: tema || useTese,
          especialidade: profile.especialidade,
          subespecialidade: profile.subespecialidade,
          publico_alvo: profile.publico_alvo,
          tom_de_voz: profile.tom_de_voz,
          pilares: profile.diferenciais,
          medica_nome: profile.nome,
          medica_handle: profile.instagram_handle || profile.skill?.handle,
          brand_colors: profile.skill?.estilo_visual ? {
            bg: profile.skill.estilo_visual.cor_fundo,
            text: profile.skill.estilo_visual.cor_texto,
            accent: profile.skill.estilo_visual.cor_destaque,
          } : undefined,
          doctor_image_url: profile.foto_url,
        },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar carrossel.";
      setGenerateError(msg);
      toast.error(msg);
      // Previous roteiro is preserved
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => generateCarousel();

  // Send full roteiro context for rewrite
  const handleRewrite = async () => {
    if (!roteiro || !feedback.trim()) {
      toast.error("Escreva o que deseja mudar.");
      return;
    }
    setRewriteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: {
          action: "rewrite",
          roteiro: {
            titulo_carrossel: roteiro.titulo_carrossel,
            tese: roteiro.tese,
            jornada: roteiro.jornada,
            slides: roteiro.slides,
            legenda: roteiro.legenda,
            hashtags: roteiro.hashtags,
            cta_final: roteiro.cta_final,
          },
          feedback,
          profile: profile ? { ...profile, pilares: profile.diferenciais } : undefined,
          skill: profile?.skill,
        },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
      setFeedback("");
      toast.success("Roteiro reescrito!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao reescrever.";
      toast.error(msg);
      // Previous roteiro is preserved
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleSaveCarousel = async () => {
    if (!roteiro || !user) return;
    setSavingCarousel(true);
    try {
      const insertPayload: any = {
        user_id: user.id,
        content_type: "carrossel",
        title: roteiro.titulo_carrossel || tema || "Carrossel sem título",
        strategic_input: { tese, objetivo, objetivoDetalhado, formato, tema, preset: activePreset },
        generated_content: {
          roteiro,
          slideDataList,
          visualStyle,
          legenda: roteiro.legenda,
          hashtags: roteiro.hashtags,
          cta_final: roteiro.cta_final,
        },
      };
      if (campaignId) insertPayload.campaign_id = campaignId;
      const { data, error } = await supabase.from("content_outputs").insert(insertPayload).select("id").single();
      if (error) throw error;
      setSavedContentOutputId(data.id);
      toast.success("Carrossel salvo na biblioteca!");
    } catch {
      toast.error("Erro ao salvar carrossel.");
    } finally {
      setSavingCarousel(false);
    }
  };

  /* ── Prompt Lab handlers ───────────────────────── */

  const handleLabGenerate = async (axes: VariationAxis[]): Promise<TravessIARoteiro[]> => {
    if (!profile || !tese.trim()) {
      toast.error("Preencha a tese antes de gerar variações.");
      return [];
    }
    const results: TravessIARoteiro[] = [];
    for (const axis of axes) {
      const preset = getPreset(axis.presetId);
      try {
        const { data, error } = await supabase.functions.invoke("agent-carrossel", {
          body: {
            profile: { ...profile, pilares: profile.diferenciais },
            tese,
            objetivo,
            objetivoDetalhado,
            formato,
            action: "generate",
            skill: profile?.skill,
            topic: tema || tese,
            especialidade: profile.especialidade,
            subespecialidade: profile.subespecialidade,
            publico_alvo: profile.publico_alvo,
            tom_de_voz: profile.tom_de_voz,
            pilares: profile.diferenciais,
            medica_nome: profile.nome,
            medica_handle: profile.instagram_handle || profile.skill?.handle,
            labAxis: {
              presetId: axis.presetId,
              hookIntensity: axis.hookIntensity,
              didatismo: axis.didatismo,
              sofisticacao: axis.sofisticacao,
              editorialTone: preset.behavior.editorialTone,
              hookStyle: preset.behavior.hookStyle,
              ctaStyle: preset.behavior.ctaStyle,
              narrativeRhythm: preset.behavior.narrativeRhythm,
              textDensity: preset.behavior.textDensity,
            },
          },
        });
        if (error) throw error;
        results.push(data as TravessIARoteiro);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro na variação.";
        toast.error(`Variação ${preset.label}: ${msg}`);
      }
    }
    if (results.length === 0) {
      toast.error("Nenhuma variação foi gerada.");
    }
    return results;
  };

  const handleSelectLabVariation = (variation: LabVariation) => {
    applyRoteiro(variation.roteiro);
    setActivePreset(variation.axis.presetId);
    const preset = getPreset(variation.axis.presetId);
    setVisualStyle(preset.preferredVisualStyle);
    setLabMode(false);
    toast.success(`Versão "${preset.label}" aplicada ao carrossel.`);
  };

  const handleReset = () => {
    setRoteiro(null);
    setSavedContentOutputId(null);
    setSlideDataList([]);
    setWarnings([]);
    setTema("");
    setTese("");
    setFeedback("");
    setObjetivoDetalhado("");
    setGenerateError(null);
    setLabMode(false);
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <AppLayout>
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="font-heading text-title tracking-tight text-foreground flex items-center gap-2.5">
              <Layers className="h-5 w-5 text-accent" />
              Estúdio de Carrossel
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Crie carrosséis estratégicos com direção editorial e visual integradas
            </p>
          </div>
          {roteiro && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Novo
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCarousel}
                disabled={savingCarousel}
                className="h-8 text-xs gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {savingCarousel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar
              </Button>
            </div>
          )}
        </div>

        {!user ? (
          <div className="surface-card p-6 max-w-lg flex items-center gap-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm">Faça login para criar carrosséis.</p>
          </div>
        ) : !isConfigured ? (
          <div className="surface-card p-6 max-w-lg flex items-center gap-4">
            <AlertTriangle className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Perfil não configurado</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Configure seu perfil antes de gerar carrosséis.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/setup")} className="gap-1.5 text-xs h-8">
              <Settings className="h-3.5 w-3.5" /> Configurar
            </Button>
          </div>
        ) : (
          <div className={`grid gap-8 ${roteiro ? "lg:grid-cols-5" : "lg:grid-cols-1 max-w-3xl"}`}>
            {/* ═══ LEFT: Briefing panel ═══ */}
            <div className={`space-y-6 ${roteiro ? "lg:col-span-2" : ""}`}>
              {/* Suggestions */}
              {!roteiro && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-label uppercase tracking-wider text-muted-foreground/60">
                      Sugestões estratégicas
                    </h3>
                    {suggestionsLoaded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadSuggestions}
                        disabled={suggestionsLoading}
                        className="text-xs h-7 text-muted-foreground"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Atualizar
                      </Button>
                    )}
                  </div>

                  {suggestionsLoading && suggestions.length === 0 && (
                    <div className="surface-card p-8 flex flex-col items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                      <p className="text-[13px] text-muted-foreground">
                        Buscando tendências para {profile?.especialidade}…
                      </p>
                    </div>
                  )}

                  {suggestionsError && !suggestionsLoading && suggestions.length === 0 && (
                    <div className="surface-card p-4 border-border flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-[13px] text-muted-foreground flex-1">
                        Não foi possível carregar sugestões.
                      </p>
                      <Button variant="ghost" size="sm" onClick={loadSuggestions} className="shrink-0 text-xs h-7">
                        Tentar novamente
                      </Button>
                    </div>
                  )}

                  {suggestions.length > 0 && (
                    <div className="grid gap-2.5 md:grid-cols-2">
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          className="surface-card p-4 hover:shadow-premium-md hover:border-accent/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="text-[13px] font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                              {s.titulo}
                            </h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium shrink-0 ${
                              urgenciaCor[s.urgencia] || "bg-secondary text-muted-foreground"
                            }`}>
                              {s.urgencia}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {s.tese}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                              onClick={(e) => { e.stopPropagation(); handleGenerateFromSuggestion(s); }}
                              disabled={loading}
                            >
                              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Zap className="h-3 w-3 mr-1" />Gerar</>}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleSelectSuggestion(s); }}>
                              Editar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Brief form — styled as strategic direction */}
              <div className="surface-card p-5 space-y-5">
                <h3 className="text-label uppercase tracking-wider text-muted-foreground/60">
                  Direção do conteúdo
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="tema" className="text-xs text-muted-foreground">Tema</Label>
                  <Textarea
                    id="tema"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    placeholder="Ex: Bioestimuladores de colágeno para rejuvenescimento"
                    rows={2}
                    className="text-[13px] resize-none bg-background border-border/60 focus:border-accent/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tese" className="text-xs text-muted-foreground">Tese central</Label>
                  <Textarea
                    id="tese"
                    value={tese}
                    onChange={(e) => setTese(e.target.value)}
                    placeholder="O que você defende — a opinião que guia o conteúdo"
                    rows={3}
                    className="text-[13px] resize-none bg-background border-border/60 focus:border-accent/40"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Objetivo</Label>
                    <Select value={objetivo} onValueChange={(v) => setObjetivo(v as ObjetivoEnum)}>
                      <SelectTrigger className="h-9 text-[13px] bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {objetivoOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Formato</Label>
                    <Select value={formato} onValueChange={setFormato}>
                      <SelectTrigger className="h-9 text-[13px] bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {formatoOptions.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {objetivoDetalhado && (
                  <div className="text-xs text-muted-foreground surface-inset p-2.5 rounded-md">
                    <span className="font-medium">Contexto:</span> {objetivoDetalhado}
                  </div>
                )}

                {generateError && (
                  <div className="text-[13px] text-destructive bg-destructive/5 border border-destructive/10 rounded-md p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{generateError}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !tese.trim()}
                    className="flex-1 h-9 bg-accent text-accent-foreground hover:bg-accent/90 text-[13px]"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando…</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" />Gerar Carrossel</>
                    )}
                  </Button>
                  <Button
                    variant={labMode ? "default" : "outline"}
                    size="icon"
                    onClick={() => setLabMode(!labMode)}
                    title="Prompt Lab"
                    className={`h-9 w-9 ${labMode ? "bg-accent text-accent-foreground" : ""}`}
                  >
                    <FlaskConical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Prompt Lab */}
              {labMode && tese.trim() && (
                <div className="surface-card p-5">
                  <PromptLab
                    onGenerate={handleLabGenerate}
                    onSelectVariation={handleSelectLabVariation}
                    loading={loading}
                    brandName={profile?.nome}
                    brandHandle={profile?.instagram_handle || profile?.bio_instagram}
                    doctorImageUrl={profile?.foto_url}
                  />
                </div>
              )}

              {/* Rewrite */}
              {roteiro && (
                <div className="surface-card p-5 space-y-3">
                  <h3 className="text-label uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" /> Refinar roteiro
                  </h3>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="O que quer mudar? Ex: Tom mais direto, menos slides…"
                    rows={2}
                    className="text-[13px] resize-none bg-background border-border/60"
                  />
                  <Button
                    onClick={handleRewrite}
                    disabled={rewriteLoading || !feedback.trim()}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    {rewriteLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Reescrever
                  </Button>
                </div>
              )}

              {/* Performance Score */}
              {roteiro && (() => {
                const perfScore = calculatePerformanceScore(roteiro, activePreset);
                return (
                  <PerformanceScoreCard
                    score={perfScore}
                    onPresetSuggestion={(presetId) => {
                      setActivePreset(presetId);
                      const preset = getPreset(presetId);
                      setVisualStyle(preset.preferredVisualStyle);
                    }}
                  />
                );
              })()}

              {/* Warnings */}
              {roteiro && warnings.length > 0 && (
                <div className="surface-card p-4 border-border">
                  <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {warnings.length} aviso(s)
                  </p>
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground/70 ml-5.5">{w}</p>
                  ))}
                </div>
              )}

              {/* Legenda */}
              {roteiro?.legenda && (
                <div className="surface-card p-5 space-y-3">
                  <h3 className="text-label uppercase tracking-wider text-muted-foreground/60">
                    Legenda e Hashtags
                  </h3>
                  <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{roteiro.legenda}</p>
                  {roteiro.hashtags && (
                    <div className="flex flex-wrap gap-1.5">
                      {roteiro.hashtags.map((h) => (
                        <span key={h} className="text-[11px] text-accent/70 bg-accent/5 px-2 py-0.5 rounded-sm">
                          {h.startsWith("#") ? h : `#${h}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ═══ RIGHT: Visual preview ═══ */}
            {roteiro && slideDataList.length > 0 && (
              <div className="lg:col-span-3">
                <CarouselVisualPreview
                  slides={slideDataList}
                  brandName={profile?.nome}
                  brandHandle={profile?.instagram_handle || profile?.bio_instagram}
                  doctorImageUrl={profile?.foto_url}
                  visualStyle={visualStyle}
                  contentOutputId={savedContentOutputId}
                  activePresetId={activePreset}
                  onPresetChange={(id) => {
                    setActivePreset(id);
                    const preset = getPreset(id);
                    setVisualStyle(preset.preferredVisualStyle);
                  }}
                  onSlidesChange={setSlideDataList}
                  onRegenerate={handleGenerate}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Carrossel;
