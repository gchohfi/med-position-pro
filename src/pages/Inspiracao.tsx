import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  ShieldCheck,
  RefreshCw,
  Eye,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

/* ── Types ─────────────────────────────────────────────── */

type InspirationProfile = Tables<"inspiration_profiles">;

interface DiscoveryCandidate {
  handle: string;
  confidence: "high" | "medium" | "low";
  source: string;
  display_name?: string;
  reason?: string;
  country?: string;
  specialty?: string;
  followers_estimate?: string;
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

function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").toLowerCase().trim();
}

function confidenceBadgeVariant(
  confidence: "high" | "medium" | "low",
): "default" | "secondary" | "outline" {
  if (confidence === "high") return "default";
  if (confidence === "medium") return "secondary";
  return "outline";
}

function verificationIcon(status: string) {
  switch (status) {
    case "verified":
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    case "rejected":
      return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    case "needs_review":
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
    default:
      return <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function verificationLabel(status: string) {
  switch (status) {
    case "verified":
      return "Verificado";
    case "rejected":
      return "Rejeitado";
    case "needs_review":
      return "Revisar";
    default:
      return "Pendente";
  }
}

function formatBadgeVariant(
  formato: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (formato === "carrossel") return "default";
  if (formato === "reels") return "secondary";
  if (formato === "stories") return "outline";
  return "outline";
}

/* ── Component ─────────────────────────────────────────── */

const Inspiracao = () => {
  const { profile: doctorProfile, isConfigured } = useDoctor();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<InspirationProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  // Stage 1: Manual input + Discovery
  const [manualInput, setManualInput] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  // Stage 2: Verification
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [selectedForVerification, setSelectedForVerification] = useState<Set<string>>(new Set());

  // Stage 3: Analysis
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<Set<string>>(new Set());
  const [expandedHandles, setExpandedHandles] = useState<Set<string>>(new Set());

  /* ── Load profiles from Supabase ── */
  const fetchProfiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("inspiration_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setProfiles(data);
    setLoadingProfiles(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  /* ── Parse manual handles ── */
  const parseManualHandles = useCallback((): string[] => {
    if (!manualInput.trim()) return [];
    return manualInput
      .split(/[\n,;]+/)
      .map((h) => h.trim().replace(/^@/, ""))
      .filter((h) => h.length > 0);
  }, [manualInput]);

  /* ── Stage 1: Add manual handles ── */
  const handleAddManual = async () => {
    const handles = parseManualHandles();
    if (handles.length === 0) {
      toast.error("Digite ao menos um handle.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado.");
      return;
    }

    const newRows: Array<{
      user_id: string;
      handle: string;
      discovered_handle: string;
      normalized_handle: string;
      source_type: string;
      verification_status: string;
      confidence_score: number;
    }> = [];
    let duplicates = 0;

    for (const h of handles) {
      const normalized = normalizeHandle(h);
      if (profiles.some((p) => p.normalized_handle === normalized)) {
        duplicates++;
        continue;
      }
      newRows.push({
        user_id: user.id,
        handle: `@${normalized}`,
        discovered_handle: normalized,
        normalized_handle: normalized,
        source_type: "manual",
        verification_status: "pending",
        confidence_score: 0,
      });
    }

    if (newRows.length > 0) {
      const { error } = await supabase.from("inspiration_profiles").insert(newRows);
      if (error) {
        toast.error("Erro ao salvar perfis.");
        console.error(error);
        return;
      }
      await fetchProfiles();
      toast.success(`${newRows.length} perfil(is) adicionado(s).`);
    }
    if (duplicates > 0) {
      toast.info(`${duplicates} perfil(is) já existente(s), ignorados.`);
    }
    setManualInput("");
  };

  /* ── Stage 1: AI Discovery ── */
  const handleDiscover = async () => {
    if (!doctorProfile) return;
    setDiscoveryLoading(true);
    setCandidates([]);
    setSelectedCandidates(new Set());

    try {
      const { data, error } = await supabase.functions.invoke("discover-inspiration", {
        body: {
          especialidade: doctorProfile.especialidade,
          subespecialidade: doctorProfile.subespecialidade ?? "",
          pilares: doctorProfile.objetivos ?? [],
        },
      });
      if (error) throw error;

      const result = data as { candidates: DiscoveryCandidate[] };
      if (!result.candidates || result.candidates.length === 0) {
        toast.info("Nenhum candidato encontrado. Tente adicionar handles manualmente.");
      } else {
        const filtered = result.candidates.filter(
          (c) => !profiles.some((p) => p.normalized_handle === normalizeHandle(c.handle)),
        );
        setCandidates(filtered);
        toast.success(`${filtered.length} candidato(s) sugerido(s) pela IA.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao descobrir perfis.";
      console.error("Erro ao descobrir perfis:", err);
      toast.error(message);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  /* ── Stage 1: Accept selected candidates ── */
  const handleAcceptCandidates = async () => {
    if (selectedCandidates.size === 0) {
      toast.error("Selecione ao menos um candidato.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const accepted = candidates.filter((c) => selectedCandidates.has(c.handle));
    const newRows = accepted.map((c) => {
      const normalized = normalizeHandle(c.handle);
      return {
        user_id: user.id,
        handle: c.handle,
        discovered_handle: normalized,
        normalized_handle: normalized,
        display_name: c.display_name ?? null,
        followers_estimate: c.followers_estimate ?? null,
        source_type: "ai_discovery",
        verification_status: "pending",
        confidence_score: c.confidence === "high" ? 0.8 : c.confidence === "medium" ? 0.5 : 0.2,
      };
    });

    if (newRows.length > 0) {
      const { error } = await supabase.from("inspiration_profiles").insert(newRows);
      if (error) {
        toast.error("Erro ao salvar candidatos.");
        console.error(error);
        return;
      }
      await fetchProfiles();
    }

    setCandidates((prev) => prev.filter((c) => !selectedCandidates.has(c.handle)));
    setSelectedCandidates(new Set());
    toast.success(`${newRows.length} perfil(is) aceito(s).`);
  };

  /* ── Stage 2: Verify selected profiles ── */
  const handleVerify = async () => {
    if (selectedForVerification.size === 0) {
      toast.error("Selecione ao menos um perfil para verificar.");
      return;
    }

    setVerificationLoading(true);
    const handlesToVerify = profiles
      .filter((p) => selectedForVerification.has(p.id))
      .map((p) => p.handle);

    try {
      const { data, error } = await supabase.functions.invoke("verify-inspiration-profile", {
        body: { handles: handlesToVerify },
      });
      if (error) throw error;

      const result = data as {
        results: Array<{
          handle: string;
          verified: boolean;
          method: string;
          confidence: number;
          display_name: string | null;
        }>;
      };

      // Update each profile in DB
      for (const verification of result.results) {
        const profile = profiles.find(
          (p) => p.normalized_handle === normalizeHandle(verification.handle),
        );
        if (!profile) continue;

        let status: string;
        if (verification.verified) {
          status = "verified";
        } else if (verification.confidence >= 0.2 && verification.confidence < 0.5) {
          status = "needs_review";
        } else {
          status = "rejected";
        }

        await supabase
          .from("inspiration_profiles")
          .update({
            verification_status: status,
            confidence_score: verification.confidence,
            display_name: verification.display_name ?? profile.display_name,
          })
          .eq("id", profile.id);
      }

      await fetchProfiles();
      const verified = result.results.filter((r) => r.verified).length;
      toast.success(`Verificação concluída: ${verified}/${result.results.length} verificados.`);
      setSelectedForVerification(new Set());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao verificar perfis.";
      console.error("Erro ao verificar perfis:", err);
      toast.error(message);
    } finally {
      setVerificationLoading(false);
    }
  };

  /* ── Stage 2: Manual override ── */
  const handleOverrideStatus = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase
      .from("inspiration_profiles")
      .update({
        verification_status: status,
        confidence_score: 1.0,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status.");
      return;
    }
    await fetchProfiles();
    toast.success(`Perfil marcado como ${status === "verified" ? "verificado" : "rejeitado"}.`);
  };

  /* ── Stage 2: Remove profile ── */
  const handleRemoveProfile = async (id: string) => {
    const { error } = await supabase.from("inspiration_profiles").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover perfil.");
      return;
    }
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    toast.success("Perfil removido.");
  };

  /* ── Stage 3: Analyze verified profiles ── */
  const handleAnalyze = async () => {
    if (selectedForAnalysis.size === 0) {
      toast.error("Selecione ao menos um perfil verificado para analisar.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisResults(null);

    const handlesToAnalyze = profiles
      .filter((p) => selectedForAnalysis.has(p.id) && p.verification_status === "verified")
      .map((p) => p.handle);

    if (handlesToAnalyze.length === 0) {
      toast.error("Nenhum perfil verificado selecionado.");
      setAnalysisLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("analyze-inspiration-content", {
        body: {
          handles: handlesToAnalyze,
          especialidade: doctorProfile?.especialidade ?? "",
          objetivo: "extrair ideias de conteudo para carrossel e reels",
        },
      });
      if (error) throw error;

      setAnalysisResults(data as AnalysisResult);
      toast.success("Análise concluída!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao analisar conteúdo.";
      console.error("Erro ao analisar conteúdo:", err);
      toast.error(message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  /* ── Navigate to carrossel with idea ── */
  const handleUseIdea = (idea: ContentIdea) => {
    navigate(ROUTES.carrossel, {
      state: {
        tese: idea.tese,
        objetivo: `${idea.por_que_funciona}${idea.titulo ? ` (Inspirado em: ${idea.titulo})` : ""}`,
      },
    });
  };

  /* ── Toggle helpers ── */
  const toggleExpanded = (handle: string) => {
    setExpandedHandles((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle);
      else next.add(handle);
      return next;
    });
  };

  const toggleCandidateSelection = (handle: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(handle)) next.delete(handle);
      else next.add(handle);
      return next;
    });
  };

  const toggleVerificationSelection = (id: string) => {
    setSelectedForVerification((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAnalysisSelection = (id: string) => {
    setSelectedForAnalysis((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Derived data ── */
  const pendingProfiles = profiles.filter((p) => p.verification_status === "pending");
  const needsReviewProfiles = profiles.filter((p) => p.verification_status === "needs_review");
  const verifiedProfiles = profiles.filter((p) => p.verification_status === "verified");
  const rejectedProfiles = profiles.filter((p) => p.verification_status === "rejected");

  const allIdeas: (ContentIdea & { sourceHandle: string })[] = [];
  if (analysisResults) {
    for (const analise of (analysisResults.analises || [])) {
      for (const idea of analise.ideias_inspiradas) {
        allIdeas.push({ ...idea, sourceHandle: analise.handle });
      }
    }
  }

  /* ── Render ── */
  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Globe className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Inspiração Instagram</h1>
        </div>
        <p className="text-muted-foreground">
          Adicione, verifique e analise perfis médicos de referência no Instagram para extrair
          ideias de conteúdo.
        </p>

        {!isConfigured ? (
          <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center gap-4 py-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Perfil não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure seu perfil no Setup antes de usar a inspiração.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate(ROUTES.setup)}>
                Ir para Setup
              </Button>
            </CardContent>
          </Card>
        ) : loadingProfiles ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ═══════════ STAGE 1: Adicionar Perfis ═══════════ */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">1. Adicionar Perfis</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Adicione handles que você já conhece ou use a descoberta assistida da IA.
              </p>

              {/* Manual handles input */}
              <Card>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Adicionar handles manualmente</p>
                  </div>
                  <Textarea
                    placeholder={
                      "Cole aqui handles de perfis que você já segue ou admira.\nExemplos:\n@draanapaula\n@dr.felipebarros\n@derm.doctor\n\nUm por linha, ou separados por vírgula."
                    }
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                  {manualInput.trim() && (
                    <p className="text-xs text-muted-foreground">
                      {parseManualHandles().length} handle(s) detectado(s):{" "}
                      {parseManualHandles().map((h) => `@${h}`).join(", ")}
                    </p>
                  )}
                  <Button onClick={handleAddManual} disabled={!manualInput.trim()} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Perfis
                  </Button>
                </CardContent>
              </Card>

              {/* AI Discovery */}
              <Card>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <p className="text-sm font-medium">Descoberta Assistida</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A IA vai sugerir candidatos para {doctorProfile?.especialidade}
                    {doctorProfile?.subespecialidade && ` (${doctorProfile.subespecialidade})`}.
                    Você decide quais aceitar.
                  </p>
                  <Button onClick={handleDiscover} disabled={discoveryLoading} size="sm" variant="outline">
                    {discoveryLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Buscando candidatos...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Descoberta Assistida
                      </>
                    )}
                  </Button>

                  {/* Candidate results */}
                  {candidates.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Candidatos sugeridos ({candidates.length})
                      </p>
                      <div className="space-y-2">
                        {candidates.map((c) => (
                          <div
                            key={c.handle}
                            className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
                              selectedCandidates.has(c.handle)
                                ? "border-primary bg-primary/5"
                                : "bg-muted/30"
                            }`}
                          >
                            <div className="pt-0.5">
                              <Checkbox
                                checked={selectedCandidates.has(c.handle)}
                                onCheckedChange={() => toggleCandidateSelection(c.handle)}
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold">{c.handle}</span>
                                <Badge
                                  variant={confidenceBadgeVariant(c.confidence)}
                                  className="text-[10px]"
                                >
                                  {c.confidence === "high"
                                    ? "Alta confiança"
                                    : c.confidence === "medium"
                                      ? "Média confiança"
                                      : "Baixa confiança"}
                                </Badge>
                                {c.display_name && (
                                  <span className="text-xs text-muted-foreground">
                                    {c.display_name}
                                  </span>
                                )}
                              </div>
                              {c.reason && (
                                <p className="text-xs text-muted-foreground">{c.reason}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground/60">
                                Fonte: {c.source}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleAcceptCandidates}
                          disabled={selectedCandidates.size === 0}
                          size="sm"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aceitar Selecionados ({selectedCandidates.size})
                        </Button>
                        <button
                          onClick={() =>
                            setSelectedCandidates(new Set(candidates.map((c) => c.handle)))
                          }
                          className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                        >
                          Selecionar todos
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Profile count summary */}
              {profiles.length > 0 && (
                <div className="flex gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{profiles.length} perfis no total</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span>{pendingProfiles.length} pendentes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>{verifiedProfiles.length} verificados</span>
                  </div>
                  {rejectedProfiles.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span>{rejectedProfiles.length} rejeitados</span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ═══════════ STAGE 2: Verificar Perfis ═══════════ */}
            {profiles.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">2. Verificar Perfis</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Verifique se os perfis existem antes de analisar. Você também pode marcar
                  manualmente como verificado ou rejeitado.
                </p>

                {/* Verification action */}
                {(pendingProfiles.length > 0 || needsReviewProfiles.length > 0) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={handleVerify}
                      disabled={verificationLoading || selectedForVerification.size === 0}
                      size="sm"
                    >
                      {verificationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          Verificar Selecionados ({selectedForVerification.size})
                        </>
                      )}
                    </Button>
                    <button
                      onClick={() => {
                        const pendingIds = [...pendingProfiles, ...needsReviewProfiles].map(
                          (p) => p.id,
                        );
                        setSelectedForVerification(new Set(pendingIds));
                      }}
                      className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                    >
                      Selecionar todos pendentes
                    </button>
                  </div>
                )}

                {/* All profiles list */}
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                        selectedForVerification.has(p.id)
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      {(p.verification_status === "pending" ||
                        p.verification_status === "needs_review") && (
                        <Checkbox
                          checked={selectedForVerification.has(p.id)}
                          onCheckedChange={() => toggleVerificationSelection(p.id)}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={`https://instagram.com/${p.normalized_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <Instagram className="h-3 w-3" />
                            {p.handle}
                          </a>
                          {verificationIcon(p.verification_status)}
                          <Badge
                            variant={
                              p.verification_status === "verified"
                                ? "default"
                                : p.verification_status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {verificationLabel(p.verification_status)}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {p.source_type === "manual" ? "manual" : "IA"}
                          </Badge>
                          {p.display_name && (
                            <span className="text-xs text-muted-foreground truncate">
                              {p.display_name}
                            </span>
                          )}
                          {p.confidence_score !== null && p.confidence_score > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              ({Math.round(p.confidence_score * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {p.verification_status !== "verified" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2 text-green-600"
                            onClick={() => handleOverrideStatus(p.id, "verified")}
                            title="Marcar como verificado"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </Button>
                        )}
                        {p.verification_status !== "rejected" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2 text-destructive"
                            onClick={() => handleOverrideStatus(p.id, "rejected")}
                            title="Marcar como rejeitado"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-2 text-muted-foreground"
                          onClick={() => handleRemoveProfile(p.id)}
                          title="Remover perfil"
                        >
                          &times;
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══════════ STAGE 3: Analisar Perfis ═══════════ */}
            {verifiedProfiles.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">3. Analisar Perfis</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Selecione perfis verificados para a IA pesquisar e analisar seus conteúdos.
                </p>

                {/* Verified profiles for analysis */}
                <div className="space-y-2">
                  {verifiedProfiles.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                        selectedForAnalysis.has(p.id)
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedForAnalysis.has(p.id)}
                        onCheckedChange={() => toggleAnalysisSelection(p.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Instagram className="h-3 w-3" />
                          <span className="text-sm font-semibold">{p.handle}</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          {p.display_name && (
                            <span className="text-xs text-muted-foreground">
                              {p.display_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={handleAnalyze}
                    disabled={analysisLoading || selectedForAnalysis.size === 0}
                    size="lg"
                  >
                    {analysisLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando conteúdo...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analisar Conteúdo ({selectedForAnalysis.size})
                      </>
                    )}
                  </Button>
                  <button
                    onClick={() =>
                      setSelectedForAnalysis(new Set(verifiedProfiles.map((p) => p.id)))
                    }
                    className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                  >
                    Selecionar todos
                  </button>
                </div>

                {/* Analysis results */}
                {analysisResults && (
                  <div className="space-y-4">
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
                              <li
                                key={i}
                                className="text-xs text-muted-foreground flex items-start gap-1"
                              >
                                <span className="text-primary mt-0.5">&bull;</span>
                                <span>{opp}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

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
                      {(analysisResults.analises || []).map((analise) => {
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
                              <p className="text-xs text-muted-foreground mt-1">
                                {analise.estrategia_resumo}
                              </p>
                            </CardHeader>
                            {isExpanded && (
                              <CardContent className="space-y-4 pt-0">
                                <div>
                                  <p className="text-xs font-semibold mb-1">
                                    Tópicos mais engajados
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {analise.topicos_mais_engajados.map((t) => (
                                      <Badge
                                        key={t}
                                        variant="secondary"
                                        className="text-[10px]"
                                      >
                                        {t}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold mb-1">Formatos eficazes</p>
                                  <div className="flex flex-wrap gap-1">
                                    {analise.formatos_eficazes.map((f) => (
                                      <Badge
                                        key={f}
                                        variant="outline"
                                        className="text-[10px]"
                                      >
                                        {f}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold mb-1">Hooks eficazes</p>
                                  <ul className="space-y-1">
                                    {analise.hooks_eficazes.map((h, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-muted-foreground flex items-start gap-1"
                                      >
                                        <span className="text-primary mt-0.5">&bull;</span>
                                        <span>&ldquo;{h}&rdquo;</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold mb-1">Estilo visual</p>
                                  <p className="text-xs text-muted-foreground">
                                    {analise.estilo_visual}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold mb-1">Gaps de conteúdo</p>
                                  <ul className="space-y-1">
                                    {analise.gaps_conteudo.map((g, i) => (
                                      <li
                                        key={i}
                                        className="text-xs text-muted-foreground flex items-start gap-1"
                                      >
                                        <span className="text-amber-600 mt-0.5">&bull;</span>
                                        <span>{g}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
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
                                          <Badge
                                            variant={formatBadgeVariant(idea.formato)}
                                            className="text-[10px] shrink-0"
                                          >
                                            {idea.formato}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {idea.tese}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground/70 italic">
                                          {idea.por_que_funciona}
                                        </p>
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
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ═══════════ Ideas Summary ═══════════ */}
            {allIdeas.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Ideias para Você</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {allIdeas.length} ideias de conteúdo extraídas. Clique em &ldquo;Usar no
                  Carrossel&rdquo; para gerar automaticamente.
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
                            variant="default"
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={() => handleUseIdea(idea)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Gerar Carrossel
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
