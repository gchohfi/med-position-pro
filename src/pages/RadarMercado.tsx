import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { logStrategicEvent, STRATEGIC_EVENTS } from "@/lib/strategic-events";
import {
  Radar,
  AlertTriangle,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Target,
  BookOpen,
  Calendar,
  PenTool,
  Lightbulb,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45 },
  }),
};

interface SaturationItem {
  pattern: string;
  why_it_matters: string;
  recommendation: string;
}

interface OpportunityItem {
  territory: string;
  why_it_matters: string;
  recommendation: string;
}

interface AlertItem {
  title: string;
  description: string;
  urgency: "alta" | "media" | "baixa";
}

interface RecommendationItem {
  title: string;
  insight: string;
  action: string;
  module: "estrategia" | "series" | "calendario" | "producao";
}

interface SignalItem {
  title: string;
  description: string;
  source_context: string;
  relevance: "alta" | "media" | "baixa";
}

interface RadarData {
  segment_summary: string | null;
  signals: SignalItem[];
  saturation: SaturationItem[];
  opportunities: OpportunityItem[];
  alerts: AlertItem[];
  recommendations: RecommendationItem[];
  citations: string[];
  updated_at: string | null;
}

const MODULE_ICONS: Record<string, any> = {
  estrategia: Lightbulb,
  series: BookOpen,
  calendario: Calendar,
  producao: PenTool,
};

const MODULE_PATHS: Record<string, string> = {
  estrategia: "/estrategia-ia",
  series: "/series",
  calendario: "/calendario",
  producao: "/producao",
};

const MODULE_LABELS: Record<string, string> = {
  estrategia: "Estratégia",
  series: "Séries",
  calendario: "Calendário",
  producao: "Criação",
};

