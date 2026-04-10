import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  TravessIARoteiro,
  travessiaToSlideData,
  validarRoteiro,
  type PreferredVisualStyle,
} from "@/types/carousel";
import { mapToObjetivoEnum, type ObjetivoEnum } from "@/types/inspiration";
import {
  ALL_PRESETS,
  DEFAULT_PRESET_ID,
  getPresetOrDefault,
  type BenchmarkPresetId,
  type BenchmarkPreset,
} from "@/lib/benchmark-presets";
import CarouselVisualPreview from "@/components/carousel/CarouselVisualPreview";
import type { SlideData } from "@/components/carousel/SlideRenderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  Settings,
  CheckCircle2,
  FileText,
  Target,
  Lightbulb,
  Hash,
  Compass,
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

/* ── Preset Selector ── */

function PresetSelector({
  selected,
  onSelect,
}: {
  selected: BenchmarkPresetId;
  onSelect: (id: BenchmarkPresetId) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          Direção criativa
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ALL_PRESETS.map((p) => {
          const isActive = p.id === selected;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`group relative text-left rounded-xl border p-3 transition-all ${
                isActive
                  ? "border-accent/40 bg-accent/5 shadow-sm"
                  : "border-border/50 hover:border-border hover:bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={`text-[12px] font-semibold leading-tight ${
                    isActive ? "text-accent" : "text-foreground"
                  }`}
                >
                  {p.label}
                </span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-0.5" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug mt-1 line-clamp-2">
                {p.tagline}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {p.visual.preferredVisualStyle.replace(/_/g, " ")}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const [presetId, setPresetId] = useState<BenchmarkPresetId>(DEFAULT_PRESET_ID);

  // Roteiro
  const [roteiro, setRoteiro] = useState<TravessIARoteiro | null>(null);
  const [slideDataList, setSlideDataList] = useState<SlideData[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [visualStyle, setVisualStyle] = useState<PreferredVisualStyle>("editorial_black_gold");
  const [loading, setLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Rewrite
  const [feedback, setFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Save
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [savedContentOutputId, setSavedContentOutputId] = useState<string | null>(null);

  const activePreset = getPresetOrDefault(presetId);

  // Pre-fill from navigation state
  useEffect(() => {
    const state = location.state as Record<string, string> | null;
    if (!state?.tese) return;
    setTese(state.tese);
    if (state.objetivoEnum && objetivoOptions.some((o) => o.value === state.objetivoEnum)) {
      setObjetivo(state.objetivoEnum as ObjetivoEnum);
    } else if (state.objetivo) {
      setObjetivo(mapToObjetivoEnum(state.objetivo));
    }
    if (state.objetivoDetalhado) setObjetivoDetalhado(state.objetivoDetalhado);
    else if (state.objetivo) setObjetivoDetalhado(state.objetivo);
    if (state.benchmarkPreset && ALL_PRESETS.some((p) => p.id === state.benchmarkPreset)) {
      setPresetId(state.benchmarkPreset as BenchmarkPresetId);
    }
  }, [location.state]);

  // Auto-load suggestions
  useEffect(() => {
    if (isConfigured && profile && !suggestionsLoaded && !location.state?.tese) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, profile]);

  // When preset changes, update visual style recommendation
  useEffect(() => {
    if (!roteiro) {
      setVisualStyle(activePreset.visual.preferredVisualStyle);
    }
  }, [presetId, activePreset, roteiro]);

  const loadSuggestions = async () => {
    if (!profile || suggestionsLoading) return;
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-carousel-topics", {
        body: {
          especialidade: profile.especialidade,
          subespecialidade: profile.subespecialidade ?? "",
          publico_alvo: profile.publico_alvo ?? "",
          tom_de_voz: profile.tom_de_voz ?? "",
          pilares: profile.diferenciais ?? [],
        },
      });
      if (error) throw error;
      const result = data as { sugestoes?: TopicSuggestion[] };
      if (result.sugestoes?.length) setSuggestions(result.sugestoes);
    } catch (err) {
      setSuggestionsError(err instanceof Error ? err.message : "Erro ao carregar sugestões.");
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
    setVisualStyle(
      parsed.preferredVisualStyle ||
        activePreset.visual.preferredVisualStyle ||
        profile?.skill?.estilo_visual?.preferredVisualStyle ||
        "editorial_black_gold"
    );
    setGenerateError(null);
    if (avisos.length > 0) toast.warning(`Roteiro gerado com ${avisos.length} aviso(s).`);
    else toast.success("Roteiro gerado com sucesso!");
  };

  const generateCarousel = async (teseOverride?: string, objetivoOverride?: ObjetivoEnum) => {
    if (!profile) return;
    const useTese = teseOverride || tese;
    if (!useTese.trim()) {
      toast.error("Informe a tese central.");
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
          benchmarkPreset: presetId,
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
          brand_colors: profile.skill?.estilo_visual
            ? {
                bg: profile.skill.estilo_visual.cor_fundo,
                text: profile.skill.estilo_visual.cor_texto,
                accent: profile.skill.estilo_visual.cor_destaque,
              }
            : undefined,
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
          benchmarkPreset: presetId,
          profile: profile ? { ...profile, pilares: profile.diferenciais } : undefined,
          skill: profile?.skill,
        },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
      setFeedback("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao reescrever.");
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleSaveCarousel = async () => {
    if (!roteiro || !user) return;
    setSavingCarousel(true);
    try {
      const { data, error } = await supabase
        .from("content_outputs")
        .insert({
          user_id: user.id,
          content_type: "carrossel",
          title: roteiro.titulo_carrossel || tema || "Carrossel sem título",
          strategic_input: {
            tese,
            objetivo,
            objetivoDetalhado,
            formato,
            tema,
            benchmarkPreset: presetId,
          } as any,
          generated_content: {
            roteiro,
            slideDataList,
            visualStyle,
            benchmarkPreset: presetId,
            legenda: roteiro.legenda,
            hashtags: roteiro.hashtags,
            cta_final: roteiro.cta_final,
          } as any,
        })
        .select("id")
        .single();
      if (error) throw error;
      setSavedContentOutputId(data.id);
      toast.success("Carrossel salvo na biblioteca!");
    } catch {
      toast.error("Erro ao salvar carrossel.");
    } finally {
      setSavingCarousel(false);
    }
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
  };

  const statusLabel = savedContentOutputId ? "Salvo" : roteiro ? "Rascunho" : "Novo";
  const statusColor = savedContentOutputId
    ? "bg-accent/15 text-accent"
    : roteiro
      ? "bg-primary/10 text-primary"
      : "bg-muted text-muted-foreground";

  /* ── Render ──────────────────────────────────────────── */
  return (
    <AppLayout>
      <div className="flex flex-col h-full min-h-0">
        {/* ═══ TOP BAR ═══ */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h1 className="font-heading text-lg font-semibold text-foreground leading-tight">
                    {roteiro?.titulo_carrossel || "Studio de Carrossel"}
                  </h1>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {activePreset.label} · {activePreset.visual.preferredVisualStyle.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={`text-[10px] font-medium ${statusColor}`}>
                {statusLabel}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {roteiro && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs h-8 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Novo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveCarousel}
                    disabled={savingCarousel || !!savedContentOutputId}
                    className="text-xs h-8"
                  >
                    {savingCarousel ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : savedContentOutputId ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-accent" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {savedContentOutputId ? "Salvo" : "Salvar"}
                  </Button>
                </>
              )}
              <Button
                onClick={handleGenerate}
                disabled={loading || !tese.trim()}
                size="sm"
                className="h-8 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {loading ? "Gerando…" : roteiro ? "Regerar" : "Gerar Carrossel"}
              </Button>
            </div>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        {!user ? (
          <EmptyGate
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Faça login"
            description="Você precisa estar logado para criar carrosséis."
          />
        ) : !isConfigured ? (
          <EmptyGate
            icon={<Settings className="h-5 w-5" />}
            title="Configure seu perfil"
            description="O perfil estratégico é necessário para gerar carrosséis com qualidade."
            action={
              <Button variant="outline" size="sm" onClick={() => navigate("/setup")}>
                Configurar agora
              </Button>
            }
          />
        ) : (
          <div className="flex-1 min-h-0 overflow-auto">
            <div
              className={`grid gap-0 h-full ${roteiro ? "lg:grid-cols-[400px_1fr]" : "max-w-2xl mx-auto"}`}
            >
              {/* ═══ LEFT PANEL: Strategy Briefing ═══ */}
              <div className={`${roteiro ? "border-r border-border overflow-y-auto" : ""}`}>
                <div className="p-6 space-y-6">
                  {/* Preset Selector */}
                  {!roteiro && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <PresetSelector selected={presetId} onSelect={setPresetId} />
                    </motion.div>
                  )}

                  {/* Active preset indicator when roteiro exists */}
                  {roteiro && (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-accent/5 border border-accent/15">
                      <Compass className="h-3.5 w-3.5 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold text-accent">{activePreset.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{activePreset.tagline}</span>
                      </div>
                      <Select value={presetId} onValueChange={(v) => setPresetId(v as BenchmarkPresetId)}>
                        <SelectTrigger className="h-6 w-auto text-[10px] border-none bg-transparent p-0 pr-4">
                          <span className="text-[10px] text-muted-foreground">Trocar</span>
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_PRESETS.map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Suggestions */}
                  {!roteiro && (
                    <motion.section
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-accent" />
                          <h2 className="text-sm font-semibold text-foreground tracking-tight">
                            Sugestões inteligentes
                          </h2>
                        </div>
                        {suggestionsLoaded && (
                          <button
                            onClick={loadSuggestions}
                            disabled={suggestionsLoading}
                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className={`h-3 w-3 ${suggestionsLoading ? "animate-spin" : ""}`} />
                            Atualizar
                          </button>
                        )}
                      </div>

                      {suggestionsLoading && suggestions.length === 0 && (
                        <div className="grid gap-2 md:grid-cols-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          ))}
                        </div>
                      )}

                      {suggestionsError && !suggestionsLoading && suggestions.length === 0 && (
                        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground flex-1">
                            Sugestões indisponíveis. Preencha manualmente.
                          </p>
                          <button onClick={loadSuggestions} className="text-xs text-accent hover:underline shrink-0">
                            Tentar novamente
                          </button>
                        </div>
                      )}

                      {suggestions.length > 0 && (
                        <div className="grid gap-2 md:grid-cols-2">
                          {suggestions.map((s, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="group rounded-xl border border-border hover:border-accent/30 transition-all cursor-pointer p-3.5 space-y-2"
                              onClick={() => handleSelectSuggestion(s)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-[13px] font-medium leading-tight line-clamp-2 text-foreground group-hover:text-accent transition-colors">
                                  {s.titulo}
                                </h3>
                                <span
                                  className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${
                                    s.urgencia === "alta"
                                      ? "bg-destructive/10 text-destructive"
                                      : s.urgencia === "media"
                                        ? "bg-accent/10 text-accent"
                                        : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {s.urgencia}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                {s.tese}
                              </p>
                              <div className="flex gap-1.5 pt-0.5">
                                <Button
                                  size="sm"
                                  className="h-6 text-[10px] flex-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateFromSuggestion(s);
                                  }}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <Zap className="h-2.5 w-2.5 mr-0.5" />
                                      Gerar
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectSuggestion(s);
                                  }}
                                >
                                  Editar
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.section>
                  )}

                  {/* ── Briefing estratégico ── */}
                  <section className="space-y-5">
                    {!roteiro && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-foreground tracking-tight">
                          Briefing estratégico
                        </h2>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="tema"
                          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Tema
                        </Label>
                        <Textarea
                          id="tema"
                          value={tema}
                          onChange={(e) => setTema(e.target.value)}
                          placeholder="Ex: Bioestimuladores de colágeno para rejuvenescimento"
                          rows={1}
                          className="resize-none text-sm border-border/60 focus:border-accent/40 transition-colors rounded-lg"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="tese"
                          className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                          Tese central
                        </Label>
                        <Textarea
                          id="tese"
                          value={tese}
                          onChange={(e) => setTese(e.target.value)}
                          placeholder="A maioria dos pacientes começa bioestimuladores tarde demais…"
                          rows={2}
                          className="resize-none text-sm border-border/60 focus:border-accent/40 transition-colors rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Objetivo
                          </Label>
                          <Select value={objetivo} onValueChange={(v) => setObjetivo(v as ObjetivoEnum)}>
                            <SelectTrigger className="h-9 text-sm rounded-lg border-border/60">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {objetivoOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Formato
                          </Label>
                          <Select value={formato} onValueChange={setFormato}>
                            <SelectTrigger className="h-9 text-sm rounded-lg border-border/60">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {formatoOptions.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                  {f.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {objetivoDetalhado && (
                        <div className="text-[11px] text-muted-foreground bg-accent/5 border border-accent/10 rounded-lg p-2.5 leading-relaxed">
                          <span className="font-medium text-accent">Inspiração:</span> {objetivoDetalhado}
                        </div>
                      )}
                    </div>

                    {generateError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2.5"
                      >
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-destructive font-medium">Erro na geração</p>
                          <p className="text-[11px] text-destructive/70 mt-0.5">{generateError}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Mobile generate button */}
                    {!roteiro && (
                      <div className="lg:hidden">
                        <Button
                          onClick={handleGenerate}
                          disabled={loading || !tese.trim()}
                          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          {loading ? "Gerando…" : "Gerar Carrossel"}
                        </Button>
                      </div>
                    )}
                  </section>

                  {/* ── Rewrite ── */}
                  {roteiro && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <RefreshCw className="h-3 w-3" />
                          Reescrever
                        </Label>
                        <Textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="O que quer mudar? Ex: Tom mais direto, menos slides…"
                          rows={2}
                          className="resize-none text-sm border-border/60 focus:border-accent/40 transition-colors rounded-lg"
                        />
                        <Button
                          onClick={handleRewrite}
                          disabled={rewriteLoading || !feedback.trim()}
                          variant="outline"
                          size="sm"
                          className="rounded-lg text-xs"
                        >
                          {rewriteLoading ? (
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1.5" />
                          )}
                          Reescrever
                        </Button>
                      </div>
                    </motion.section>
                  )}

                  {/* ── Warnings ── */}
                  {roteiro && warnings.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" />
                        {warnings.length} aviso(s) de qualidade
                      </p>
                      {warnings.map((w, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground/70 pl-4">
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* ── Legenda & Hashtags ── */}
                  {roteiro?.legenda && (
                    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <Separator />
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="h-3 w-3" />
                            Legenda
                          </Label>
                          <div className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap bg-muted/20 rounded-lg p-3 border border-border/40">
                            {roteiro.legenda}
                          </div>
                        </div>
                        {roteiro.hashtags && roteiro.hashtags.length > 0 && (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Hash className="h-3 w-3" />
                              Hashtags
                            </Label>
                            <div className="flex flex-wrap gap-1">
                              {roteiro.hashtags.map((h) => (
                                <span
                                  key={h}
                                  className="text-[11px] text-accent bg-accent/8 px-2 py-0.5 rounded-full"
                                >
                                  {h.startsWith("#") ? h : `#${h}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {roteiro.cta_final && (
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              <Target className="h-3 w-3" />
                              CTA
                            </Label>
                            <p className="text-[12px] text-foreground/70 italic">{roteiro.cta_final}</p>
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )}
                </div>
              </div>

              {/* ═══ RIGHT PANEL: Visual Preview ═══ */}
              {roteiro && slideDataList.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-y-auto bg-muted/20"
                >
                  <div className="p-6">
                    <CarouselVisualPreview
                      slides={slideDataList}
                      brandName={profile?.nome}
                      brandHandle={profile?.instagram_handle || profile?.bio_instagram}
                      doctorImageUrl={profile?.foto_url}
                      visualStyle={visualStyle}
                      contentOutputId={savedContentOutputId}
                      onSlidesChange={setSlideDataList}
                      onRegenerate={handleGenerate}
                    />
                  </div>
                </motion.div>
              )}

              {/* Loading state */}
              {loading && !roteiro && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hidden lg:flex flex-col items-center justify-center py-20 gap-4"
                >
                  <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-accent animate-spin" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">Criando seu roteiro</p>
                    <p className="text-xs text-muted-foreground">
                      Aplicando direção {activePreset.label.toLowerCase()}…
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

/* ── Empty/Gate State ── */
function EmptyGate({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          {icon}
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {action}
      </div>
    </div>
  );
}

export default Carrossel;
