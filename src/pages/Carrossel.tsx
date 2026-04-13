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
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Zap,
  Settings,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Target,
  Type,
  Crosshair,
  MessageSquare,
  Hash,
  Copy,
  Check,
  TrendingUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // UI state
  const [briefCollapsed, setBriefCollapsed] = useState(false);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);

  // Navigation source tracking
  const [navigationSource, setNavigationSource] = useState<string | null>(null);
  const [sourceContext, setSourceContext] = useState<Record<string, any> | null>(null);
  const [recommendationContext, setRecommendationContext] = useState<{
    why_now?: string;
    strategic_opportunity?: string;
    risk_repetition?: string;
    cluster?: string;
    campaign?: string;
    persona?: string;
    hook_angle?: string;
    cta_direction?: string;
    narrative_rhythm?: string;
    confidence?: string;
    recommendation_reasoning?: string;
  } | null>(null);
  const [showRecommendationBlock, setShowRecommendationBlock] = useState(false);

  // Pre-fill from navigation state
  useEffect(() => {
    const state = location.state as Record<string, any> | null;
    if (!state) return;

    if (state.clusterName) setTese(state.clusterName);
    if (state.tese) setTese(state.tese);
    if (state.tema) setTema(state.tema);

    // Objetivo handling with converter→conversao normalization
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

    // Preset
    if (state.preset && state.preset in BENCHMARK_PRESETS) {
      setActivePreset(state.preset as BenchmarkPresetId);
      const preset = getPreset(state.preset as BenchmarkPresetId);
      setVisualStyle(preset.preferredVisualStyle);
    }

    // Visual style override
    if (state.visualStyle) {
      const validStyles: PreferredVisualStyle[] = ["travessia", "editorial_black_gold", "ivory_sage"];
      if (validStyles.includes(state.visualStyle as PreferredVisualStyle)) {
        setVisualStyle(state.visualStyle as PreferredVisualStyle);
      }
    }

    // Source tracking + recommendation context
    if (state.source === "o_que_postar") {
      setNavigationSource("o_que_postar");
      const ctx = {
        cluster: state.cluster || null,
        campaign: state.campaign || null,
        persona: state.persona || null,
      };
      setSourceContext(ctx);
      setRecommendationContext({
        why_now: state.why_now || undefined,
        strategic_opportunity: state.strategic_opportunity || undefined,
        risk_repetition: state.risk_repetition || undefined,
        cluster: state.cluster || undefined,
        campaign: state.campaign || undefined,
        persona: state.persona || undefined,
        hook_angle: state.hook_angle || undefined,
        cta_direction: state.cta_direction || undefined,
        narrative_rhythm: state.narrative_rhythm || undefined,
        confidence: state.confidence || undefined,
        recommendation_reasoning: state.recommendation_reasoning || undefined,
      });
      setShowRecommendationBlock(true);

      // If a ready roteiro was passed (quick generate from OQuePostar)
      if (state.readyRoteiro) {
        try {
          applyRoteiro(state.readyRoteiro as TravessIARoteiro);
          toast.success("Carrossel gerado via recomendação!");
        } catch {
          // Fallback: user can generate manually with pre-filled briefing
          toast.info("Briefing preenchido. Clique em Gerar para criar o carrossel.");
        }
      }
    } else if (state.source) {
      setNavigationSource(state.source);
      setSourceContext({
        cluster: state.cluster || null,
        campaign: state.campaign || null,
        persona: state.persona || null,
      });
    }
  }, [location.state]);

  // Auto-load suggestions
  useEffect(() => {
    if (isConfigured && profile && !suggestionsLoaded && !location.state?.tese) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, profile]);

  // Auto-collapse brief when roteiro is generated
  useEffect(() => {
    if (roteiro) setBriefCollapsed(true);
  }, [roteiro]);

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
          profile: { ...profile, pilares: profile.diferenciais },
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
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => generateCarousel();

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
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleSaveCarousel = async () => {
    if (!roteiro || !user) return;
    setSavingCarousel(true);
    try {
      const { data, error } = await supabase.from("content_outputs").insert({
        user_id: user.id,
        content_type: "carrossel",
        title: roteiro.titulo_carrossel || tema || "Carrossel sem título",
        strategic_input: {
          tese,
          objetivo,
          objetivoDetalhado,
          formato,
          tema,
          benchmark_preset: activePreset,
          visual_style: visualStyle,
          ...(navigationSource === "o_que_postar" && sourceContext ? {
            source: "o_que_postar",
            cluster: sourceContext.cluster,
            campaign: sourceContext.campaign,
            persona: sourceContext.persona,
          } : {}),
          ...(recommendationContext ? {
            why_now: recommendationContext.why_now,
            strategic_opportunity: recommendationContext.strategic_opportunity,
            risk_repetition: recommendationContext.risk_repetition,
            hook_angle: recommendationContext.hook_angle,
            cta_direction: recommendationContext.cta_direction,
            narrative_rhythm: recommendationContext.narrative_rhythm,
            confidence: recommendationContext.confidence,
            recommendation_reasoning: recommendationContext.recommendation_reasoning,
          } : {}),
        } as any,
        generated_content: {
          roteiro,
          slideDataList,
          visualStyle,
          legenda: roteiro.legenda,
          hashtags: roteiro.hashtags,
          cta_final: roteiro.cta_final,
        } as any,
      }).select("id").single();
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
    setBriefCollapsed(false);
    setNavigationSource(null);
    setSourceContext(null);
    setRecommendationContext(null);
    setShowRecommendationBlock(false);
  };

  const hasRoteiro = roteiro && slideDataList.length > 0;

  /* ── Render ──────────────────────────────────────────── */

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        {/* ═══ Studio Top Bar ═══ */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-border/40 flex items-center justify-between bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 rounded-full bg-accent" />
            <h1 className="font-heading text-[15px] font-semibold text-foreground tracking-tight">
              Estúdio de Carrossel
            </h1>
            {hasRoteiro && roteiro.titulo_carrossel && (
              <>
                <span className="text-muted-foreground/30">/</span>
                <span className="text-[13px] text-muted-foreground truncate max-w-[300px]">
                  {roteiro.titulo_carrossel}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasRoteiro && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 text-[11px] gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Novo
                </Button>
                <div className="w-px h-4 bg-border/60" />
                <Button
                  size="sm"
                  onClick={handleSaveCarousel}
                  disabled={savingCarousel}
                  className="h-7 text-[11px] gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {savingCarousel ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Salvar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ═══ Main Content ═══ */}
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="surface-card p-6 max-w-lg flex items-center gap-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm">Faça login para criar carrosséis.</p>
            </div>
          </div>
        ) : !isConfigured ? (
          <div className="flex-1 flex items-center justify-center p-8">
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
          </div>
        ) : (
          <div className={`flex-1 min-h-0 ${hasRoteiro ? "flex" : "flex items-start justify-center"}`}>
            {/* ═══ Studio Mode: Side Panel + Preview ═══ */}
            {hasRoteiro ? (
              <>
                {/* LEFT: Creative Direction Panel */}
                <div className="w-[360px] flex-shrink-0 border-r border-border/30 overflow-y-auto">
                  <div className="py-2">

                    {/* ── Section: Creative Brief ── */}
                    <div className="px-5 py-3">
                      <button
                        onClick={() => setBriefCollapsed(!briefCollapsed)}
                        className="w-full flex items-center justify-between group mb-1"
                      >
                        <div className="flex items-center gap-2">
                          <Crosshair className="h-3 w-3 text-accent/60" />
                          <span className="text-[11px] font-semibold text-foreground/80 tracking-wide">
                            Creative Brief
                          </span>
                        </div>
                        <ChevronDown className={`h-3 w-3 text-muted-foreground/30 transition-transform ${!briefCollapsed ? "rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {!briefCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-4">
                              {/* Tema */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <Type className="h-2.5 w-2.5 text-muted-foreground/40" />
                                  <Label htmlFor="tema" className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50 font-medium">Tema</Label>
                                </div>
                                <Textarea
                                  id="tema"
                                  value={tema}
                                  onChange={(e) => setTema(e.target.value)}
                                  placeholder="Assunto central do carrossel"
                                  rows={1}
                                  className="text-[13px] resize-none border-0 border-b border-border/30 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/30 min-h-0"
                                />
                              </div>

                              {/* Tese */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <Target className="h-2.5 w-2.5 text-muted-foreground/40" />
                                  <Label htmlFor="tese" className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50 font-medium">Tese editorial</Label>
                                </div>
                                <Textarea
                                  id="tese"
                                  value={tese}
                                  onChange={(e) => setTese(e.target.value)}
                                  placeholder="A opinião que guia o conteúdo"
                                  rows={2}
                                  className="text-[13px] resize-none border-0 border-b border-border/30 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-accent/50 placeholder:text-muted-foreground/30"
                                />
                              </div>

                              {/* Objetivo + Formato — inline */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50 font-medium">Objetivo</span>
                                  <Select value={objetivo} onValueChange={(v) => setObjetivo(v as ObjetivoEnum)}>
                                    <SelectTrigger className="h-8 text-[12px] bg-transparent border-border/30 rounded-md"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {objetivoOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground/50 font-medium">Formato</span>
                                  <Select value={formato} onValueChange={setFormato}>
                                    <SelectTrigger className="h-8 text-[12px] bg-transparent border-border/30 rounded-md"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {formatoOptions.map((f) => (
                                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {objetivoDetalhado && (
                                <p className="text-[11px] text-muted-foreground/40 italic pl-0.5">
                                  {objetivoDetalhado}
                                </p>
                              )}

                              {/* Regenerate CTA */}
                              <Button
                                onClick={handleGenerate}
                                disabled={loading || !tese.trim()}
                                className="w-full h-9 bg-accent text-accent-foreground hover:bg-accent/90 text-[12px] rounded-lg shadow-sm"
                              >
                                {loading ? (
                                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Gerando…</>
                                ) : (
                                  <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Gerar novamente</>
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Collapsed brief summary */}
                      {briefCollapsed && tese && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <p className="text-[12px] text-muted-foreground/50 line-clamp-1 flex-1 italic">{tese}</p>
                          <Button
                            onClick={() => setBriefCollapsed(false)}
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-muted-foreground/40 hover:text-foreground shrink-0 px-2"
                          >
                            Editar
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

                    {/* ── Section: Direção Criativa (Preset) ── */}
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-3.5 rounded-full bg-accent/40" />
                        <span className="text-[11px] font-semibold text-foreground/80 tracking-wide">
                          Direção criativa
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.values(BENCHMARK_PRESETS) as import("@/lib/benchmark-presets").BenchmarkPreset[]).map((preset) => {
                          const isActive = activePreset === preset.id;
                          return (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setActivePreset(preset.id);
                                const p = getPreset(preset.id);
                                setVisualStyle(p.preferredVisualStyle);
                              }}
                              className={`relative text-left px-3 py-2.5 rounded-lg transition-all ${
                                isActive
                                  ? "bg-accent/8 border border-accent/25 shadow-sm"
                                  : "hover:bg-muted/40 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm">{preset.icon}</span>
                                <span className={`text-[11px] font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                  {preset.label}
                                </span>
                              </div>
                              <p className={`text-[10px] leading-snug ${isActive ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                                {preset.tagline}
                              </p>
                              {isActive && (
                                <div className="absolute top-2 right-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

                    {/* ── Section: Refinar ── */}
                    <div className="px-5 py-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[11px] font-semibold text-foreground/80 tracking-wide">
                          Refinar direção
                        </span>
                      </div>
                      <div className="relative">
                        <Textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Descreva o que quer ajustar — tom, estrutura, profundidade, CTA…"
                          rows={2}
                          className="text-[12px] resize-none border-border/30 rounded-lg bg-muted/20 focus-visible:bg-transparent placeholder:text-muted-foreground/30 pr-20"
                        />
                        <Button
                          onClick={handleRewrite}
                          disabled={rewriteLoading || !feedback.trim()}
                          size="sm"
                          className="absolute bottom-2 right-2 h-6 text-[10px] px-2.5 bg-accent/80 text-accent-foreground hover:bg-accent rounded-md"
                        >
                          {rewriteLoading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5 mr-1" />}
                          {rewriteLoading ? "" : "Aplicar"}
                        </Button>
                      </div>
                    </div>

                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

                    {/* ── Section: Prompt Lab ── */}
                    <div className="px-5 py-3">
                      <button
                        onClick={() => setLabMode(!labMode)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all ${
                          labMode
                            ? "bg-accent/8 text-accent border border-accent/20"
                            : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 border border-transparent"
                        }`}
                      >
                        <FlaskConical className="h-3.5 w-3.5" />
                        <span>Prompt Lab</span>
                        <span className="text-[9px] ml-auto opacity-40">
                          Variações A/B
                        </span>
                      </button>

                      <AnimatePresence>
                        {labMode && tese.trim() && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-3">
                              <PromptLab
                                onGenerate={handleLabGenerate}
                                onSelectVariation={handleSelectLabVariation}
                                loading={loading}
                                brandName={profile?.nome}
                                brandHandle={profile?.instagram_handle || profile?.bio_instagram}
                                doctorImageUrl={profile?.foto_url}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

                    {/* ── Section: Performance ── */}
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-3.5 rounded-full bg-accent/30" />
                        <span className="text-[11px] font-semibold text-foreground/80 tracking-wide">
                          Performance
                        </span>
                      </div>
                      {(() => {
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
                    </div>

                    {/* ── Warnings (conditional) ── */}
                    {warnings.length > 0 && (
                      <div className="px-5 pb-3">
                        <div className="rounded-lg bg-amber-500/[0.04] border border-amber-500/10 px-3 py-2.5">
                          <p className="text-[10px] font-semibold text-amber-600/80 flex items-center gap-1.5 mb-1 uppercase tracking-wider">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {warnings.length} aviso{warnings.length > 1 ? "s" : ""}
                          </p>
                          {warnings.map((w, i) => (
                            <p key={i} className="text-[11px] text-muted-foreground/50 ml-4 leading-relaxed">{w}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {generateError && (
                      <div className="px-5 pb-3">
                        <div className="rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2.5 flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-destructive/60 shrink-0" />
                          <span className="text-[11px] text-destructive/80">{generateError}</span>
                        </div>
                      </div>
                    )}

                    <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

                    {/* ── Section: Legenda & Hashtags ── */}
                    {roteiro?.legenda && (
                      <div className="px-5 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Hash className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-[11px] font-semibold text-foreground/80 tracking-wide">
                              Legenda & Hashtags
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const text = `${roteiro.legenda}\n\n${(roteiro.hashtags || []).map(h => h.startsWith("#") ? h : `#${h}`).join(" ")}`;
                              navigator.clipboard.writeText(text);
                              toast.success("Legenda copiada!");
                            }}
                            className="text-[10px] text-muted-foreground/40 hover:text-foreground flex items-center gap-1 transition-colors"
                          >
                            <Copy className="h-2.5 w-2.5" />
                            Copiar
                          </button>
                        </div>
                        <p className="text-[12px] text-muted-foreground/70 leading-[1.6] whitespace-pre-wrap">
                          {roteiro.legenda}
                        </p>
                        {roteiro.hashtags && roteiro.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {roteiro.hashtags.map((h) => (
                              <span key={h} className="text-[10px] text-accent/50 bg-accent/[0.04] px-1.5 py-0.5 rounded">
                                {h.startsWith("#") ? h : `#${h}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom padding */}
                    <div className="h-6" />
                  </div>
                </div>

                {/* RIGHT: Preview — protagonist */}
                <div className="flex-1 min-w-0 overflow-y-auto bg-muted/20">
                  <div className="p-6">
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
                </div>
              </>
            ) : (
              /* ═══ Initial State: Briefing Only ═══ */
              <div className="w-full max-w-2xl px-6 py-10 space-y-8">
                {/* Suggestions */}
                {!roteiro && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
                        className="flex items-center gap-2 group"
                      >
                        <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-semibold">
                          Sugestões estratégicas
                        </span>
                        {suggestionsExpanded ? (
                          <ChevronUp className="h-3 w-3 text-muted-foreground/30" />
                        ) : (
                          <ChevronDown className="h-3 w-3 text-muted-foreground/30" />
                        )}
                      </button>
                      {suggestionsLoaded && suggestionsExpanded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={loadSuggestions}
                          disabled={suggestionsLoading}
                          className="text-[11px] h-6 text-muted-foreground/50"
                        >
                          <RefreshCw className="h-2.5 w-2.5 mr-1" />
                          Atualizar
                        </Button>
                      )}
                    </div>

                    <AnimatePresence>
                      {suggestionsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {suggestionsLoading && suggestions.length === 0 && (
                            <div className="py-8 flex flex-col items-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin text-accent/50" />
                              <p className="text-[12px] text-muted-foreground/50">
                                Buscando tendências para {profile?.especialidade}…
                              </p>
                            </div>
                          )}

                          {suggestionsError && !suggestionsLoading && suggestions.length === 0 && (
                            <div className="flex items-center gap-3 py-4">
                              <AlertTriangle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                              <p className="text-[12px] text-muted-foreground/50 flex-1">
                                Não foi possível carregar sugestões.
                              </p>
                              <Button variant="ghost" size="sm" onClick={loadSuggestions} className="shrink-0 text-[11px] h-6">
                                Tentar novamente
                              </Button>
                            </div>
                          )}

                          {suggestions.length > 0 && (
                            <div className="grid gap-2 md:grid-cols-2">
                              {suggestions.map((s, i) => (
                                <div
                                  key={i}
                                  className="group rounded-xl border border-border/30 hover:border-accent/20 p-4 transition-all hover:shadow-sm cursor-pointer bg-card/50"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h4 className="text-[13px] font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                                      {s.titulo}
                                    </h4>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                                      urgenciaCor[s.urgencia] || "bg-secondary text-muted-foreground"
                                    }`}>
                                      {s.urgencia}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground/60 line-clamp-2 mb-3">
                                    {s.tese}
                                  </p>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="h-7 text-[11px] flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                                      onClick={(e) => { e.stopPropagation(); handleGenerateFromSuggestion(s); }}
                                      disabled={loading}
                                    >
                                      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Zap className="h-3 w-3 mr-1" />Gerar</>}
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground/50" onClick={(e) => { e.stopPropagation(); handleSelectSuggestion(s); }}>
                                      Editar
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                )}

                {/* Recommendation Context Block */}
                {showRecommendationBlock && recommendationContext && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-accent/15 bg-accent/[0.03] p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center">
                          <TrendingUp className="h-3 w-3 text-accent" />
                        </div>
                        <span className="text-[11px] font-semibold text-foreground/80 tracking-wide">
                          Recomendação estratégica
                        </span>
                      </div>
                      <button
                        onClick={() => setShowRecommendationBlock(false)}
                        className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {recommendationContext.why_now && (
                      <p className="text-[12px] text-muted-foreground/70 leading-relaxed">
                        {recommendationContext.why_now}
                      </p>
                    )}

                    {recommendationContext.strategic_opportunity && (
                      <div className="bg-accent/[0.05] rounded-lg px-3 py-2">
                        <span className="text-[9px] uppercase tracking-[0.15em] text-accent/60 font-semibold">Oportunidade</span>
                        <p className="text-[12px] text-foreground/70 mt-0.5">{recommendationContext.strategic_opportunity}</p>
                      </div>
                    )}

                    {/* Editorial direction details */}
                    {(recommendationContext.hook_angle || recommendationContext.narrative_rhythm || recommendationContext.cta_direction) && (
                      <div className="grid grid-cols-1 gap-1.5">
                        {recommendationContext.hook_angle && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-muted-foreground/40 font-medium shrink-0">Hook:</span>
                            <span className="text-foreground/60">{recommendationContext.hook_angle}</span>
                          </div>
                        )}
                        {recommendationContext.narrative_rhythm && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-muted-foreground/40 font-medium shrink-0">Ritmo:</span>
                            <span className="text-foreground/60">{recommendationContext.narrative_rhythm}</span>
                          </div>
                        )}
                        {recommendationContext.cta_direction && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-muted-foreground/40 font-medium shrink-0">CTA:</span>
                            <span className="text-foreground/60">{recommendationContext.cta_direction}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {recommendationContext.recommendation_reasoning && (
                      <p className="text-[11px] text-muted-foreground/50 italic leading-relaxed border-l-2 border-accent/15 pl-2.5">
                        {recommendationContext.recommendation_reasoning}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {recommendationContext.confidence && (
                        <Badge variant="outline" className={`text-[10px] border-border/30 ${
                          recommendationContext.confidence === "alta" ? "text-emerald-600" :
                          recommendationContext.confidence === "baixa" ? "text-rose-600" : "text-amber-600"
                        }`}>
                          Confiança: {recommendationContext.confidence}
                        </Badge>
                      )}
                      {recommendationContext.risk_repetition && (
                        <Badge variant="outline" className={`text-[10px] border-border/30 ${
                          recommendationContext.risk_repetition === "baixo" ? "text-emerald-600" :
                          recommendationContext.risk_repetition === "alto" ? "text-rose-600" : "text-amber-600"
                        }`}>
                          Repetição: {recommendationContext.risk_repetition}
                        </Badge>
                      )}
                      {recommendationContext.cluster && (
                        <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                          {recommendationContext.cluster}
                        </Badge>
                      )}
                      {recommendationContext.campaign && (
                        <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                          {recommendationContext.campaign}
                        </Badge>
                      )}
                      {recommendationContext.persona && (
                        <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                          {recommendationContext.persona}
                        </Badge>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground/40 italic">
                      Edite o briefing abaixo se quiser ajustar antes de gerar.
                    </p>
                  </motion.div>
                )}

                {/* Brief Form */}
                <div className="space-y-5">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-semibold">
                    Direção do conteúdo
                  </span>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tema-init" className="text-[11px] text-muted-foreground/70">Tema</Label>
                      <Textarea
                        id="tema-init"
                        value={tema}
                        onChange={(e) => setTema(e.target.value)}
                        placeholder="Ex: Bioestimuladores de colágeno para rejuvenescimento"
                        rows={2}
                        className="text-[13px] resize-none bg-transparent border-border/40 focus:border-accent/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tese-init" className="text-[11px] text-muted-foreground/70">Tese central</Label>
                      <Textarea
                        id="tese-init"
                        value={tese}
                        onChange={(e) => setTese(e.target.value)}
                        placeholder="O que você defende — a opinião que guia o conteúdo"
                        rows={3}
                        className="text-[13px] resize-none bg-transparent border-border/40 focus:border-accent/40"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground/70">Objetivo</Label>
                        <Select value={objetivo} onValueChange={(v) => setObjetivo(v as ObjetivoEnum)}>
                          <SelectTrigger className="h-9 text-[13px] bg-transparent border-border/40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {objetivoOptions.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground/70">Formato</Label>
                        <Select value={formato} onValueChange={setFormato}>
                          <SelectTrigger className="h-9 text-[13px] bg-transparent border-border/40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {formatoOptions.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {objetivoDetalhado && (
                      <div className="text-[11px] text-muted-foreground/50 bg-muted/30 p-2.5 rounded-md">
                        <span className="font-medium">Contexto:</span> {objetivoDetalhado}
                      </div>
                    )}

                    {generateError && (
                      <div className="text-[12px] text-destructive bg-destructive/5 border border-destructive/10 rounded-md p-3 flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>{generateError}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleGenerate}
                        disabled={loading || !tese.trim()}
                        className="flex-1 h-10 bg-accent text-accent-foreground hover:bg-accent/90 text-[13px] rounded-xl"
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando carrossel…</>
                        ) : (
                          <><Sparkles className="h-4 w-4 mr-2" />{showRecommendationBlock ? "Gerar com esta recomendação" : "Gerar Carrossel"}</>
                        )}
                      </Button>
                      <Button
                        variant={labMode ? "default" : "outline"}
                        size="icon"
                        onClick={() => setLabMode(!labMode)}
                        title="Prompt Lab"
                        className={`h-10 w-10 rounded-xl ${labMode ? "bg-accent text-accent-foreground" : "border-border/40"}`}
                      >
                        <FlaskConical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Prompt Lab — initial state */}
                {labMode && tese.trim() && (
                  <div className="rounded-xl border border-border/30 p-5">
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

                {/* Loading state */}
                {loading && !roteiro && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-12"
                  >
                    <div className="relative">
                      <div className="w-16 h-20 rounded-lg bg-accent/5 border border-accent/10" />
                      <Loader2 className="h-5 w-5 text-accent animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[12px] text-muted-foreground/50">
                      Criando direção editorial…
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Carrossel;