const URGENCY_STYLES: Record<string, string> = {
  alta: "bg-red-500/10 text-red-600 border-red-500/20",
  media: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  baixa: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const LOADING_MESSAGES = [
  "Pesquisando tendências reais do seu segmento…",
  "Analisando concorrentes e padrões de conteúdo…",
  "Identificando oportunidades de diferenciação…",
  "Traduzindo sinais de mercado em direção estratégica…",
];

const RadarMercado = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [data, setData] = useState<RadarData>({
    segment_summary: null,
    signals: [],
    saturation: [],
    opportunities: [],
    alerts: [],
    recommendations: [],
    citations: [],
    updated_at: null,
  });

  useEffect(() => {
    if (user) loadRadar();
  }, [user]);

  useEffect(() => {
    if (!generating) { setLoadingMsgIndex(0); return; }
    const interval = setInterval(() => {
      setLoadingMsgIndex((p) => (p + 1) % LOADING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [generating]);

  const loadRadar = async () => {
    setLoading(true);
    const { data: radar } = await supabase
      .from("market_radar")
      .select("*")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (radar) {
      const signalsData = (radar.signals as any) || {};
      setData({
        segment_summary: radar.segment_summary,
        signals: (signalsData.market_signals as unknown as SignalItem[]) || [],
        saturation: (radar.saturation as unknown as SaturationItem[]) || [],
        opportunities: (radar.opportunities as unknown as OpportunityItem[]) || [],
        alerts: (radar.alerts as unknown as AlertItem[]) || [],
        recommendations: (radar.recommendations as unknown as RecommendationItem[]) || [],
        citations: (signalsData.citations as string[]) || [],
        updated_at: radar.updated_at,
      });
    }
    setLoading(false);
  };

  const generateRadar = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token ?? supabaseKey;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-radar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify({}),
        }
      );

      if (!res.ok) throw new Error("Erro na geração");
      const result = await res.json();

      if (result.radar) {
        setData({
          segment_summary: result.radar.segment_summary,
          signals: result.radar.signals || [],
          saturation: result.radar.saturation || [],
          opportunities: result.radar.opportunities || [],
          alerts: result.radar.alerts || [],
          recommendations: result.radar.recommendations || [],
          citations: result.radar.citations || [],
          updated_at: new Date().toISOString(),
        });
        logStrategicEvent(STRATEGIC_EVENTS.RADAR_REFRESHED, "radar");
        toast.success("Radar de mercado atualizado com base no seu segmento.");
      }
    } catch {
      toast.error("Erro ao gerar leitura de mercado. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const hasData = !!data.segment_summary;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 md:p-10 max-w-5xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-6">
                <Skeleton className="h-4 w-40 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground mb-1">
                Radar de Mercado
              </h1>
              <p className="text-muted-foreground">
                Acompanhe sinais do seu segmento e identifique o que reforça ou enfraquece sua diferenciação.
              </p>
            </div>
            <Button
              onClick={generateRadar}
              disabled={generating}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {generating ? "Analisando…" : hasData ? "Atualizar radar" : "Gerar leitura"}
            </Button>
          </div>
          {data.updated_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Última leitura: {new Date(data.updated_at).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </motion.div>

        {/* Generating state */}
        {generating && (
          <motion.div
            className="bg-accent/5 rounded-2xl border border-accent/15 p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-8 w-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </motion.div>
        )}

        {/* Empty state */}
        {!hasData && !generating && (
          <motion.div
            className="flex flex-col items-center py-20"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Radar className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading text-lg text-foreground mb-1">
              Radar estratégico em espera
            </h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
              O radar estratégico começa a ganhar precisão conforme o MEDSHIFT entende seu posicionamento e seu território.
            </p>
            <Button
              onClick={generateRadar}
              className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar primeira leitura
            </Button>
          </motion.div>
        )}

        {/* Data sections */}
        {hasData && !generating && (
          <>
            {/* Section 1 — Segment Summary */}
            <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <h2 className="font-heading text-lg font-medium text-foreground mb-3">
                Visão do segmento
              </h2>
              <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {data.segment_summary}
                </p>
              </div>
            </motion.section>

            {/* Section 1.5 — Real Market Signals */}
            {data.signals.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={0.5}>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Sinais reais de mercado
                  </h2>
                  <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                    via pesquisa web
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {data.signals.map((signal, i) => {
                    const relevanceStyle = signal.relevance === "alta"
                      ? "border-accent/20 bg-accent/5"
                      : signal.relevance === "media"
                      ? "border-border"
                      : "border-border/50";
                    return (
                      <div key={i} className={`bg-card rounded-2xl border ${relevanceStyle} p-5 shadow-sm`}>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="text-sm font-semibold text-foreground">{signal.title}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                            signal.relevance === "alta" ? "bg-accent/10 text-accent" :
                            signal.relevance === "media" ? "bg-muted text-muted-foreground" :
                            "bg-muted/50 text-muted-foreground"
                          }`}>
                            {signal.relevance}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{signal.description}</p>
                        <p className="text-[11px] text-muted-foreground/70 italic">
                          Fonte: {signal.source_context}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Saturation */}
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={1}>
                <div className="flex items-center gap-2 mb-3">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Saturação detectada
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.saturation.map((item, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.pattern}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{item.why_it_matters}</p>
                      <div className="bg-accent/5 rounded-lg px-3 py-2 border border-accent/10">
                        <p className="text-xs text-foreground">
                          <span className="text-accent font-medium">Direção: </span>
                          {item.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Opportunities */}
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={2}>
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Oportunidades identificadas
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.opportunities.map((item, i) => (
                    <div key={i} className="bg-card rounded-2xl border border-accent/10 p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.territory}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{item.why_it_matters}</p>
                      <div className="bg-accent/5 rounded-lg px-3 py-2 border border-accent/10">
                        <p className="text-xs text-foreground">
                          <span className="text-accent font-medium">Explorar: </span>
                          {item.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Section 3 — Strategic Alerts */}
            {data.alerts.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={3}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Alertas do seu mercado
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-5 ${URGENCY_STYLES[alert.urgency] || URGENCY_STYLES.baixa}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <h3 className="text-sm font-semibold mb-1">{alert.title}</h3>
                          <p className="text-xs opacity-80">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Section 4 — Recommendations */}
            {data.recommendations.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={4}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h2 className="font-heading text-lg font-medium text-foreground">
                    Próximos movimentos recomendados
                  </h2>
                </div>
                <div className="space-y-3">
                  {data.recommendations.map((rec, i) => {
                    const Icon = MODULE_ICONS[rec.module] || Target;
                    return (
                      <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Icon className="h-3.5 w-3.5 text-accent" />
                              </div>
                              <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1.5">{rec.insight}</p>
                            <p className="text-xs text-foreground">{rec.action}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl shrink-0 text-xs"
                            onClick={() => navigate(MODULE_PATHS[rec.module] || "/estrategia-ia")}
                          >
                            {MODULE_LABELS[rec.module] || "Abrir"}
                            <ArrowRight className="ml-1.5 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Citations */}
            {data.citations.length > 0 && (
              <motion.section variants={fadeUp} initial="hidden" animate="visible" custom={5.5}>
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Radar className="h-3 w-3" />
                    <span>{data.citations.length} fontes consultadas na pesquisa</span>
                  </summary>
                  <div className="mt-3 bg-muted/20 rounded-xl border border-border p-4 space-y-1.5">
                    {data.citations.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] text-muted-foreground hover:text-accent truncate transition-colors"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </details>
              </motion.section>
            )}

            {/* Update presence */}
            <motion.div
              className="bg-muted/30 rounded-2xl border border-border p-4 flex items-center justify-between"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={6}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <p className="text-xs text-muted-foreground">
                  {data.citations.length > 0
                    ? "Radar alimentado por pesquisa web em tempo real + análise estratégica."
                    : "O radar é atualizado com base no seu posicionamento e segmento de atuação."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={generateRadar}
                disabled={generating}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Atualizar
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default RadarMercado;
