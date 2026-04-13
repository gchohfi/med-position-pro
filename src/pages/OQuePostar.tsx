import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useDoctor } from "@/contexts/DoctorContext";
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
  const { profile } = useDoctor();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selected, setSelected] = useState(0);
  const [generating, setGenerating] = useState<number | null>(null);

  const generate = async () => {
    if (!user) return;
    setLoading(true);
    setSuggestions(null);
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

  const generateNow = async (s: Suggestion, idx: number) => {
    if (!user || !profile) {
      toast.error("Perfil não configurado.");
      return;
    }
    setGenerating(idx);
    try {
      const { data, error } = await supabase.functions.invoke("agent-carrossel", {
        body: {
          profile: { ...profile, pilares: profile.diferenciais },
          tese: s.thesis || s.title,
          objetivo: s.objetivo || "educar",
          objetivoDetalhado: s.why_now || "",
          action: "generate",
          skill: profile.skill,
          topic: s.title,
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
      // Navigate to Carrossel with ready roteiro
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
          readyRoteiro: data,
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar carrossel. Tente pelo briefing.");
    } finally {
      setGenerating(null);
    }
  };

  const current = suggestions?.[selected];
  const alternatives = suggestions?.filter((_, i) => i !== selected) || [];

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
              className="space-y-8"
            >
              {/* Meta insights — subtle top bar */}
              {meta && (
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-3 w-3" />
                    {meta.total_contents} conteúdos
                  </span>
                  <span className="w-px h-3 bg-border/40" />
                  <span>{meta.calendar_next_14d} agendados</span>
                  {meta.unused_clusters > 0 && (
                    <>
                      <span className="w-px h-3 bg-border/40" />
                      <span className="text-accent/70 font-medium">
                        {meta.unused_clusters} clusters inexplorados
                      </span>
                    </>
                  )}
                  {meta.dominant_preset && (
                    <>
                      <span className="w-px h-3 bg-border/40" />
                      <span className="text-amber-600/70">
                        ⚠ {BENCHMARK_PRESETS[meta.dominant_preset as BenchmarkPresetId]?.label || meta.dominant_preset} dominante
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* ── Recommendation Tabs ── */}
              <div className="flex items-center gap-1.5">
                {suggestions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`relative px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 ${
                      selected === i
                        ? "bg-foreground text-background shadow-md"
                        : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    {i === 0 ? "Principal" : `Alternativa ${i}`}
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
                    {/* Card header */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start gap-5">
                        {/* Preset icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          selected === 0 ? "bg-accent/10" : "bg-muted/60"
                        }`}>
                          {(() => {
                            const Icon = PRESET_ICONS[current.preset] || Sparkles;
                            return <Icon className={`h-5 w-5 ${selected === 0 ? "text-accent" : "text-muted-foreground"}`} />;
                          })()}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Confidence + preset label */}
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

                          {/* Title */}
                          <h2 className="font-heading text-xl sm:text-[22px] text-foreground leading-tight font-semibold mb-2">
                            {current.title}
                          </h2>

                          {/* Thesis */}
                          {current.thesis && (
                            <p className="text-[13px] text-foreground/70 leading-relaxed mb-2 italic">
                              "{current.thesis}"
                            </p>
                          )}

                          {/* Why now */}
                          <p className="text-[12px] text-muted-foreground/50 leading-relaxed">
                            {current.why_now}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Strategic details */}
                    <div className="px-6 pt-5 pb-1">
                      <div className="grid grid-cols-3 gap-px bg-border/20 rounded-xl overflow-hidden">
                        {/* Objetivo */}
                        <div className="bg-background p-3.5 space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">
                            Objetivo
                          </span>
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

                        {/* Visual */}
                        <div className="bg-background p-3.5 space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">
                            Visual
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5 text-accent/60" />
                            <span className="text-[12px] font-semibold text-foreground capitalize">
                              {current.visual_style?.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Risk */}
                        <div className="bg-background p-3.5 space-y-1">
                          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">
                            Repetição
                          </span>
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

                    {/* Bottom: tags + CTA */}
                    <div className="p-6 pt-4 flex items-end justify-between gap-4">
                      <div className="flex flex-wrap gap-1.5">
                        {current.cluster && (
                          <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground/60 font-normal">
                            {current.cluster}
                          </Badge>
                        )}
                        {current.campaign && (
                          <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground/60 font-normal">
                            {current.campaign}
                          </Badge>
                        )}
                        {current.persona && (
                          <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground/60 font-normal">
                            {current.persona}
                          </Badge>
                        )}
                      </div>

                      <Button
                        onClick={() => goToCarousel(current)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-xl h-10 px-5 text-[13px] font-semibold shadow-sm shrink-0"
                      >
                        Criar carrossel
                        <ArrowRight className="h-4 w-4" />
                      </Button>
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
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] text-muted-foreground/30 font-medium">
                                  {OBJETIVO_LABELS[alt.objetivo] || alt.objetivo}
                                </span>
                                <span className="w-px h-2.5 bg-border/30" />
                                <span className="text-[10px] text-muted-foreground/30 capitalize">
                                  {alt.visual_style?.replace(/_/g, " ")}
                                </span>
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
