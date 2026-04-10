import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useDoctor } from "@/contexts/DoctorContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/lib/routes";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowRight,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { ContentIdea, AnalysisResult } from "@/types/inspiration";
import { mapToObjetivoEnum } from "@/types/inspiration";

/* ── Types ─────────────────────────────────────────────── */
type InspirationProfile = Tables<"inspiration_profiles">;

interface DiscoveryCandidate {
  handle: string;
  confidence: "high" | "medium" | "low";
  source: string;
  display_name?: string;
  reason?: string;
  followers_estimate?: string;
}

/* ── Helpers ── */
function normalizeHandle(handle: string): string {
  return handle.replace(/^@/, "").toLowerCase().trim();
}

/* ── Step Indicator ── */
function StepIndicator({ step, currentStep, label, icon }: {
  step: number; currentStep: number; label: string; icon: React.ReactNode;
}) {
  const isActive = step === currentStep;
  const isDone = step < currentStep;
  return (
    <div className={`flex items-center gap-2.5 transition-all ${isActive ? "opacity-100" : isDone ? "opacity-60" : "opacity-30"}`}>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
        isActive ? "bg-accent text-accent-foreground shadow-sm" :
        isDone ? "bg-accent/20 text-accent" :
        "bg-muted text-muted-foreground"
      }`}>
        {isDone ? <CheckCircle2 className="h-4 w-4" /> : icon}
      </div>
      <span className={`text-xs font-medium hidden sm:inline ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
      {step < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground/40 hidden sm:block" />}
    </div>
  );
}

