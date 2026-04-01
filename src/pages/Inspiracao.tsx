import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Globe,
  Instagram,
  Users,
  Sparkles,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

interface InspirationProfile {
  handle: string;
  nome: string;
  pais: string;
  especialidade: string;
  seguidores_estimado: string;
  estilo_conteudo: string;
  por_que_inspirar: string;
  pilares_conteudo: string[];
  formatos_destaque: string[];
  nivel_referencia: string;
}

interface DiscoveryResult {
  profiles: InspirationProfile[];
  insights_gerais: string;
}

interface ContentIdea {
  titulo: string;
  formato: string;
  tese: string;
  por_que_funciona: string;
}

interface ProfileAnalysis {
  handle: string;
  estrategia_resumo: string;
  topicos_mais_engajados: string[];
  formatos_eficazes: string[];
  hooks_eficazes: string[];
  estilo_visual: string;
  gaps_conteudo: string[];
  ideias_inspiradas: ContentIdea[];
}

interface AnalysisResult {
  analises: ProfileAnalysis[];
  oportunidades_cruzadas: string[];
  tendencias_formato: string;
}

/* ── Helpers ───────────────────────────────────────────── */

function countryFlag(pais: string): string {
  const code = pais.toUpperCase();
  if (code === "BR") return "\u{1F1E7}\u{1F1F7}";
  if (code === "US") return "\u{1F1FA}\u{1F1F8}";
  if (code === "UK" || code === "GB") return "\u{1F1EC}\u{1F1E7}";
  if (code === "DE") return "\u{1F1E9}\u{1F1EA}";
  if (code === "FR") return "\u{1F1EB}\u{1F1F7}";
  if (code === "ES") return "\u{1F1EA}\u{1F1F8}";
  if (code === "PT") return "\u{1F1F5}\u{1F1F9}";
  if (code === "CA") return "\u{1F1E8}\u{1F1E6}";
  if (code === "AU") return "\u{1F1E6}\u{1F1FA}";
  return "\u{1F3F4}";
}

function formatBadgeVariant(formato: string): "default" | "secondary" | "outline" | "destructive" {
  if (formato === "carrossel") return "default";
  if (formato === "reels") return "secondary";
  if (formato === "stories") return "outline";
  return "outline";
}

/* ── Component ─────────────────────────────────────────── */

