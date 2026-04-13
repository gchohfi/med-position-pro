import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ROUTES } from "@/lib/routes";
import { mapToObjetivoEnum } from "@/types/inspiration";
import { BENCHMARK_PRESETS, type BenchmarkPresetId } from "@/lib/benchmark-presets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  TrendingUp,
  Target,
  Palette,
  Zap,
  Crown,
  BookOpen,
  Heart,
  BarChart3,
  Lightbulb,
  Shield,
  MessageCircle,
  Crosshair,
  CalendarPlus,
  Bookmark,
  Megaphone,
  Layers,
  CalendarX,
  Users,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Types ─────────────────────────────────────────── */

interface Suggestion {
  title: string;
  thesis: string;
  why_now: string;
  preset: string;
  objetivo: string;
  visual_style: string;
  risk_repetition: string;
  strategic_opportunity: string;
  cluster?: string | null;
  campaign?: string | null;
  persona?: string | null;
  hook_angle?: string | null;
  cta_direction?: string | null;
  narrative_rhythm?: string | null;
  confidence?: string | null;
  recommendation_reasoning?: string | null;
}

interface Meta {
  total_contents: number;
  unused_clusters: number;
  dominant_preset: string | null;
  active_campaigns: number;
  calendar_next_14d: number;
}

/* ── Constants ─────────────────────────────────────── */

const PRESET_ICONS: Record<string, typeof Zap> = {
  impacto_viral: Zap,
  autoridade_premium: Crown,
  educacao_sofisticada: BookOpen,
  consultorio_humano: Heart,
};

const CONFIDENCE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  alta: { bg: "bg-emerald-500/[0.06]", text: "text-emerald-700", dot: "bg-emerald-500" },
  media: { bg: "bg-amber-500/[0.06]", text: "text-amber-700", dot: "bg-amber-500" },
  baixa: { bg: "bg-rose-500/[0.06]", text: "text-rose-700", dot: "bg-rose-500" },
};

const OBJETIVO_ICONS: Record<string, typeof Target> = {
  educar: BookOpen,
  salvar: Shield,
  comentar: MessageCircle,
  conversao: Target,
};

const OBJETIVO_LABELS: Record<string, string> = {
  educar: "Educar",
  salvar: "Salvar",
  comentar: "Comentar",
  conversao: "Conversão",
};

/* ── Component ─────────────────────────────────────── */

