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
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Target,
  Palette,
  RefreshCw,
  Zap,
  Crown,
  BookOpen,
  Heart,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

const PRESET_ICONS: Record<string, typeof Zap> = {
  impacto_viral: Zap,
  autoridade_premium: Crown,
  educacao_sofisticada: BookOpen,
  consultorio_humano: Heart,
};

const RISK_COLORS: Record<string, string> = {
  baixo: "text-emerald-600 bg-emerald-50",
  medio: "text-amber-600 bg-amber-50",
  alto: "text-rose-600 bg-rose-50",
};

const OBJETIVO_LABELS: Record<string, string> = {
  educar: "Educar",
  salvar: "Salvar",
  comentar: "Comentar",
  converter: "Converter",
};

export default function OQuePostar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selected, setSelected] = useState(0);

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

  const current = suggestions?.[selected];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-foreground tracking-tight">
              O que postar agora
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Motor estratégico que analisa todo o seu contexto e sugere o melhor próximo conteúdo.
            </p>
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {suggestions ? "Atualizar" : "Analisar agora"}
          </Button>
        </div>

        {/* Empty state */}
        {!suggestions && !loading && (
          <Card className="border-dashed border-2 border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-heading text-lg text-foreground mb-2">Pronto para decidir</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Clique em "Analisar agora" para que o motor cruze sua estratégia, calendário, clusters, campanhas e memória para sugerir o melhor conteúdo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-accent animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Analisando contexto estratégico…</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {suggestions && suggestions.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Meta insights bar */}
              {meta && (
                <div className="flex flex-wrap gap-3">
                  {meta.dominant_preset && (
                    <Badge variant="outline" className="text-xs gap-1 text-amber-700 border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-3 w-3" />
                      Preset dominante: {BENCHMARK_PRESETS[meta.dominant_preset as BenchmarkPresetId]?.label || meta.dominant_preset}
                    </Badge>
                  )}
                  {meta.unused_clusters > 0 && (
                    <Badge variant="outline" className="text-xs gap-1 text-blue-700 border-blue-200 bg-blue-50">
                      <TrendingUp className="h-3 w-3" />
                      {meta.unused_clusters} clusters inexplorados
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                    <BarChart3 className="h-3 w-3" />
                    {meta.total_contents} conteúdos · {meta.calendar_next_14d} agendados
                  </Badge>
                </div>
              )}

              {/* Suggestion tabs */}
              <div className="flex gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelected(i)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selected === i
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {i === 0 ? "Recomendação principal" : `Alternativa ${i}`}
                  </button>
                ))}
              </div>

              {/* Selected suggestion */}
              {current && (
                <motion.div
                  key={selected}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`border-2 ${selected === 0 ? "border-accent/30 bg-accent/[0.02]" : "border-border/60"}`}>
                    <CardContent className="p-6 space-y-5">
                      {/* Title + CTA */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <h2 className="font-heading text-xl text-foreground leading-tight">
                            {current.title}
                          </h2>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {current.why_now}
                          </p>
                        </div>
                        <Button
                          onClick={() => goToCarousel(current)}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 shrink-0"
                        >
                          Gerar agora
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <Separator />

                      {/* Strategic details grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Preset */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Preset</span>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = PRESET_ICONS[current.preset] || Sparkles;
                              return <Icon className="h-4 w-4 text-accent" />;
                            })()}
                            <span className="text-sm font-medium text-foreground">
                              {BENCHMARK_PRESETS[current.preset as BenchmarkPresetId]?.label || current.preset}
                            </span>
                          </div>
                        </div>

                        {/* Objetivo */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Objetivo</span>
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium text-foreground">
                              {OBJETIVO_LABELS[current.objetivo] || current.objetivo}
                            </span>
                          </div>
                        </div>

                        {/* Visual */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Visual</span>
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium text-foreground">
                              {current.visual_style?.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Risk */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Repetição</span>
                          <Badge className={`text-xs ${RISK_COLORS[current.risk_repetition] || "bg-muted text-muted-foreground"}`}>
                            {current.risk_repetition}
                          </Badge>
                        </div>
                      </div>

                      {/* Opportunity */}
                      <div className="bg-accent/[0.04] border border-accent/10 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">Oportunidade estratégica</span>
                            <p className="text-sm text-foreground mt-1">{current.strategic_opportunity}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {current.cluster && (
                          <Badge variant="outline" className="text-xs">Cluster: {current.cluster}</Badge>
                        )}
                        {current.campaign && (
                          <Badge variant="outline" className="text-xs">Campanha: {current.campaign}</Badge>
                        )}
                        {current.persona && (
                          <Badge variant="outline" className="text-xs">Persona: {current.persona}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
