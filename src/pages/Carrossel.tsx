import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  TravessIARoteiro,
  TravessIASlide,
  travessiaToSlideData,
  validarRoteiro,
  avaliarQualidadeRoteiro,
  type CarouselQualityReport,
  simularRevisaoNutrologa,
  type NutrologaReviewReport,
  validarVisualAntiMediocridade,
  type VisualQualityReport,
  type PreferredVisualStyle,
} from "@/types/carousel";
import CarouselVisualPreview from "@/components/carousel/CarouselVisualPreview";
import type { SlideData } from "@/components/carousel/SlideRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Layers,
  Link,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Zap,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

interface PautaResult {
  titulo: string;
  resumo: string;
  tese_sugerida?: string;
  objetivo_sugerido?: string;
  fonte?: string;
}

interface TopicSuggestion {
  titulo: string;
  tese: string;
  objetivo: string;
  formato: string;
  por_que: string;
  urgencia: string;
}

/* ── Helpers ───────────────────────────────────────────── */

const formatoBadge: Record<string, string> = {
  mitos_verdades: "Mitos vs Verdades",
  passo_a_passo: "Passo a Passo",
  dados_impacto: "Dados de Impacto",
  comparativo: "Comparativo",
  erros_comuns: "Erros Comuns",
  explicacao: "Explicação",
  dica_pratica: "Dica Prática",
  alerta: "Alerta",
};

const urgenciaCor: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  media:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  baixa:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

/* ── Component ─────────────────────────────────────────── */

