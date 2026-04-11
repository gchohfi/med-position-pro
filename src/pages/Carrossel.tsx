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
import {
  getStrategicMemoryForUser,
  processMemorySignals,
  getMemoryAwarePresetRecommendation,
  getMemoryHint,
  type StrategicMemory,
  type MemorySignal,
} from "@/lib/strategic-memory";
import {
  getFeedbackForUser,
  getPerformanceHint,
} from "@/lib/content-feedback";
import ContentFeedbackPanel from "@/components/carousel/ContentFeedbackPanel";
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
  Star,
  Settings,
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

  // Rewrite
  const [feedback, setFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Save
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [savedContentOutputId, setSavedContentOutputId] = useState<string | null>(null);

  // Strategic memory
  const [memory, setMemory] = useState<StrategicMemory | null>(null);
  const [performanceHint, setPerformanceHint] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const memoryHint = getMemoryHint(memory);

  // Load strategic memory + feedback history
  useEffect(() => {
    if (!user) return;
    getStrategicMemoryForUser(user.id).then(setMemory);
    getFeedbackForUser(user.id).then((fb) => setPerformanceHint(getPerformanceHint(fb)));
  }, [user?.id]);

  // Pre-fill from navigation state — map free text to enum
  useEffect(() => {
    const state = location.state as Record<string, string> | null;
    if (!state?.tese) return;

    setTese(state.tese);

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
      // Track rewrite signal
      if (user) processMemorySignals(user.id, [{ type: "rewrite" }]).then((m) => getStrategicMemoryForUser(user.id).then(setMemory));
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
      const { data, error } = await supabase.from("content_outputs").insert({
        user_id: user.id,
        content_type: "carrossel",
        title: roteiro.titulo_carrossel || tema || "Carrossel sem título",
        strategic_input: { tese, objetivo, objetivoDetalhado, formato, tema } as any,
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
      // Track save signal
      processMemorySignals(user.id, [{ type: "save", preset: activePreset, visual: visualStyle }])
        .then(() => getStrategicMemoryForUser(user.id).then(setMemory));
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

  /* ── Render ──────────────────────────────────────────── */

  return (
    <AppLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Layers className="h-6 w-6 text-accent" />
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Criar Carrossel
          </h1>
        </div>

        {!user ? (
          <Card className="max-w-lg">
            <CardContent className="flex items-center gap-4 py-6">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
              <p className="text-sm">Faça login para criar carrosséis.</p>
            </CardContent>
          </Card>
        ) : !isConfigured ? (
          <Card className="max-w-lg">
            <CardContent className="flex items-center gap-4 py-6">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil antes de gerar carrosséis.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")} className="gap-2">
                <Settings className="h-4 w-4" />
                Configurar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${roteiro ? "lg:grid-cols-5" : "lg:grid-cols-1 max-w-3xl"}`}>
            {/* ═══ LEFT: Input area ═══ */}
            <div className={`space-y-4 ${roteiro ? "lg:col-span-2" : ""}`}>
              {/* Suggestions */}
              {!roteiro && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <h2 className="text-base font-semibold">Sugestões para você</h2>
                      {suggestionsLoading && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {suggestionsLoaded && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadSuggestions}
                        disabled={suggestionsLoading}
                        className="text-xs h-7"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Novas
                      </Button>
                    )}
                  </div>

                  {suggestionsLoading && suggestions.length === 0 && (
                    <Card>
                      <CardContent className="py-8 flex flex-col items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                        <p className="text-sm text-muted-foreground">
                          Buscando tendências para {profile?.especialidade}…
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {suggestionsError && !suggestionsLoading && suggestions.length === 0 && (
                    <Card className="border-amber-500/50">
                      <CardContent className="py-4 flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="text-sm text-muted-foreground flex-1">
                          Não foi possível carregar sugestões. Você pode preencher manualmente abaixo.
                        </p>
                        <Button variant="ghost" size="sm" onClick={loadSuggestions} className="shrink-0">
                          Tentar novamente
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {suggestions.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-2">
                      {suggestions.map((s, i) => (
                        <Card
                          key={i}
                          className="hover:border-accent/30 transition-all cursor-pointer"
                        >
                          <CardContent className="pt-3 pb-2.5 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                                {s.titulo}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="text-[10px] shrink-0"
                              >
                                {s.urgencia}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {s.tese}
                            </p>
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                className="h-7 text-xs flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
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
                                    <Zap className="h-3 w-3 mr-1" />
                                    Gerar
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSuggestion(s);
                                }}
                              >
                                Editar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Memory + performance hints */}
              {(memoryHint || performanceHint) && (
                <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg bg-accent/5 border border-accent/10">
                  {memoryHint && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-accent shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{memoryHint}</span>
                        {" · "}Baseado no seu histórico
                      </p>
                    </div>
                  )}
                  {performanceHint && (
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-accent shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{performanceHint}</span>
                        {" · "}Performance percebida
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Brief form */}
              <Card>
                <CardContent className="pt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tema">Qual é o tema?</Label>
                    <Textarea
                      id="tema"
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      placeholder="Ex: Bioestimuladores de colágeno para rejuvenescimento"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tese">Qual é a tese? (o que você defende)</Label>
                    <Textarea
                      id="tese"
                      value={tese}
                      onChange={(e) => setTese(e.target.value)}
                      placeholder="Ex: A maioria dos pacientes começa bioestimuladores tarde demais — o melhor momento é antes dos sinais aparecerem."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Objetivo</Label>
                      <Select value={objetivo} onValueChange={(v) => setObjetivo(v as ObjetivoEnum)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {objetivoOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <Select value={formato} onValueChange={setFormato}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formatoOptions.map((f) => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {objetivoDetalhado && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                      <span className="font-medium">Contexto da inspiração:</span> {objetivoDetalhado}
                    </div>
                  )}

                  {generateError && (
                    <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{generateError}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={handleGenerate}
                      disabled={loading || !tese.trim()}
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Gerar Carrossel
                        </>
                      )}
                    </Button>
                    {roteiro && (
                      <>
                        <Button variant="outline" size="icon" onClick={handleReset} title="Novo">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleSaveCarousel}
                          disabled={savingCarousel}
                          title="Salvar"
                        >
                          {savingCarousel ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rewrite */}
              {roteiro && (
                <Card>
                  <CardContent className="pt-5 space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reescrever roteiro
                    </Label>
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="O que quer mudar? Ex: Tom mais direto, menos slides…"
                      rows={2}
                    />
                    <Button
                      onClick={handleRewrite}
                      disabled={rewriteLoading || !feedback.trim()}
                      variant="outline"
                      size="sm"
                    >
                      {rewriteLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Reescrever
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {roteiro && warnings.length > 0 && (
                <Card className="border-amber-500/50">
                  <CardContent className="py-3 space-y-1">
                    <p className="text-sm font-medium text-amber-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {warnings.length} aviso(s)
                    </p>
                    {warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-600 ml-6">{w}</p>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Legenda */}
              {roteiro?.legenda && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Legenda e Hashtags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{roteiro.legenda}</p>
                    {roteiro.hashtags && (
                      <div className="flex flex-wrap gap-1">
                        {roteiro.hashtags.map((h) => (
                          <Badge key={h} variant="secondary" className="text-xs">
                            {h.startsWith("#") ? h : `#${h}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                    if (user) {
                      processMemorySignals(user.id, [{ type: "preset_chosen", preset: id }])
                        .then(() => getStrategicMemoryForUser(user.id).then(setMemory));
                    }
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
