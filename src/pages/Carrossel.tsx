import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  Search,
} from "lucide-react";

interface PautaResult {
  titulo: string;
  resumo: string;
  tese_sugerida?: string;
  objetivo_sugerido?: string;
  fonte?: string;
}

const Carrossel = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();

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
  const [loading, setLoading] = useState(false);

  // View toggle
  const [viewMode, setViewMode] = useState<"texto" | "visual">("texto");

  // Rewrite feedback
  const [feedback, setFeedback] = useState("");
  const [rewriteLoading, setRewriteLoading] = useState(false);

  // ─── Research: Pesquisar Pautas ───────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Digite um tema para pesquisar.");
      return;
    }
    setSearchLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-pesquisador", {
        body: { query: searchQuery, profile },
      });
      if (error) throw error;
      const results = (data?.pautas || data?.results || data || []) as PautaResult[];
      setPautas(results);
      if (results.length === 0) toast.info("Nenhuma pauta encontrada.");
    } catch (err: any) {
      console.error("Erro ao pesquisar pautas:", err);
      toast.error(err.message || "Erro ao pesquisar pautas.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectPauta = (pauta: PautaResult) => {
    if (pauta.tese_sugerida) setTese(pauta.tese_sugerida);
    else setTese(pauta.titulo);
    if (pauta.objetivo_sugerido) setObjetivo(pauta.objetivo_sugerido);
    toast.success("Pauta selecionada! Tese e objetivo preenchidos.");
  };

  // ─── Research: Scraper ────────────────────────────────────────────
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
        toast.success("Conteudo extraido! Tese preenchida.");
      } else {
        toast.warning("Nao foi possivel extrair conteudo relevante.");
      }
    } catch (err: any) {
      console.error("Erro ao extrair link:", err);
      toast.error(err.message || "Erro ao extrair conteudo do link.");
    } finally {
      setScraperLoading(false);
    }
  };

  // ─── Generate ─────────────────────────────────────────────────────
  const applyRoteiro = (parsed: TravessIARoteiro) => {
    setRoteiro(parsed);
    const slides = parsed.slides.map((s) => travessiaToSlideData(s, parsed.slides.length));
    setSlideDataList(slides);
    const avisos = validarRoteiro(parsed);
    setWarnings(avisos);
    setQuality(avaliarQualidadeRoteiro(parsed));
    setNutrologaReview(simularRevisaoNutrologa(parsed));
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
        body: { profile, tese, objetivo, action: "generate" },
      });
      if (error) throw error;
      const parsed = data as TravessIARoteiro;
      applyRoteiro(parsed);
    } catch (err: any) {
      console.error("Erro ao gerar carrossel:", err);
      toast.error(err.message || "Erro ao gerar roteiro do carrossel.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Rewrite ──────────────────────────────────────────────────────
  const handleRewrite = async () => {
    if (!roteiro || !feedback.trim()) {
      toast.error("Escreva o que deseja mudar no roteiro.");
      return;
    }
    setRewriteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: { action: "rewrite", roteiro: roteiro.slides, feedback, profile },
      });
      if (error) throw error;
      const parsed = data as TravessIARoteiro;
      applyRoteiro(parsed);
      setFeedback("");
      toast.success("Roteiro reescrito com sucesso!");
    } catch (err: any) {
      console.error("Erro ao reescrever:", err);
      toast.error(err.message || "Erro ao reescrever roteiro.");
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleReset = () => {
    setRoteiro(null);
    setSlideDataList([]);
    setWarnings([]);
    setQuality(null);
    setNutrologaReview(null);
    setTese("");
    setObjetivo("");
    setFeedback("");
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Layers className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Gerador de Carrossel</h1>
        </div>
        <p className="text-muted-foreground">
          Gere roteiros de carrossel com estrutura narrativa otimizada para Instagram medico.
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
            {/* ── Research Panel (collapsible) ──────────────────────────── */}
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
                  {/* Pesquisar Pautas */}
                  <div className="space-y-2">
                    <Label className="font-medium">Pesquisar Pautas</Label>
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ex: acne adulta, tratamento laser, microbioma"
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <Button onClick={handleSearch} disabled={searchLoading} size="sm">
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

                  {/* Transformar um Link */}
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
                      <Button onClick={handleScrape} disabled={scraperLoading} size="sm">
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

            {/* ── Brief Form ───────────────────────────────────────────── */}
            <Card>
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
                  <Button onClick={handleGenerate} disabled={loading || !tese.trim()}>
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
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Novo Roteiro
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Results ──────────────────────────────────────────────── */}
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
                                {slide.headline || slide.mini_titulo || slide.big_text || slide.turn_text || slide.conclusion || `Slide ${slide.numero}`}
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
                                  {slide.stat_number}{slide.stat_unit && ` ${slide.stat_unit}`}
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
                  <CarouselVisualPreview slides={slideDataList} />
                )}

                {/* ── Feedback / Rewrite ─────────────────────────────── */}
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

                {/* ── Legenda / Hashtags placeholder ─────────────────── */}
                {(roteiro as any).legenda && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Legenda e Hashtags</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm whitespace-pre-wrap">{(roteiro as any).legenda}</p>
                      {(roteiro as any).hashtags && (
                        <div className="flex flex-wrap gap-1">
                          {((roteiro as any).hashtags as string[]).map((h) => (
                            <Badge key={h} variant="secondary" className="text-xs">
                              {h.startsWith("#") ? h : `#${h}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {(roteiro as any).cta_final && (
                        <p className="text-sm">
                          <strong>CTA Final:</strong> {(roteiro as any).cta_final}
                        </p>
                      )}
                    </CardContent>
                  </Card>
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