const Inspiracao = () => {
  const { profile, isConfigured } = useDoctor();
  const navigate = useNavigate();

  // Section 1: Discovery
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryResult | null>(null);

  // Selection
  const [selectedHandles, setSelectedHandles] = useState<string[]>([]);

  // Section 2: Analysis
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);

  // Expandable cards
  const [expandedHandles, setExpandedHandles] = useState<Set<string>>(new Set());

  const toggleHandle = (handle: string) => {
    setSelectedHandles((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle]
    );
  };

  const toggleExpanded = (handle: string) => {
    setExpandedHandles((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle);
      else next.add(handle);
      return next;
    });
  };

  /* ── Discover Profiles ─────────────────────────────── */
  const handleDiscover = async () => {
    if (!profile) return;
    setDiscoveryLoading(true);
    setDiscoveryResults(null);
    setSelectedHandles([]);
    setAnalysisResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("discover-inspiration", {
        body: {
          especialidade: profile.especialidade,
          subespecialidade: profile.subespecialidade ?? "",
          pilares: profile.objetivos ?? [],
          pais: "BR+INT",
        },
      });
      if (error) throw error;
      const result = data as DiscoveryResult;
      if (!result.profiles || result.profiles.length === 0) {
        toast.info("Nenhum perfil encontrado. Tente novamente.");
      } else {
        setDiscoveryResults(result);
        toast.success(`${result.profiles.length} perfis encontrados!`);
      }
    } catch (err: any) {
      console.error("Erro ao descobrir perfis:", err);
      toast.error(err.message || "Erro ao descobrir perfis de inspiração.");
    } finally {
      setDiscoveryLoading(false);
    }
  };

  /* ── Analyze Content ───────────────────────────────── */
  const handleAnalyze = async () => {
    if (selectedHandles.length === 0) {
      toast.error("Selecione ao menos um perfil para analisar.");
      return;
    }
    setAnalysisLoading(true);
    setAnalysisResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-inspiration-content", {
        body: {
          handles: selectedHandles,
          especialidade: profile?.especialidade ?? "",
          objetivo: "extrair ideias de conteúdo",
        },
      });
      if (error) throw error;
      const result = data as AnalysisResult;
      setAnalysisResults(result);
      toast.success("Análise concluída!");
    } catch (err: any) {
      console.error("Erro ao analisar conteúdo:", err);
      toast.error(err.message || "Erro ao analisar conteúdo dos perfis.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  /* ── Use idea in Carrossel ─────────────────────────── */
  const handleUseIdea = (idea: ContentIdea) => {
    navigate("/carrossel", {
      state: {
        tese: idea.tese,
        objetivo: idea.por_que_funciona,
      },
    });
  };

  /* ── Derived data ──────────────────────────────────── */
  const brasileiros = discoveryResults?.profiles.filter((p) => p.pais.toUpperCase() === "BR") ?? [];
  const internacionais = discoveryResults?.profiles.filter((p) => p.pais.toUpperCase() !== "BR") ?? [];

  const allIdeas: (ContentIdea & { sourceHandle: string })[] = [];
  if (analysisResults) {
    for (const analise of analysisResults.analises) {
      for (const idea of analise.ideias_inspiradas) {
        allIdeas.push({ ...idea, sourceHandle: analise.handle });
      }
    }
  }

  /* ── Render ────────────────────────────────────────── */

  const renderProfileCard = (p: InspirationProfile) => {
    const isSelected = selectedHandles.includes(p.handle);
    return (
      <Card
        key={p.handle}
        className={`transition-all ${isSelected ? "border-primary ring-1 ring-primary/30" : ""}`}
      >
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="pt-0.5">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleHandle(p.handle)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{p.handle}</span>
                <span className="text-xs text-muted-foreground">{countryFlag(p.pais)}</span>
                <Badge variant="outline" className="text-[10px]">
                  {p.seguidores_estimado}
                </Badge>
                <Badge
                  variant={
                    p.nivel_referencia === "alto"
                      ? "default"
                      : p.nivel_referencia === "medio"
                      ? "secondary"
                      : "outline"
                  }
                  className="text-[10px]"
                >
                  {p.nivel_referencia}
                </Badge>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{p.nome}</p>
              <p className="text-xs text-muted-foreground">{p.estilo_conteudo}</p>
              <p className="text-xs italic text-muted-foreground/80">{p.por_que_inspirar}</p>
              {p.pilares_conteudo?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {p.pilares_conteudo.map((pilar) => (
                    <Badge key={pilar} variant="secondary" className="text-[10px]">
                      {pilar}
                    </Badge>
                  ))}
                </div>
              )}
              {p.formatos_destaque?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.formatos_destaque.map((fmt) => (
                    <Badge key={fmt} variant="outline" className="text-[10px]">
                      {fmt}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAnalysisCard = (analise: ProfileAnalysis) => {
    const isExpanded = expandedHandles.has(analise.handle);
    return (
      <Card key={analise.handle}>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => toggleExpanded(analise.handle)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              {analise.handle}
            </CardTitle>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{analise.estrategia_resumo}</p>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4 pt-0">
            {/* Top topics */}
            <div>
              <p className="text-xs font-semibold mb-1">Tópicos mais engajados</p>
              <div className="flex flex-wrap gap-1">
                {analise.topicos_mais_engajados.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Effective formats */}
            <div>
              <p className="text-xs font-semibold mb-1">Formatos eficazes</p>
              <div className="flex flex-wrap gap-1">
                {analise.formatos_eficazes.map((f) => (
                  <Badge key={f} variant="outline" className="text-[10px]">
                    {f}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Effective hooks */}
            <div>
              <p className="text-xs font-semibold mb-1">Hooks eficazes</p>
              <ul className="space-y-1">
                {analise.hooks_eficazes.map((h, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-primary mt-0.5">•</span>
                    <span>"{h}"</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual style */}
            <div>
              <p className="text-xs font-semibold mb-1">Estilo visual</p>
              <p className="text-xs text-muted-foreground">{analise.estilo_visual}</p>
            </div>

            {/* Content gaps */}
            <div>
              <p className="text-xs font-semibold mb-1">Gaps de conteúdo</p>
              <ul className="space-y-1">
                {analise.gaps_conteudo.map((g, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Inspired ideas */}
            <div>
              <p className="text-xs font-semibold mb-2">Ideias inspiradas</p>
              <div className="space-y-2">
                {analise.ideias_inspiradas.map((idea, i) => (
                  <div
                    key={i}
                    className="p-3 border rounded-lg bg-accent/30 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">{idea.titulo}</p>
                      <Badge variant={formatBadgeVariant(idea.formato)} className="text-[10px] shrink-0">
                        {idea.formato}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{idea.tese}</p>
                    <p className="text-[10px] text-muted-foreground/70 italic">{idea.por_que_funciona}</p>
                    {idea.formato === "carrossel" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseIdea(idea);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Usar no Carrossel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Globe className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Inspiração</h1>
        </div>
        <p className="text-muted-foreground">
          Descubra e analise os melhores perfis médicos do Instagram na sua especialidade.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup antes de descobrir inspirações.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/setup")}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ═══════════ SECTION 1: Discover ═══════════ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Descobrir Perfis de Inspiração</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Especialidade: <span className="font-medium">{profile?.especialidade}</span>
                {profile?.subespecialidade && (
                  <> — {profile.subespecialidade}</>
                )}
              </p>

              <Button onClick={handleDiscover} disabled={discoveryLoading}>
                {discoveryLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Buscando perfis...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Descobrir Perfis
                  </>
                )}
              </Button>

              {discoveryResults && (
                <div className="space-y-6">
                  {/* Insights */}
                  {discoveryResults.insights_gerais && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="py-3">
                        <p className="text-sm flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{discoveryResults.insights_gerais}</span>
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Brazilian profiles */}
                  {brasileiros.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Brasileiros ({brasileiros.length})
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {brasileiros.map(renderProfileCard)}
                      </div>
                    </div>
                  )}

                  {/* International profiles */}
                  {internacionais.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Internacionais ({internacionais.length})
                      </h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        {internacionais.map(renderProfileCard)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ═══════════ SECTION 2: Analyze ═══════════ */}
            {discoveryResults && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Analisar Conteúdo</h2>
                </div>

                {selectedHandles.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {selectedHandles.length} perfil(is) selecionado(s):{" "}
                      <span className="font-medium">{selectedHandles.join(", ")}</span>
                    </p>
                    <Button onClick={handleAnalyze} disabled={analysisLoading}>
                      {analysisLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analisando conteúdo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analisar Conteúdo
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Selecione perfis acima para analisar seu conteúdo.
                  </p>
                )}

                {analysisResults && (
                  <div className="space-y-4">
                    {/* Cross opportunities */}
                    {analysisResults.oportunidades_cruzadas?.length > 0 && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            Oportunidades cruzadas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <ul className="space-y-1">
                            {analysisResults.oportunidades_cruzadas.map((opp, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-primary mt-0.5">•</span>
                                <span>{opp}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Format trends */}
                    {analysisResults.tendencias_formato && (
                      <Card>
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Tendências de formato:</span>{" "}
                            {analysisResults.tendencias_formato}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Per-profile analysis */}
                    <div className="space-y-3">
                      {analysisResults.analises.map(renderAnalysisCard)}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ═══════════ SECTION 3: Ideas for You ═══════════ */}
            {allIdeas.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Ideias para Você</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {allIdeas.length} ideias de conteúdo extraídas das análises.
                </p>

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {allIdeas.map((idea, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4 pb-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">{idea.titulo}</p>
                          <Badge
                            variant={formatBadgeVariant(idea.formato)}
                            className="text-[10px] shrink-0"
                          >
                            {idea.formato}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{idea.tese}</p>
                        <p className="text-[10px] text-muted-foreground/70 italic">
                          {idea.por_que_funciona}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground/50">
                            via {idea.sourceHandle}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => handleUseIdea(idea)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Usar no Carrossel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Inspiracao;