const Carrossel = () => {
  const { profile, isConfigured } = useDoctor();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-suggestions
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  // Brief form
  const [tese, setTese] = useState("");
  const [objetivo, setObjetivo] = useState("");

  // Research panel
  const [researchOpen, setResearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pautas, setPautas] = useState<PautaResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Scraper
  const [scraperUrl, setScraperUrl] = useState("");
  const [scraperLoading, setScraperLoading] = useState(false);

  // Roteiro
  const [roteiro, setRoteiro] = useState<TravessIARoteiro | null>(null);
  const [slideDataList, setSlideDataList] = useState<SlideData[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [quality, setQuality] = useState<CarouselQualityReport | null>(null);
  const [nutrologaReview, setNutrologaReview] = useState<NutrologaReviewReport | null>(null);
  const [visualQuality, setVisualQuality] = useState<VisualQualityReport | null>(null);
  const [visualStyle, setVisualStyle] = useState<PreferredVisualStyle>("editorial_black_gold");
  const [loading, setLoading] = useState(false);

  // View toggle — default to visual when premium style
  const [viewMode, setViewMode] = useState<"texto" | "visual">("visual");

  // Rewrite feedback
  const [feedback, setFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // Saved carousels
  const [savedCarousels, setSavedCarousels] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [savedContentOutputId, setSavedContentOutputId] = useState<string | null>(null);

  // Load saved carousels
  const loadSavedCarousels = useCallback(async () => {
    if (!user) return;
    setSavedLoading(true);
    try {
      const { data } = await supabase
        .from("content_outputs")
        .select("*")
        .eq("user_id", user.id)
        .eq("content_type", "carrossel")
        .order("created_at", { ascending: false });
      setSavedCarousels(data || []);
    } catch (err) {
      console.error("Error loading saved carousels:", err);
    } finally {
      setSavedLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadSavedCarousels();
  }, [user, loadSavedCarousels]);

  // Save current carousel
  const handleSaveCarousel = async () => {
    if (!roteiro || !user) return;
    setSavingCarousel(true);
    try {
      const { data, error } = await supabase.from("content_outputs").insert({
        user_id: user.id,
        content_type: "carrossel",
        title: roteiro.titulo_carrossel || "Carrossel sem título",
        strategic_input: { tese, objetivo } as any,
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
      await loadSavedCarousels();
    } catch (err) {
      toast.error("Erro ao salvar carrossel.");
      console.error(err);
    } finally {
      setSavingCarousel(false);
    }
  };

  // Delete saved carousel
  const handleDeleteCarousel = async (id: string) => {
    try {
      const { error } = await supabase.from("content_outputs").delete().eq("id", id);
      if (error) throw error;
      setSavedCarousels((prev) => prev.filter((c) => c.id !== id));
      toast.success("Carrossel removido.");
    } catch (err) {
      toast.error("Erro ao remover carrossel.");
    }
  };

  // Load a saved carousel into the editor
  const handleLoadCarousel = (item: any) => {
    const content = item.generated_content;
    if (content?.roteiro) {
      applyRoteiro(content.roteiro);
      if (item.strategic_input?.tese) setTese(item.strategic_input.tese);
      if (item.strategic_input?.objetivo) setObjetivo(item.strategic_input.objetivo);
      if (content.visualStyle) setVisualStyle(content.visualStyle);
      toast.success("Carrossel carregado!");
    }
  };

  // Pre-fill from navigation state (e.g. from Inspiração page)
  useEffect(() => {
    if (location.state?.tese) {
      setTese(location.state.tese);
      if (location.state?.objetivo) setObjetivo(location.state.objetivo);
    }
  }, [location.state]);

  // ─── AUTO-LOAD suggestions on mount ───────────────────────────────
  useEffect(() => {
    if (isConfigured && profile && !suggestionsLoaded && !location.state?.tese) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfigured, profile]);

  const loadSuggestions = async () => {
    if (!profile || suggestionsLoading) return;
    setSuggestionsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "suggest-carousel-topics",
        {
          body: {
            especialidade: profile.especialidade,
            subespecialidade: profile.subespecialidade ?? "",
            publico_alvo: profile.publico_alvo ?? "",
            tom_de_voz: profile.tom_de_voz ?? "",
            pilares: profile.objetivos ?? [],
          },
        },
      );
      if (error) throw error;
      const result = data as { sugestoes?: TopicSuggestion[] };
      if (result.sugestoes && result.sugestoes.length > 0) {
        setSuggestions(result.sugestoes);
      }
    } catch (err: unknown) {
      console.error("Erro ao carregar sugestões:", err);
      // Silent fail — suggestions are optional
    } finally {
      setSuggestionsLoading(false);
      setSuggestionsLoaded(true);
    }
  };

  const handleSelectSuggestion = (s: TopicSuggestion) => {
    setTese(s.tese);
    setObjetivo(s.objetivo);
    toast.success(`Tema selecionado: ${s.titulo}`);
    // Scroll to form
    document.getElementById("brief-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGenerateFromSuggestion = async (s: TopicSuggestion) => {
    setTese(s.tese);
    setObjetivo(s.objetivo);
    // Generate immediately
    if (!profile) return;
    setLoading(true);
    setRoteiro(null);
    setSavedContentOutputId(null);
    setSlideDataList([]);
    setWarnings([]);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: {
          profile,
          tese: s.tese,
          objetivo: s.objetivo,
          action: "generate",
          skill: profile?.skill,
        },
      });
      if (error) throw error;
      const parsed = data as TravessIARoteiro;
      applyRoteiro(parsed);
    } catch (err: unknown) {
      console.error("Erro ao gerar carrossel:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar roteiro do carrossel.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Research: Pesquisar Pautas ─────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Digite um tema para pesquisar.");
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "agent-pesquisador",
        { body: { query: searchQuery, profile } },
      );
      if (error) throw error;
      const results = (data?.pautas || data?.results || data || []) as PautaResult[];
      setPautas(results);
      if (results.length === 0) toast.info("Nenhuma pauta encontrada.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao pesquisar pautas.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPauta = (pauta: PautaResult) => {
    if (pauta.tese_sugerida) setTese(pauta.tese_sugerida);
    else setTese(pauta.titulo);
    if (pauta.objetivo_sugerido) setObjetivo(pauta.objetivo_sugerido);
    toast.success("Pauta selecionada!");
  };

  // ─── Research: Scraper ──────────────────────────────────────────
  const handleScrape = async () => {
    if (!scraperUrl.trim()) {
      toast.error("Informe a URL para extrair.");
      return;
    }
    setScraperLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-scraper", {
        body: { url: scraperUrl },
      });
      if (error) throw error;
      const extractedTese = data?.tese || data?.titulo || data?.content || "";
      if (extractedTese) {
        setTese(extractedTese);
        toast.success("Conteudo extraido!");
      } else {
        toast.warning("Nao foi possivel extrair conteudo relevante.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao extrair conteudo do link.");
    } finally {
      setScraperLoading(false);
    }
  };

  // ─── Generate ───────────────────────────────────────────────────
  const applyRoteiro = (parsed: TravessIARoteiro) => {
    setRoteiro(parsed);
    const slides = parsed.slides.map((s) =>
      travessiaToSlideData(s, parsed.slides.length),
    );
    setSlideDataList(slides);
    const avisos = validarRoteiro(parsed);
    setWarnings(avisos);
    setQuality(avaliarQualidadeRoteiro(parsed));
    setNutrologaReview(simularRevisaoNutrologa(parsed));
    setVisualQuality(validarVisualAntiMediocridade(parsed));
    setVisualStyle(parsed.preferredVisualStyle || profile?.skill?.estilo_visual?.preferredVisualStyle || "editorial_black_gold");
    if (avisos.length > 0) {
      toast.warning(`Roteiro gerado com ${avisos.length} aviso(s).`);
    } else {
      toast.success("Roteiro gerado com sucesso!");
    }
  };

  const handleGenerate = async () => {
    if (!profile) return;
    if (!tese.trim()) {
      toast.error("Informe a tese central do carrossel.");
      return;
    }
    setLoading(true);
    setRoteiro(null);
    setSlideDataList([]);
    setWarnings([]);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: { profile, tese, objetivo, action: "generate", skill: profile?.skill },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao gerar roteiro do carrossel.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Rewrite ────────────────────────────────────────────────────
  const handleRewrite = async () => {
    if (!roteiro || !feedback.trim()) {
      toast.error("Escreva o que deseja mudar no roteiro.");
      return;
    }
    setRewriteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: {
          action: "rewrite",
          roteiro: roteiro.slides,
          feedback,
          profile,
          skill: profile?.skill,
        },
      });
      if (error) throw error;
      applyRoteiro(data as TravessIARoteiro);
      setFeedback("");
      toast.success("Roteiro reescrito!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao reescrever roteiro.");
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleReset = () => {
    setRoteiro(null);
    setSavedContentOutputId(null);
    setSlideDataList([]);
    setWarnings([]);
    setQuality(null);
    setNutrologaReview(null);
    setVisualQuality(null);
    setTese("");
    setObjetivo("");
    setFeedback("");
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Gerador de Carrossel</h1>
        </div>
        <p className="text-muted-foreground">
          Gere roteiros de carrossel com estrutura narrativa otimizada para
          Instagram medico.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil nao configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup antes de gerar carrosseis.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* ═══════════ AUTO-SUGGESTIONS ═══════════ */}
            {!roteiro && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">
                      Sugestoes para voce
                    </h2>
                    {suggestionsLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {suggestionsLoaded && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadSuggestions}
                      disabled={suggestionsLoading}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Novas sugestoes
                    </Button>
                  )}
                </div>

                {suggestionsLoading && suggestions.length === 0 && (
                  <Card>
                    <CardContent className="py-8 flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Buscando tendencias reais para {profile?.especialidade}...
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Perplexity + Claude analisando dados atuais
                      </p>
                    </CardContent>
                  </Card>
                )}

                {suggestions.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {suggestions.map((s, i) => (
                      <Card
                        key={i}
                        className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                      >
                        <CardContent className="pt-4 pb-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold leading-tight">
                              {s.titulo}
                            </h3>
                            <Badge
                              className={`text-[10px] shrink-0 ${urgenciaCor[s.urgencia] ?? ""}`}
                            >
                              {s.urgencia}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {s.tese}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">
                              {formatoBadge[s.formato] ?? s.formato}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">
                              <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                              {s.por_que?.slice(0, 40)}
                              {(s.por_que?.length ?? 0) > 40 ? "..." : ""}
                            </Badge>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs flex-1"
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
                                  Gerar Carrossel
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

            {/* ═══════════ RESEARCH PANEL (collapsible) ═══════════ */}
            {!roteiro && (
              <Card>
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setResearchOpen(!researchOpen)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Pesquisar Pautas e Extrair Links
                    </CardTitle>
                    {researchOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CardHeader>
                {researchOpen && (
                  <CardContent className="space-y-5 pt-0">
                    <div className="space-y-2">
                      <Label className="font-medium">Pesquisar Pautas</Label>
                      <div className="flex gap-2">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Ex: acne adulta, tratamento laser, microbioma"
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button
                          onClick={handleSearch}
                          disabled={searchLoading}
                          size="sm"
                        >
                          {searchLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {pautas.length > 0 && (
                        <div className="grid gap-2 mt-2">
                          {pautas.map((p, i) => (
                            <div
                              key={i}
                              onClick={() => handleSelectPauta(p)}
                              className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                            >
                              <p className="font-medium text-sm">{p.titulo}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {p.resumo}
                              </p>
                              {p.fonte && (
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                  Fonte: {p.fonte}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium flex items-center gap-2">
                        <Link className="h-4 w-4" />
                        Transformar um Link
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={scraperUrl}
                          onChange={(e) => setScraperUrl(e.target.value)}
                          placeholder="https://artigo-ou-post.com/..."
                          type="url"
                        />
                        <Button
                          onClick={handleScrape}
                          disabled={scraperLoading}
                          size="sm"
                        >
                          {scraperLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Extrair"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* ═══════════ BRIEF FORM ═══════════ */}
            <Card id="brief-form">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tese">Tese central do carrossel</Label>
                  <Textarea
                    id="tese"
                    value={tese}
                    onChange={(e) => setTese(e.target.value)}
                    placeholder="Ex: A maioria dos pacientes com acne usa o produto errado no primeiro mes de tratamento."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objetivo">Objetivo do carrossel</Label>
                  <Textarea
                    id="objetivo"
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    placeholder="Ex: Educar e gerar salvamentos. Publico: mulheres 25-40 com acne adulta."
                    rows={2}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading || !tese.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Roteiro...
                      </>
                    ) : (
                      "Gerar Carrossel"
                    )}
                  </Button>
                  {roteiro && (
                    <>
                      <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Novo Roteiro
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleSaveCarousel}
                        disabled={savingCarousel}
                      >
                        {savingCarousel ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ═══════════ RESULTS ═══════════ */}
            {roteiro && (
              <div className="space-y-4">
                {/* Warnings */}
                {warnings.length > 0 && (
                  <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="py-3 space-y-1">
                      <p className="text-sm font-medium text-amber-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Avisos de validacao ({warnings.length})
                      </p>
                      {warnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-600 ml-6">
                          {w}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Quality score */}
                {quality && (
                  <Card>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Qualidade estimada do carrossel</p>
                        <Badge variant={quality.score >= 85 ? "default" : quality.score >= 70 ? "secondary" : "destructive"}>
                          {quality.score}/100 · {quality.summary}
                        </Badge>
                      </div>
                      {quality.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 mb-1">Pontos fortes</p>
                          {quality.strengths.slice(0, 3).map((item, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {item}</p>
                          ))}
                        </div>
                      )}
                      {quality.improvements.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-amber-700 mb-1">Melhorias sugeridas</p>
                          {quality.improvements.slice(0, 3).map((item, i) => (
                            <p key={i} className="text-xs text-muted-foreground">• {item}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {nutrologaReview && (
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Simulação: revisão de uma nutróloga</p>
                        <Badge variant={nutrologaReview.parecer === "aprovado" ? "default" : "secondary"}>
                          {nutrologaReview.parecer === "aprovado" ? "Aprovado para teste" : "Ajustar antes de publicar"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">• {nutrologaReview.headlineFeedback}</p>
                      <p className="text-xs text-muted-foreground">• {nutrologaReview.scientificFeedback}</p>
                      <p className="text-xs text-muted-foreground">• {nutrologaReview.practicalFeedback}</p>
                      <p className="text-xs text-muted-foreground">• {nutrologaReview.ctaFeedback}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Visual anti-mediocrity */}
                {visualQuality && visualQuality.issues.length > 0 && (
                  <Card className={`border-l-4 ${
                    visualQuality.verdict === "premium" ? "border-l-emerald-500" :
                    visualQuality.verdict === "bom" ? "border-l-blue-500" :
                    visualQuality.verdict === "morno" ? "border-l-amber-500" : "border-l-red-500"
                  }`}>
                    <CardContent className="py-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Avaliacao Visual
                        </p>
                        <Badge variant={visualQuality.score >= 75 ? "default" : visualQuality.score >= 55 ? "secondary" : "destructive"}>
                          {visualQuality.score}/100 · {visualQuality.verdict}
                        </Badge>
                      </div>
                      {visualQuality.issues.filter(i => i.severity === "error").map((issue, idx) => (
                        <p key={`e-${idx}`} className="text-xs text-red-600 dark:text-red-400 ml-1">
                          {issue.slide ? `Slide ${issue.slide}: ` : ""}{issue.message}
                          <span className="block text-muted-foreground mt-0.5 ml-2">→ {issue.suggestion}</span>
                        </p>
                      ))}
                      {visualQuality.issues.filter(i => i.severity === "warning").map((issue, idx) => (
                        <p key={`w-${idx}`} className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                          {issue.slide ? `Slide ${issue.slide}: ` : ""}{issue.message}
                          <span className="block text-muted-foreground mt-0.5 ml-2">→ {issue.suggestion}</span>
                        </p>
                      ))}
                      {visualQuality.issues.filter(i => i.severity === "opportunity").map((issue, idx) => (
                        <p key={`o-${idx}`} className="text-xs text-blue-600 dark:text-blue-400 ml-1">
                          {issue.slide ? `Slide ${issue.slide}: ` : ""}{issue.message}
                          <span className="block text-muted-foreground mt-0.5 ml-2">→ {issue.suggestion}</span>
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Roteiro header */}
                <Card>
                  <CardHeader>
                    <CardTitle>{roteiro.titulo_carrossel}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Tese:</strong> {roteiro.tese}
                    </p>
                    {roteiro.jornada && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Jornada:</strong> {roteiro.jornada}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* View toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "texto" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("texto")}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Texto
                  </Button>
                  <Button
                    variant={viewMode === "visual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("visual")}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visual
                  </Button>
                </div>

                {/* Text view */}
                {viewMode === "texto" && (
                  <div className="space-y-3">
                    {roteiro.slides.map((slide) => (
                      <Card key={slide.numero}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center gap-1 shrink-0">
                              <span className="text-xs font-bold bg-primary/10 text-primary rounded-full w-7 h-7 flex items-center justify-center">
                                {slide.numero}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {slide.layout}
                              </Badge>
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="font-semibold">
                                {slide.headline ||
                                  slide.mini_titulo ||
                                  slide.big_text ||
                                  slide.turn_text ||
                                  slide.conclusion ||
                                  `Slide ${slide.numero}`}
                              </h4>
                              {slide.texto && (
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {slide.texto}
                                </p>
                              )}
                              {slide.opinion && (
                                <p className="text-sm text-muted-foreground italic">
                                  {slide.opinion}
                                </p>
                              )}
                              {slide.stat_number && (
                                <p className="text-sm font-mono">
                                  {slide.stat_number}
                                  {slide.stat_unit && ` ${slide.stat_unit}`}
                                </p>
                              )}
                              {slide.e_dai && (
                                <p className="text-xs text-muted-foreground">
                                  E dai: {slide.e_dai}
                                </p>
                              )}
                              {slide.pergunta_comentario && (
                                <p className="text-xs italic text-muted-foreground/70">
                                  Pergunta: {slide.pergunta_comentario}
                                </p>
                              )}
                              {slide.img_query && (
                                <p className="text-xs italic text-muted-foreground/70">
                                  Imagem: {slide.img_query}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Visual view */}
                {viewMode === "visual" && slideDataList.length > 0 && (
                  <CarouselVisualPreview
                    slides={slideDataList}
                    brandName={profile?.nome}
                    brandHandle={profile?.bio_instagram}
                    doctorImageUrl={profile?.foto_url}
                    visualStyle={visualStyle}
                  />
                )}

                {/* Feedback / Rewrite */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Reescrever Roteiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="O que quer mudar no roteiro? Ex: Menos slides, tom mais informal, trocar o gancho..."
                      rows={3}
                    />
                    <Button
                      onClick={handleRewrite}
                      disabled={rewriteLoading || !feedback.trim()}
                      variant="secondary"
                    >
                      {rewriteLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Reescrevendo...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reescrever com IA
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Legenda / Hashtags */}
                {roteiro.legenda && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Legenda e Hashtags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm whitespace-pre-wrap">
                        {roteiro.legenda}
                      </p>
                      {roteiro.hashtags && (
                        <div className="flex flex-wrap gap-1">
                          {roteiro.hashtags.map((h) => (
                            <Badge
                              key={h}
                              variant="secondary"
                              className="text-xs"
                            >
                              {h.startsWith("#") ? h : `#${h}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {roteiro.cta_final && (
                        <p className="text-sm">
                          <strong>CTA Final:</strong> {roteiro.cta_final}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SAVED CAROUSELS ═══════════ */}
        {savedCarousels.length > 0 && (
          <section className="space-y-3 mt-8">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Carrosséis Salvos</h2>
              <Badge variant="secondary" className="text-xs">
                {savedCarousels.length}
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {savedCarousels.map((item) => (
                <Card
                  key={item.id}
                  className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                  onClick={() => handleLoadCarousel(item)}
                >
                  <CardContent className="pt-4 pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-tight">
                        {item.title || "Carrossel sem título"}
                      </h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </Badge>
                    </div>
                    {item.strategic_input?.tese && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.strategic_input.tese}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadCarousel(item);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Abrir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCarousel(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Carrossel;