export default function OQuePostar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selected, setSelected] = useState(0);
  const [savingCalendar, setSavingCalendar] = useState<number | null>(null);
  const [savingIdea, setSavingIdea] = useState<number | null>(null);
  const [savedCalendar, setSavedCalendar] = useState<Set<number>>(new Set());
  const [savedIdea, setSavedIdea] = useState<Set<number>>(new Set());

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    setSuggestions(null);
    setSavedCalendar(new Set());
    setSavedIdea(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("generate-next-content", {});
      if (error) throw error;
      setSuggestions(data.suggestions || []);
      setMeta(data.meta || null);
      setSelected(0);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar recomendação");
    } finally {
      setLoading(false);
    }
  };

  const goToCarousel = (s: Suggestion) => {
    navigate(ROUTES.carrossel, {
      state: {
        tema: s.title || "",
        tese: s.thesis || s.strategic_opportunity || "",
        preset: s.preset || "",
        objetivoEnum: mapToObjetivoEnum(s.objetivo || ""),
        objetivoDetalhado: s.why_now || "",
        visualStyle: s.visual_style || "",
        cluster: s.cluster || null,
        campaign: s.campaign || null,
        persona: s.persona || null,
        source: "o_que_postar",
        why_now: s.why_now || "",
        strategic_opportunity: s.strategic_opportunity || "",
        risk_repetition: s.risk_repetition || "",
        hook_angle: s.hook_angle || null,
        cta_direction: s.cta_direction || null,
        narrative_rhythm: s.narrative_rhythm || null,
        confidence: s.confidence || null,
        recommendation_reasoning: s.recommendation_reasoning || null,
      },
    });
  };

  const addToCalendar = async (s: Suggestion, idx: number) => {
    if (!user) return;
    setSavingCalendar(idx);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];

      const { error } = await supabase.from("calendar_items").insert({
        user_id: user.id,
        title: s.title,
        content_type: "carrossel",
        date: dateStr,
        status: "planejado",
        benchmark_preset: s.preset || null,
        objetivo: s.objetivo || null,
        thesis: s.thesis || null,
        visual_direction: s.visual_style || null,
        strategic_objective: s.strategic_opportunity || null,
      });
      if (error) throw error;
      setSavedCalendar((prev) => new Set(prev).add(idx));
      toast.success("Adicionado ao calendário");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar ao calendário");
    } finally {
      setSavingCalendar(null);
    }
  };

  const saveAsIdea = async (s: Suggestion, idx: number) => {
    if (!user) return;
    setSavingIdea(idx);
    try {
      const { error } = await supabase.from("content_outputs").insert({
        user_id: user.id,
        content_type: "ideia",
        title: s.title,
        strategic_input: {
          tema: s.title,
          tese: s.thesis,
          preset: s.preset,
          objetivo: s.objetivo,
          visual_style: s.visual_style,
          cluster: s.cluster,
          campaign: s.campaign,
          persona: s.persona,
          why_now: s.why_now,
          strategic_opportunity: s.strategic_opportunity,
          hook_angle: s.hook_angle,
          cta_direction: s.cta_direction,
          narrative_rhythm: s.narrative_rhythm,
          recommendation_source: "o_que_postar",
        },
        generated_content: { status: "idea_saved", thesis: s.thesis },
      });
      if (error) throw error;
      setSavedIdea((prev) => new Set(prev).add(idx));
      toast.success("Salvo como ideia na biblioteca");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar ideia");
    } finally {
      setSavingIdea(null);
    }
  };

  const current = suggestions?.[selected];
  const alternatives = suggestions?.filter((_, i) => i !== selected) || [];

  // Derived context signals
  const hasActiveCampaigns = meta && meta.active_campaigns > 0;
  const hasUnusedClusters = meta && meta.unused_clusters > 0;
  const calendarSparse = meta && meta.calendar_next_14d < 3;
  const currentIsCampaign = !!current?.campaign;
  const currentIsUnusedCluster = !!current?.cluster && hasUnusedClusters;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* ═══ Header ═══ */}
        <div className="flex items-end justify-between gap-6 mb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-1.5 h-6 rounded-full bg-accent" />
              <h1 className="font-heading text-2xl sm:text-[28px] text-foreground tracking-tight font-semibold">
                O que postar agora
              </h1>
            </div>
            <p className="text-[13px] text-muted-foreground/60 pl-4 max-w-lg">
              Motor estratégico que cruza contexto, calendário e memória para recomendar o melhor próximo conteúdo.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-xl shadow-sm h-11 px-6 text-[13px] font-semibold shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {suggestions ? "Atualizar análise" : "Analisar agora"}
          </Button>
        </div>

        {/* ═══ Empty State ═══ */}
        {!suggestions && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-accent/[0.06] flex items-center justify-center mb-6 relative">
              <Sparkles className="h-9 w-9 text-accent/70" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
            </div>
            <h3 className="font-heading text-lg text-foreground mb-2 font-semibold">
              Pronto para decidir
            </h3>
            <p className="text-[13px] text-muted-foreground/50 max-w-md leading-relaxed">
              Clique em <span className="text-foreground/70 font-medium">"Analisar agora"</span> para que o motor cruze sua estratégia, calendário, clusters, campanhas e memória.
            </p>
          </motion.div>
        )}

        {/* ═══ Loading State ═══ */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/[0.06] flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-accent animate-spin" />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent/40"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground/50 font-medium">
              Analisando contexto estratégico…
            </p>
            <p className="text-[11px] text-muted-foreground/30 mt-1">
              Cruzando calendário, clusters e memória
            </p>
          </motion.div>
        )}

        {/* ═══ Results ═══ */}
        <AnimatePresence mode="wait">
          {suggestions && suggestions.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* ── Context Signals Bar ── */}
              {meta && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Base stats */}
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
                    <BarChart3 className="h-3 w-3" />
                    {meta.total_contents} conteúdos
                  </span>

                  {/* Calendar signal */}
                  {calendarSparse ? (
                    <Badge variant="outline" className="text-[10px] gap-1 border-amber-300/40 text-amber-700/70 bg-amber-500/[0.04] font-medium">
                      <CalendarX className="h-3 w-3" />
                      Calendário com lacunas ({meta.calendar_next_14d}/14 dias)
                    </Badge>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                      <span className="w-px h-3 bg-border/40" />
                      {meta.calendar_next_14d} agendados
                    </span>
                  )}

                  {/* Active campaigns */}
                  {hasActiveCampaigns && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-purple-300/40 text-purple-700/70 bg-purple-500/[0.04] font-medium">
                      <Megaphone className="h-3 w-3" />
                      {meta.active_campaigns} campanha{meta.active_campaigns > 1 ? "s" : ""} ativa{meta.active_campaigns > 1 ? "s" : ""}
                    </Badge>
                  )}

                  {/* Unused clusters */}
                  {hasUnusedClusters && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-accent/30 text-accent/70 bg-accent/[0.04] font-medium">
                      <Layers className="h-3 w-3" />
                      {meta.unused_clusters} cluster{meta.unused_clusters > 1 ? "s" : ""} inexplorado{meta.unused_clusters > 1 ? "s" : ""}
                    </Badge>
                  )}

                  {/* Dominant preset warning */}
                  {meta.dominant_preset && (
                    <Badge variant="outline" className="text-[10px] gap-1 border-amber-300/40 text-amber-700/70 bg-amber-500/[0.04] font-medium">
                      ⚠ {BENCHMARK_PRESETS[meta.dominant_preset as BenchmarkPresetId]?.label || meta.dominant_preset} dominante
                    </Badge>
                  )}
                </div>
              )}

              {/* ── Recommendation Tabs ── */}
              <div className="flex items-center gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`relative px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                      selected === i
                        ? "bg-foreground text-background shadow-md"
                        : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {i === 0 ? "Principal" : `Alternativa ${i}`}
                      {s.campaign && <Megaphone className="h-3 w-3 opacity-60" />}
                      {s.cluster && <Layers className="h-3 w-3 opacity-60" />}
                    </span>
                    {i === 0 && selected === 0 && (
                      <motion.div
                        layoutId="tab-dot"
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* ── Main Recommendation Card ── */}
              {current && (
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className={`rounded-2xl border overflow-hidden ${
                    selected === 0
                      ? "border-accent/20 bg-gradient-to-b from-accent/[0.03] to-transparent"
                      : "border-border/40 bg-card/50"
                  }`}>

                    {/* Campaign/cluster context banner */}
                    {(currentIsCampaign || currentIsUnusedCluster || calendarSparse) && (
                      <div className="px-6 pt-4 flex flex-wrap gap-2">
                        {currentIsCampaign && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/[0.06] border border-purple-200/30">
                            <Megaphone className="h-3 w-3 text-purple-600/70" />
                            <span className="text-[11px] text-purple-700/80 font-medium">
                              Campanha: {current.campaign}
                            </span>
                          </div>
                        )}
                        {currentIsUnusedCluster && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/[0.06] border border-accent/20">
                            <Layers className="h-3 w-3 text-accent/70" />
                            <span className="text-[11px] text-accent/80 font-medium">
                              Cluster inexplorado: {current.cluster}
                            </span>
                          </div>
                        )}
                        {calendarSparse && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/[0.06] border border-amber-200/30">
                            <CalendarX className="h-3 w-3 text-amber-600/70" />
                            <span className="text-[11px] text-amber-700/80 font-medium">
                              Calendário com espaços livres
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          selected === 0 ? "bg-accent/10" : "bg-muted/60"
                        }`}>
                          {(() => {
                            const Icon = PRESET_ICONS[current.preset] || Sparkles;
                            return <Icon className={`h-5 w-5 ${selected === 0 ? "text-accent" : "text-muted-foreground"}`} />;
                          })()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {current.confidence && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                CONFIDENCE_STYLES[current.confidence]?.bg || "bg-muted"
                              } ${CONFIDENCE_STYLES[current.confidence]?.text || "text-muted-foreground"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  CONFIDENCE_STYLES[current.confidence]?.dot || "bg-muted-foreground"
                                }`} />
                                Confiança {current.confidence}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground/40 font-medium">
                              {BENCHMARK_PRESETS[current.preset as BenchmarkPresetId]?.label || current.preset}
                            </span>
                          </div>

                          <h2 className="font-heading text-xl sm:text-[22px] text-foreground leading-tight font-semibold mb-2">
                            {current.title}
                          </h2>

                          {current.thesis && (
                            <p className="text-[13px] text-foreground/70 leading-relaxed mb-2 italic">
                              "{current.thesis}"
                            </p>
                          )}

                          <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
                            {current.why_now}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Strategic details grid */}
                    <div className="px-6 pt-5 pb-1">
                      <div className="grid grid-cols-3 gap-px bg-border/20 rounded-xl overflow-hidden">
                        <div className="bg-background p-3.5 space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">Objetivo</span>
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const ObjIcon = OBJETIVO_ICONS[current.objetivo] || Target;
                              return <ObjIcon className="h-3.5 w-3.5 text-accent/60" />;
                            })()}
                            <span className="text-[12px] font-semibold text-foreground">
                              {OBJETIVO_LABELS[current.objetivo] || current.objetivo}
                            </span>
                          </div>
                        </div>
                        <div className="bg-background p-3.5 space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">Visual</span>
                          <div className="flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5 text-accent/60" />
                            <span className="text-[12px] font-semibold text-foreground capitalize">
                              {current.visual_style?.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div className="bg-background p-3.5 space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">Repetição</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              current.risk_repetition === "baixo" ? "bg-emerald-500" :
                              current.risk_repetition === "alto" ? "bg-rose-500" : "bg-amber-500"
                            }`} />
                            <span className="text-[12px] font-semibold text-foreground capitalize">
                              {current.risk_repetition}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Editorial direction */}
                    {(current.hook_angle || current.narrative_rhythm || current.cta_direction) && (
                      <div className="px-6 pt-4">
                        <div className="bg-muted/20 rounded-xl p-4 space-y-2">
                          {current.hook_angle && (
                            <div className="flex items-start gap-2.5">
                              <Crosshair className="h-3 w-3 text-accent/40 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">Hook</span>
                                <p className="text-[12px] text-foreground/60 mt-0.5">{current.hook_angle}</p>
                              </div>
                            </div>
                          )}
                          {current.narrative_rhythm && (
                            <div className="flex items-start gap-2.5">
                              <TrendingUp className="h-3 w-3 text-accent/40 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">Ritmo</span>
                                <p className="text-[12px] text-foreground/60 mt-0.5">{current.narrative_rhythm}</p>
                              </div>
                            </div>
                          )}
                          {current.cta_direction && (
                            <div className="flex items-start gap-2.5">
                              <ArrowRight className="h-3 w-3 text-accent/40 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">CTA sugerido</span>
                                <p className="text-[12px] text-foreground/60 mt-0.5">{current.cta_direction}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Opportunity block */}
                    {current.strategic_opportunity && (
                      <div className="px-6 pt-4">
                        <div className="rounded-xl bg-accent/[0.04] border border-accent/10 p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                              <Lightbulb className="h-3.5 w-3.5 text-accent" />
                            </div>
                            <div>
                              <span className="text-[9px] uppercase tracking-[0.15em] text-accent/70 font-bold">
                                Oportunidade estratégica
                              </span>
                              <p className="text-[13px] text-foreground/80 mt-1 leading-relaxed">
                                {current.strategic_opportunity}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reasoning */}
                    {current.recommendation_reasoning && (
                      <div className="px-6 pt-3">
                        <p className="text-[11px] text-muted-foreground/40 italic leading-relaxed border-l-2 border-accent/15 pl-3">
                          {current.recommendation_reasoning}
                        </p>
                      </div>
                    )}

                    {/* Bottom: context tags + actions */}
                    <div className="p-6 pt-4">
                      {/* Context tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {current.cluster && !currentIsUnusedCluster && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-border/30 text-muted-foreground/60 font-normal">
                            <Layers className="h-2.5 w-2.5" /> {current.cluster}
                          </Badge>
                        )}
                        {current.campaign && !currentIsCampaign && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-border/30 text-muted-foreground/60 font-normal">
                            <Megaphone className="h-2.5 w-2.5" /> {current.campaign}
                          </Badge>
                        )}
                        {current.persona && (
                          <Badge variant="outline" className="text-[10px] gap-1 border-border/30 text-muted-foreground/60 font-normal">
                            <Users className="h-2.5 w-2.5" /> {current.persona}
                          </Badge>
                        )}
                      </div>

                      {/* Quick actions row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          onClick={() => goToCarousel(current)}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-xl h-10 px-5 text-[13px] font-semibold shadow-sm"
                        >
                          Criar carrossel
                          <ArrowRight className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={savingCalendar === selected || savedCalendar.has(selected)}
                          onClick={() => addToCalendar(current, selected)}
                          className="h-9 gap-1.5 rounded-xl text-[12px] border-border/40 text-muted-foreground hover:text-foreground hover:border-accent/30"
                        >
                          {savedCalendar.has(selected) ? (
                            <><Check className="h-3.5 w-3.5 text-emerald-600" /> Agendado</>
                          ) : savingCalendar === selected ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</>
                          ) : (
                            <><CalendarPlus className="h-3.5 w-3.5" /> Adicionar ao calendário</>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={savingIdea === selected || savedIdea.has(selected)}
                          onClick={() => saveAsIdea(current, selected)}
                          className="h-9 gap-1.5 rounded-xl text-[12px] border-border/40 text-muted-foreground hover:text-foreground hover:border-accent/30"
                        >
                          {savedIdea.has(selected) ? (
                            <><Check className="h-3.5 w-3.5 text-emerald-600" /> Salvo</>
                          ) : savingIdea === selected ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…</>
                          ) : (
                            <><Bookmark className="h-3.5 w-3.5" /> Salvar como ideia</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── Alternatives (compact) ── */}
              {alternatives.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold pl-1">
                    Outras opções
                  </span>
                  <div className="grid gap-3 md:grid-cols-2">
                    {alternatives.map((alt, i) => {
                      const altIndex = suggestions!.indexOf(alt);
                      const AltIcon = PRESET_ICONS[alt.preset] || Sparkles;
                      return (
                        <motion.button
                          key={altIndex}
                          onClick={() => setSelected(altIndex)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="text-left group rounded-xl border border-border/30 hover:border-accent/20 p-4 transition-all duration-200 hover:shadow-sm bg-card/30 hover:bg-accent/[0.02]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted/40 group-hover:bg-accent/10 flex items-center justify-center shrink-0 transition-colors">
                              <AltIcon className="h-4 w-4 text-muted-foreground/50 group-hover:text-accent transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[13px] font-semibold text-foreground/80 group-hover:text-foreground leading-snug line-clamp-2 transition-colors">
                                {alt.title}
                              </h4>
                              {alt.thesis && (
                                <p className="text-[11px] text-muted-foreground/40 mt-1 line-clamp-1 italic">
                                  {alt.thesis}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-[10px] text-muted-foreground/30 font-medium">
                                  {OBJETIVO_LABELS[alt.objetivo] || alt.objetivo}
                                </span>
                                <span className="w-px h-2.5 bg-border/30" />
                                <span className="text-[10px] text-muted-foreground/30 capitalize">
                                  {alt.visual_style?.replace(/_/g, " ")}
                                </span>
                                {alt.campaign && (
                                  <>
                                    <span className="w-px h-2.5 bg-border/30" />
                                    <span className="flex items-center gap-1 text-[10px] text-purple-600/60">
                                      <Megaphone className="h-2.5 w-2.5" /> {alt.campaign}
                                    </span>
                                  </>
                                )}
                                {alt.cluster && (
                                  <>
                                    <span className="w-px h-2.5 bg-border/30" />
                                    <span className="flex items-center gap-1 text-[10px] text-accent/50">
                                      <Layers className="h-2.5 w-2.5" />
                                    </span>
                                  </>
                                )}
                                {alt.confidence && (
                                  <>
                                    <span className="w-px h-2.5 bg-border/30" />
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      CONFIDENCE_STYLES[alt.confidence]?.dot || "bg-muted-foreground"
                                    }`} />
                                  </>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-accent/50 mt-1 transition-colors shrink-0" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