/* ── Profile Card ── */
function ProfileCard({ profile, isSelected, onToggle, onVerify, onReject, onRemove, showCheckbox }: {
  profile: InspirationProfile; isSelected: boolean; onToggle: () => void;
  onVerify?: () => void; onReject?: () => void; onRemove: () => void; showCheckbox: boolean;
}) {
  const statusConfig = {
    verified: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-accent" />, label: "Verificado", variant: "default" as const },
    rejected: { icon: <XCircle className="h-3.5 w-3.5 text-destructive" />, label: "Rejeitado", variant: "destructive" as const },
    failed: { icon: <XCircle className="h-3.5 w-3.5 text-destructive" />, label: "Rejeitado", variant: "destructive" as const },
    needs_review: { icon: <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />, label: "Revisar", variant: "secondary" as const },
    pending: { icon: <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />, label: "Pendente", variant: "secondary" as const },
  };
  const status = statusConfig[profile.verification_status as keyof typeof statusConfig] ?? statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm ${
        isSelected ? "border-accent/30 bg-accent/5" : "border-border/60 hover:border-border"
      }`}
    >
      {showCheckbox && (
        <Checkbox checked={isSelected} onCheckedChange={onToggle} className="shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://instagram.com/${profile.normalized_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sm hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
            {profile.handle}
          </a>
          {status.icon}
          <Badge variant={status.variant} className="text-[9px] font-medium">{status.label}</Badge>
          {profile.display_name && (
            <span className="text-[11px] text-muted-foreground truncate">{profile.display_name}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onVerify && profile.verification_status !== "verified" && (
          <button onClick={onVerify} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-accent/10 transition-colors" title="Verificar">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          </button>
        )}
        {onReject && profile.verification_status !== "rejected" && (
          <button onClick={onReject} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-destructive/10 transition-colors" title="Rejeitar">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          </button>
        )}
        <button onClick={onRemove} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground" title="Remover">
          <XCircle className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Component ─────────────────────────────────────────── */

const Inspiracao = () => {
  const { profile: doctorProfile, isConfigured } = useDoctor();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<InspirationProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [manualInput, setManualInput] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  const [verificationLoading, setVerificationLoading] = useState(false);
  const [selectedForVerification, setSelectedForVerification] = useState<Set<string>>(new Set());

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<Set<string>>(new Set());
  const [expandedHandles, setExpandedHandles] = useState<Set<string>>(new Set());
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Derived
  const pendingProfiles = profiles.filter((p) => p.verification_status === "pending" || p.verification_status === "needs_review");
  const verifiedProfiles = profiles.filter((p) => p.verification_status === "verified");

  // Current stage based on state
  const currentStep = analysisResults ? 3 : verifiedProfiles.length > 0 ? 3 : profiles.length > 0 ? 2 : 1;

  const fetchProfiles = useCallback(async () => {
    if (!user) { setLoadingProfiles(false); return; }
    try {
      const { data, error } = await supabase.from("inspiration_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (!error && data) setProfiles(data);
    } catch { /* empty */ }
    finally { setLoadingProfiles(false); }
  }, [user]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const parseManualHandles = useCallback((): string[] => {
    if (!manualInput.trim()) return [];
    return manualInput.split(/[\n,;]+/).map((h) => h.trim().replace(/^@/, "")).filter((h) => h.length > 0);
  }, [manualInput]);

  const handleAddManual = async () => {
    const handles = parseManualHandles();
    if (handles.length === 0) { toast.error("Digite ao menos um handle."); return; }
    if (!user) { toast.error("Faça login primeiro."); return; }
    let duplicates = 0;
    const newRows = handles.reduce<Array<{ user_id: string; handle: string; discovered_handle: string; normalized_handle: string; source_type: string; verification_status: string; confidence_score: number }>>((acc, h) => {
      const n = normalizeHandle(h);
      if (profiles.some((p) => p.normalized_handle === n)) { duplicates++; return acc; }
      acc.push({ user_id: user.id, handle: `@${n}`, discovered_handle: n, normalized_handle: n, source_type: "manual", verification_status: "pending", confidence_score: 0 });
      return acc;
    }, []);
    if (newRows.length > 0) {
      const { error } = await supabase.from("inspiration_profiles").insert(newRows);
      if (error) { toast.error("Erro ao salvar perfis."); return; }
      await fetchProfiles();
      toast.success(`${newRows.length} perfil(is) adicionado(s).`);
    }
    if (duplicates > 0) toast.info(`${duplicates} já existente(s).`);
    setManualInput("");
  };

  const handleDiscover = async () => {
    if (!doctorProfile) return;
    setDiscoveryLoading(true); setCandidates([]); setSelectedCandidates(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("discover-inspiration", {
        body: { especialidade: doctorProfile.especialidade, subespecialidade: doctorProfile.subespecialidade ?? "", pilares: doctorProfile.diferenciais ?? [] },
      });
      if (error) throw error;
      const result = data as { candidates: DiscoveryCandidate[] };
      if (!result.candidates?.length) { toast.info("Nenhum candidato encontrado."); }
      else {
        const filtered = result.candidates.filter((c) => !profiles.some((p) => p.normalized_handle === normalizeHandle(c.handle)));
        setCandidates(filtered);
        toast.success(`${filtered.length} candidato(s) sugerido(s).`);
      }
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erro na descoberta."); }
    finally { setDiscoveryLoading(false); }
  };

  const handleAcceptCandidates = async () => {
    if (selectedCandidates.size === 0 || !user) return;
    const accepted = candidates.filter((c) => selectedCandidates.has(c.handle));
    const rows = accepted.map((c) => {
      const n = normalizeHandle(c.handle);
      return { user_id: user.id, handle: c.handle, discovered_handle: n, normalized_handle: n, display_name: c.display_name ?? null, followers_estimate: c.followers_estimate ?? null, source_type: "ai_discovery", verification_status: "pending", confidence_score: c.confidence === "high" ? 0.8 : c.confidence === "medium" ? 0.5 : 0.2 };
    });
    if (rows.length > 0) {
      const { error } = await supabase.from("inspiration_profiles").insert(rows);
      if (error) { toast.error("Erro ao salvar."); return; }
      await fetchProfiles();
    }
    setCandidates((prev) => prev.filter((c) => !selectedCandidates.has(c.handle)));
    setSelectedCandidates(new Set());
    toast.success(`${rows.length} perfil(is) aceito(s).`);
  };

  const handleVerify = async () => {
    if (selectedForVerification.size === 0) return;
    setVerificationLoading(true);
    const handlesToVerify = profiles.filter((p) => selectedForVerification.has(p.id)).map((p) => p.handle);
    try {
      const { data, error } = await supabase.functions.invoke("verify-inspiration-profile", { body: { handles: handlesToVerify } });
      if (error) throw error;
      const result = data as { results: Array<{ handle: string; verified: boolean; confidence: number; display_name: string | null }> };
      await Promise.all(result.results.map((v) => {
        const p = profiles.find((pr) => pr.normalized_handle === normalizeHandle(v.handle));
        if (!p) return;
        const status = v.verified ? "verified" : v.confidence >= 0.2 && v.confidence < 0.5 ? "needs_review" : "rejected";
        return supabase.from("inspiration_profiles").update({ verification_status: status, confidence_score: v.confidence, display_name: v.display_name ?? p.display_name }).eq("id", p.id);
      }));
      await fetchProfiles();
      const verified = result.results.filter((r) => r.verified).length;
      toast.success(`${verified}/${result.results.length} verificados.`);
      setSelectedForVerification(new Set());
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erro na verificação."); }
    finally { setVerificationLoading(false); }
  };

  const handleOverrideStatus = async (id: string, status: "verified" | "rejected") => {
    await supabase.from("inspiration_profiles").update({ verification_status: status, confidence_score: 1.0 }).eq("id", id);
    await fetchProfiles();
    toast.success(`Perfil marcado como ${status === "verified" ? "verificado" : "rejeitado"}.`);
  };

  const handleRemoveProfile = async (id: string) => {
    await supabase.from("inspiration_profiles").delete().eq("id", id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAnalyze = async () => {
    if (selectedForAnalysis.size === 0) return;
    setAnalysisLoading(true); setAnalysisError(null);
    const handles = profiles.filter((p) => selectedForAnalysis.has(p.id) && p.verification_status === "verified").map((p) => p.handle);
    if (handles.length === 0) { toast.error("Nenhum perfil verificado selecionado."); setAnalysisLoading(false); return; }
    try {
      const { data, error } = await supabase.functions.invoke("analyze-inspiration-content", {
        body: { handles, especialidade: doctorProfile?.especialidade ?? "", objetivo: "extrair ideias de conteudo para carrossel e reels" },
      });
      if (error) throw error;
      const result = data as AnalysisResult;
      if (!result?.analises || !Array.isArray(result.analises)) throw new Error("Formato inesperado.");
      setAnalysisResults(result);
      toast.success("Análise concluída!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na análise.";
      setAnalysisError(msg); toast.error(msg);
    } finally { setAnalysisLoading(false); }
  };

  const handleUseIdea = (idea: ContentIdea) => {
    const objetivoEnum = mapToObjetivoEnum(idea.por_que_funciona);
    navigate(ROUTES.carrossel, { state: { tese: idea.tese, objetivoEnum, objetivoDetalhado: `${idea.por_que_funciona} (Inspirado em: ${idea.titulo})` } });
  };

  const toggleSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
    setter((prev) => { const next = new Set(prev); if (next.has(value)) next.delete(value); else next.add(value); return next; });
  };

  const allIdeas: (ContentIdea & { sourceHandle: string })[] = [];
  if (analysisResults) {
    for (const a of analysisResults.analises || []) {
      for (const idea of a.ideias_inspiradas || []) allIdeas.push({ ...idea, sourceHandle: a.handle });
    }
  }

  /* ── Render ── */
  return (
    <AppLayout>
      <div className="flex flex-col h-full min-h-0">
        {/* Top Bar */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Globe className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-semibold text-foreground leading-tight">Inspiração</h1>
                <p className="text-[11px] text-muted-foreground leading-tight">Curadoria de referências estratégicas</p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="hidden md:flex items-center gap-1">
              <StepIndicator step={1} currentStep={currentStep} label="Adicionar" icon={<Plus className="h-3.5 w-3.5" />} />
              <StepIndicator step={2} currentStep={currentStep} label="Verificar" icon={<ShieldCheck className="h-3.5 w-3.5" />} />
              <StepIndicator step={3} currentStep={currentStep} label="Analisar" icon={<Eye className="h-3.5 w-3.5" />} />
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {profiles.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{profiles.length}</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-accent" />{verifiedProfiles.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {!user ? (
          <EmptyGate icon={<AlertTriangle className="h-5 w-5" />} title="Faça login" description="Você precisa estar logado para usar a inspiração." />
        ) : !isConfigured ? (
          <EmptyGate
            icon={<Globe className="h-5 w-5" />} title="Configure seu perfil"
            description="O perfil estratégico é necessário para descobrir referências relevantes."
            action={<Button variant="outline" size="sm" onClick={() => navigate(ROUTES.setup)}>Configurar</Button>}
          />
        ) : loadingProfiles ? (
          <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto p-6 space-y-8">

              {/* ═══ STAGE 1: Add Profiles ═══ */}
              <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <SectionHeader icon={<Plus className="h-4 w-4" />} title="Adicionar perfis" step={1} />

                {/* Manual input */}
                <div className="rounded-xl border border-border/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Handles manuais</span>
                  </div>
                  <Textarea
                    placeholder="@draanapaula, @dr.felipebarros…"
                    value={manualInput} onChange={(e) => setManualInput(e.target.value)}
                    rows={2} className="resize-none text-sm border-border/60 rounded-lg"
                  />
                  <div className="flex items-center justify-between">
                    {manualInput.trim() && (
                      <p className="text-[10px] text-muted-foreground">{parseManualHandles().length} detectado(s)</p>
                    )}
                    <Button onClick={handleAddManual} disabled={!manualInput.trim()} size="sm" className="ml-auto text-xs rounded-lg">
                      <Plus className="h-3.5 w-3.5 mr-1" />Adicionar
                    </Button>
                  </div>
                </div>

                {/* AI Discovery */}
                <div className="rounded-xl border border-border/60 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium text-foreground">Descoberta assistida</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">A IA sugere perfis de {doctorProfile?.especialidade} relevantes para você.</p>
                  <Button onClick={handleDiscover} disabled={discoveryLoading} size="sm" variant="outline" className="text-xs rounded-lg">
                    {discoveryLoading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Buscando…</> : <><Search className="h-3.5 w-3.5 mr-1.5" />Descobrir perfis</>}
                  </Button>

                  {/* Candidates */}
                  {candidates.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{candidates.length} candidato(s)</p>
                      {candidates.map((c) => (
                        <motion.div key={c.handle} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${selectedCandidates.has(c.handle) ? "border-accent/30 bg-accent/5" : "border-border/40"}`}
                        >
                          <Checkbox checked={selectedCandidates.has(c.handle)} onCheckedChange={() => toggleSet(setSelectedCandidates, c.handle)} className="mt-0.5" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{c.handle}</span>
                              <Badge variant={c.confidence === "high" ? "default" : "secondary"} className="text-[9px]">
                                {c.confidence === "high" ? "Alta" : c.confidence === "medium" ? "Média" : "Baixa"}
                              </Badge>
                            </div>
                            {c.reason && <p className="text-[11px] text-muted-foreground">{c.reason}</p>}
                          </div>
                        </motion.div>
                      ))}
                      <div className="flex gap-2">
                        <Button onClick={handleAcceptCandidates} disabled={selectedCandidates.size === 0} size="sm" className="text-xs rounded-lg">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aceitar ({selectedCandidates.size})
                        </Button>
                        <button onClick={() => setSelectedCandidates(new Set(candidates.map((c) => c.handle)))} className="text-[11px] text-accent hover:underline">Selecionar todos</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>

              {/* ═══ STAGE 2: Verify Profiles ═══ */}
              {profiles.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                  <SectionHeader icon={<ShieldCheck className="h-4 w-4" />} title="Verificar perfis" step={2} />

                  {pendingProfiles.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button onClick={handleVerify} disabled={verificationLoading || selectedForVerification.size === 0} size="sm" className="text-xs rounded-lg">
                        {verificationLoading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Verificando…</> : <><ShieldCheck className="h-3.5 w-3.5 mr-1.5" />Verificar ({selectedForVerification.size})</>}
                      </Button>
                      <button onClick={() => setSelectedForVerification(new Set(pendingProfiles.map((p) => p.id)))} className="text-[11px] text-accent hover:underline">Selecionar pendentes</button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {profiles.map((p) => (
                      <ProfileCard
                        key={p.id} profile={p}
                        isSelected={selectedForVerification.has(p.id)}
                        onToggle={() => toggleSet(setSelectedForVerification, p.id)}
                        onVerify={() => handleOverrideStatus(p.id, "verified")}
                        onReject={() => handleOverrideStatus(p.id, "rejected")}
                        onRemove={() => handleRemoveProfile(p.id)}
                        showCheckbox={p.verification_status === "pending" || p.verification_status === "needs_review"}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ═══ STAGE 3: Analyze ═══ */}
              {verifiedProfiles.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
                  <SectionHeader icon={<Eye className="h-4 w-4" />} title="Analisar perfis" step={3} />

                  <div className="space-y-1.5">
                    {verifiedProfiles.map((p) => (
                      <motion.div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedForAnalysis.has(p.id) ? "border-accent/30 bg-accent/5" : "border-border/60"}`}>
                        <Checkbox checked={selectedForAnalysis.has(p.id)} onCheckedChange={() => toggleSet(setSelectedForAnalysis, p.id)} />
                        <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium flex-1">{p.handle}</span>
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={handleAnalyze} disabled={analysisLoading || selectedForAnalysis.size === 0} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs">
                      {analysisLoading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Analisando…</> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Analisar ({selectedForAnalysis.size})</>}
                    </Button>
                    <button onClick={() => setSelectedForAnalysis(new Set(verifiedProfiles.map((p) => p.id)))} className="text-[11px] text-accent hover:underline">Selecionar todos</button>
                  </div>

                  {analysisError && !analysisLoading && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive flex-1">{analysisError}</p>
                      <Button variant="ghost" size="sm" onClick={handleAnalyze} className="text-xs shrink-0">Tentar novamente</Button>
                    </div>
                  )}

                  {/* Analysis Results */}
                  {analysisResults && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
                      {/* Cross opportunities */}
                      {analysisResults.oportunidades_cruzadas?.length > 0 && (
                        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-accent" />
                            <span className="text-xs font-semibold text-foreground">Oportunidades cruzadas</span>
                          </div>
                          <ul className="space-y-1">
                            {analysisResults.oportunidades_cruzadas.map((opp, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                                <span className="text-accent mt-0.5 shrink-0">•</span><span>{opp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisResults.tendencias_formato && (
                        <div className="rounded-lg bg-muted/30 p-3">
                          <p className="text-[11px] text-muted-foreground"><span className="font-medium text-foreground">Tendências:</span> {analysisResults.tendencias_formato}</p>
                        </div>
                      )}

                      {/* Per-profile */}
                      {(analysisResults.analises || []).map((analise) => {
                        const isExpanded = expandedHandles.has(analise.handle);
                        return (
                          <div key={analise.handle} className="rounded-xl border border-border/60 overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
                              onClick={() => toggleSet(setExpandedHandles, analise.handle)}
                            >
                              <div className="flex items-center gap-2">
                                <Instagram className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold">{analise.handle}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground max-w-[200px] truncate hidden sm:inline">{analise.estrategia_resumo}</span>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </div>
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">
                                    <p className="text-xs text-muted-foreground leading-relaxed">{analise.estrategia_resumo}</p>

                                    <div className="grid grid-cols-2 gap-3">
                                      <AnalysisSection title="Tópicos engajados" items={analise.topicos_mais_engajados || []} />
                                      <AnalysisSection title="Formatos eficazes" items={analise.formatos_eficazes || []} />
                                    </div>

                                    {(analise.hooks_eficazes || []).length > 0 && (
                                      <div className="space-y-1.5">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Hooks</p>
                                        <div className="space-y-1">
                                          {analise.hooks_eficazes.map((h, i) => (
                                            <p key={i} className="text-[11px] text-foreground/70 italic">&ldquo;{h}&rdquo;</p>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {(analise.gaps_conteudo || []).length > 0 && (
                                      <div className="space-y-1.5">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Gaps</p>
                                        {analise.gaps_conteudo.map((g, i) => (
                                          <p key={i} className="text-[11px] text-muted-foreground">• {g}</p>
                                        ))}
                                      </div>
                                    )}

                                    {/* Ideas */}
                                    {(analise.ideias_inspiradas || []).length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ideias inspiradas</p>
                                        {analise.ideias_inspiradas.map((idea, i) => (
                                          <div key={i} className="rounded-lg border border-accent/15 bg-accent/5 p-3 space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="text-xs font-medium text-foreground">{idea.titulo}</span>
                                              <Badge variant="outline" className="text-[9px] shrink-0">{idea.formato}</Badge>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">{idea.tese}</p>
                                            <div className="flex items-center justify-between pt-0.5">
                                              <p className="text-[10px] text-muted-foreground/60 italic">{idea.por_que_funciona}</p>
                                              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-accent hover:text-accent" onClick={() => handleUseIdea(idea)}>
                                                <ExternalLink className="h-3 w-3 mr-0.5" />Usar
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.section>
              )}

              {/* ═══ Ideas Summary ═══ */}
              {allIdeas.length > 0 && (
                <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4 pb-8">
                  <Separator />
                  <SectionHeader icon={<Lightbulb className="h-4 w-4" />} title={`${allIdeas.length} ideias para você`} />
                  <div className="grid gap-3 md:grid-cols-2">
                    {allIdeas.map((idea, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="group rounded-xl border border-border/60 hover:border-accent/30 hover:shadow-sm transition-all p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium leading-tight text-foreground">{idea.titulo}</p>
                          <Badge variant="outline" className="text-[9px] shrink-0">{idea.formato}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{idea.tese}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground/50">via {idea.sourceHandle}</span>
                          <Button size="sm" className="h-7 text-[11px] px-3 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" onClick={() => handleUseIdea(idea)}>
                            <ExternalLink className="h-3 w-3 mr-1" />Gerar
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

/* ── Shared sub-components ── */

function SectionHeader({ icon, title, step }: { icon: React.ReactNode; title: string; step?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-accent">{icon}</div>
      <h2 className="text-sm font-semibold text-foreground tracking-tight">
        {step ? `${step}. ` : ""}{title}
      </h2>
    </div>
  );
}

function AnalysisSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{item}</span>
        ))}
      </div>
    </div>
  );
}

function EmptyGate({ icon, title, description, action }: {
  icon: React.ReactNode; title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm space-y-3">
        <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">{icon}</div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {action}
      </div>
    </div>
  );
}

export default Inspiracao;
